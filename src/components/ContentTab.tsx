import { useState } from "react";
import { useStore } from "../state/store";
import type { Lang, LibraryItem } from "../model/types";
import { t } from "../i18n";
import { CategoryCard } from "./CategoryCard";
import { categoryMatchesQuery } from "../search/contentSearch";
import { PRESETS } from "../data/presets";

export function ContentTab({ lang }: { lang: Lang }) {
  const T = t(lang);
  const order = useStore((s) => s.order);
  const categories = useStore((s) => s.categories);
  const items = useStore((s) => s.items);
  const itemOrder = useStore((s) => s.itemOrder);
  const addCategory = useStore((s) => s.addCategory);
  const reorderCategory = useStore((s) => s.reorderCategory);
  const applyPreset = useStore((s) => s.applyPreset);
  const [newName, setNewName] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const query = searchInput.trim().toLowerCase();

  const visible = order.filter((id) => {
    const cat = categories[id];
    if (!cat) return false;
    if (!query) return true;
    const catItems = (itemOrder[id] ?? [])
      .map((itemId) => items[itemId])
      .filter((it): it is LibraryItem => !!it);
    return categoryMatchesQuery(cat, catItems, lang, query);
  });

  const handleApplyPreset = (id: string, name: string) => {
    if (window.confirm(T.confirmApplyPreset(name))) applyPreset(id);
  };

  return (
    <div className="tab-content">
      <div className="preset-bar">
        <span className="preset-bar-label">{T.presetsLabel}</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-btn"
            title={preset.description[lang]}
            onClick={() => handleApplyPreset(preset.id, preset.name[lang])}
          >
            {preset.name[lang]}
          </button>
        ))}
      </div>
      <input
        className="field search-field"
        placeholder={T.searchContentPlaceholder}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      {query && visible.length === 0 && <p className="search-empty">{T.searchNoResults}</p>}
      {visible.map((id) => (
        <CategoryCard
          key={id}
          category={categories[id]}
          lang={lang}
          searchQuery={query}
          dragProps={{
            isDragging: draggedId === id,
            isDragOver: dragOverId === id && draggedId !== id,
            onHandleDragStart: () => setDraggedId(id),
            onDragOver: () => setDragOverId(id),
            onDrop: () => {
              if (draggedId && draggedId !== id) reorderCategory(draggedId, id);
              setDraggedId(null);
              setDragOverId(null);
            },
            onDragEnd: () => {
              setDraggedId(null);
              setDragOverId(null);
            },
          }}
        />
      ))}
      <form
        className="new-category-form"
        onSubmit={(e) => {
          e.preventDefault();
          addCategory(newName);
          setNewName("");
        }}
      >
        <input
          className="field"
          placeholder={T.newCategoryPlaceholder}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn">
          + {T.newCategory}
        </button>
      </form>
    </div>
  );
}
