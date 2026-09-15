import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { Category, Lang } from "../model/types";
import { t } from "../i18n";

function ItemEditor({ itemId, lang }: { itemId: string; lang: Lang }) {
  const item = useStore((s) => s.items[itemId]);
  const setItemField = useStore((s) => s.setItemField);
  const setItemGroup = useStore((s) => s.setItemGroup);
  const deleteItem = useStore((s) => s.deleteItem);
  const addActivity = useStore((s) => s.addActivity);
  const removeActivity = useStore((s) => s.removeActivity);
  const setActivity = useStore((s) => s.setActivity);
  const toggleActivitySelected = useStore((s) => s.toggleActivitySelected);
  const selectedActivityIds = useStore((s) => s.selectedActivities[itemId]);
  const T = t(lang);

  if (!item) return null;
  const text = item[lang];

  const handleDelete = () => {
    if (window.confirm(T.confirmDeleteItem(text.head || "?"))) deleteItem(itemId);
  };

  return (
    <div className="item-card">
      <div className="item-card-row item-card-row--end">
        <button type="button" className="link-btn danger" onClick={handleDelete}>
          {T.deleteItem}
        </button>
      </div>

      <div className="item-card-grid">
        <input
          className="field"
          placeholder={T.heading}
          value={text.head}
          onChange={(e) => setItemField(itemId, lang, "head", e.target.value)}
        />
        <input
          className="field"
          placeholder={T.yearSource}
          value={text.meta}
          onChange={(e) => setItemField(itemId, lang, "meta", e.target.value)}
        />
      </div>
      <input
        className="field item-group"
        placeholder={T.groupPlaceholder}
        title={T.group}
        value={item.group?.[lang] ?? ""}
        onChange={(e) => setItemGroup(itemId, lang, e.target.value)}
      />
      <textarea
        className="field"
        placeholder={T.description}
        rows={2}
        value={text.desc}
        onChange={(e) => setItemField(itemId, lang, "desc", e.target.value)}
      />
      <div className="activities">
        <div className="activities-label">{T.activities}</div>
        {item.activities.map((a, i) => (
          <div className="activity-row" key={i}>
            <input
              type="checkbox"
              checked={selectedActivityIds ? selectedActivityIds.includes(i) : true}
              onChange={() => toggleActivitySelected(itemId, i)}
              title={T.inCv}
            />
            <input
              className="field"
              value={a[lang]}
              onChange={(e) => setActivity(itemId, i, lang, e.target.value)}
            />
            <button type="button" className="icon-btn" onClick={() => removeActivity(itemId, i)}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className="link-btn" onClick={() => addActivity(itemId, "", "")}>
          + {T.addActivity}
        </button>
      </div>
    </div>
  );
}

export function CategoryCard({ category, lang }: { category: Category; lang: Lang }) {
  const T = t(lang);
  const items = useStore(
    useShallow((s) => Object.values(s.items).filter((it) => it.categoryId === category.id)),
  );
  const selectedIds = useStore(useShallow((s) => s.selectedItems[category.id] ?? []));
  const setCategoryTitle = useStore((s) => s.setCategoryTitle);
  const setCategoryBlurb = useStore((s) => s.setCategoryBlurb);
  const removeCategory = useStore((s) => s.removeCategory);
  const addItem = useStore((s) => s.addItem);

  const orderedIds = [...selectedIds, ...items.map((it) => it.id).filter((id) => !selectedIds.includes(id))];

  const handleRemove = () => {
    const msg = category.isCustom ? T.confirmDeleteCategory(category.title[lang]) : T.confirmHideCategory(category.title[lang]);
    if (window.confirm(msg)) removeCategory(category.id);
  };

  return (
    <div className="category-card">
      <div className="category-card-header">
        <input
          className="field category-title"
          value={category.title[lang]}
          onChange={(e) => setCategoryTitle(category.id, lang, e.target.value)}
        />
        {category.isCustom && <span className="badge">{T.custom}</span>}
        <button type="button" className="link-btn danger" onClick={handleRemove}>
          {category.isCustom ? T.deleteCategory : T.hideCategory}
        </button>
      </div>
      <textarea
        className="field"
        placeholder={T.blurb}
        rows={2}
        value={category.blurb[lang]}
        onChange={(e) => setCategoryBlurb(category.id, lang, e.target.value)}
      />
      <div className="item-list">
        {orderedIds.map((id) => (
          <ItemEditor key={id} itemId={id} lang={lang} />
        ))}
        <button type="button" className="link-btn" onClick={() => addItem(category.id)}>
          + {T.addElement}
        </button>
      </div>
    </div>
  );
}
