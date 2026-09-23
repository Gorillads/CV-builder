import { useRef, useState } from "react";
import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { Category, Lang, LibraryItem } from "../model/types";
import { t } from "../i18n";
import { activityMatchesQuery, itemMatchesQuery } from "../search/contentSearch";
import { resizeImage } from "../utils/resizeImage";

/** Category-level drag handling is owned by ContentTab (it sees every
 *  card, not just one), so CategoryCard only renders the handle and
 *  forwards its events — the same split used for items within the card. */
export interface CategoryDragProps {
  isDragging: boolean;
  isDragOver: boolean;
  onHandleDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

interface IndexDragProps {
  isDragging: boolean;
  isDragOver: boolean;
  onHandleDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

/** Rough one-line budget for a bullet at the CV's default font size and
 *  page width (706px content width ÷ ~6.3px average character width for
 *  a 12.5–13px sans body font) — a nudge toward scannable, single-line
 *  bullets rather than a precise per-layout measurement, since the exact
 *  wrap point also depends on the chosen font, density and struct. */
const ACTIVITY_SOFT_LIMIT = 110;

function ActivityEditor({
  itemId,
  index,
  lang,
  dragProps,
  searchQuery,
}: {
  itemId: string;
  index: number;
  lang: Lang;
  dragProps: IndexDragProps;
  /** Pre-trimmed, lowercased search text from the Content tab's search
   *  bar, or "" when not searching — a matching activity is shown
   *  expanded even if isCollapsed, so the hit is actually visible. */
  searchQuery: string;
}) {
  const activity = useStore((s) => s.items[itemId]?.activities[index]);
  const removeActivity = useStore((s) => s.removeActivity);
  const setActivity = useStore((s) => s.setActivity);
  const toggleActivityCollapsed = useStore((s) => s.toggleActivityCollapsed);
  const T = t(lang);

  if (!activity) return null;

  const matchesSearch = !!searchQuery && activityMatchesQuery(activity, lang, searchQuery);
  const showCollapsed = activity.isCollapsed && !matchesSearch;

  const rowClass =
    "activity-row" +
    (showCollapsed ? " activity-row--collapsed" : "") +
    (dragProps.isDragging ? " dragging" : "") +
    (dragProps.isDragOver ? " drag-over" : "");

  if (showCollapsed) {
    return (
      <div
        className={rowClass}
        onDragOver={(e) => {
          e.preventDefault();
          dragProps.onDragOver();
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragProps.onDrop();
        }}
      >
        <span
          className="drag-handle drag-handle--small"
          draggable
          onDragStart={dragProps.onHandleDragStart}
          onDragEnd={dragProps.onDragEnd}
        >
          ⠿
        </span>
        <button type="button" className="icon-btn" onClick={() => toggleActivityCollapsed(itemId, index)} title={T.expand}>
          ▸
        </button>
        <span className="collapsed-label">{activity[lang]}</span>
      </div>
    );
  }

  const length = activity[lang].length;
  const overLimit = length > ACTIVITY_SOFT_LIMIT;

  return (
    <div
      className={rowClass}
      onDragOver={(e) => {
        e.preventDefault();
        dragProps.onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragProps.onDrop();
      }}
    >
      <span
        className="drag-handle drag-handle--small"
        draggable
        onDragStart={dragProps.onHandleDragStart}
        onDragEnd={dragProps.onDragEnd}
      >
        ⠿
      </span>
      <button type="button" className="icon-btn" onClick={() => toggleActivityCollapsed(itemId, index)} title={T.collapse}>
        ▾
      </button>
      <input className="field" value={activity[lang]} onChange={(e) => setActivity(itemId, index, lang, e.target.value)} />
      <span className={"char-counter" + (overLimit ? " char-counter--over" : "")} title={T.charCounterHint}>
        {length}/{ACTIVITY_SOFT_LIMIT}
      </span>
      <button type="button" className="icon-btn" onClick={() => removeActivity(itemId, index)}>
        ×
      </button>
    </div>
  );
}

/** Same fallback chain TailorTab's item checklist uses, so an item's
 *  collapsed label matches what you'd recognize it by there too. */
function itemLabel(text: { head: string; desc: string }, fallback: string): string {
  const desc = text.desc.trim();
  return text.head || (desc.length > 40 ? `${desc.slice(0, 40)}…` : desc) || fallback;
}

function ItemEditor({
  itemId,
  lang,
  dragProps,
  searchQuery,
}: {
  itemId: string;
  lang: Lang;
  dragProps: CategoryDragProps;
  /** See ActivityEditor — CategoryCard only renders an ItemEditor at all
   *  while searching if this item matched, so a non-empty query here is
   *  reason enough to force it open. */
  searchQuery: string;
}) {
  const item = useStore((s) => s.items[itemId]);
  const setItemField = useStore((s) => s.setItemField);
  const setItemLogo = useStore((s) => s.setItemLogo);
  const deleteItem = useStore((s) => s.deleteItem);
  const addActivity = useStore((s) => s.addActivity);
  const reorderActivity = useStore((s) => s.reorderActivity);
  const toggleItemCollapsed = useStore((s) => s.toggleItemCollapsed);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const logoFileInput = useRef<HTMLInputElement>(null);
  const T = t(lang);

  if (!item) return null;
  const text = item[lang];

  const handleDelete = () => {
    if (window.confirm(T.confirmDeleteItem(text.head || "?"))) deleteItem(itemId);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    resizeImage(file, 200).then((logo) => setItemLogo(itemId, logo)).catch(() => window.alert(T.jsonImportError));
  };

  const showCollapsed = item.isCollapsed && !searchQuery;

  const cardClass =
    "item-card" +
    (showCollapsed ? " item-card--collapsed" : "") +
    (dragProps.isDragging ? " dragging" : "") +
    (dragProps.isDragOver ? " drag-over" : "");

  if (showCollapsed) {
    return (
      <div
        className={cardClass}
        onDragOver={(e) => {
          e.preventDefault();
          dragProps.onDragOver();
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragProps.onDrop();
        }}
      >
        <span
          className="drag-handle"
          draggable
          onDragStart={dragProps.onHandleDragStart}
          onDragEnd={dragProps.onDragEnd}
          title={T.dragToReorder}
        >
          ⠿
        </span>
        <button type="button" className="icon-btn" onClick={() => toggleItemCollapsed(itemId)} title={T.expand}>
          ▸
        </button>
        <span className="collapsed-label">{itemLabel(text, T.custom)}</span>
      </div>
    );
  }

  return (
    <div
      className={cardClass}
      onDragOver={(e) => {
        e.preventDefault();
        dragProps.onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragProps.onDrop();
      }}
    >
      <div className="item-card-row">
        <div className="item-card-row-left">
          <span
            className="drag-handle"
            draggable
            onDragStart={dragProps.onHandleDragStart}
            onDragEnd={dragProps.onDragEnd}
            title={T.dragToReorder}
          >
            ⠿
          </span>
          <button type="button" className="icon-btn" onClick={() => toggleItemCollapsed(itemId)} title={T.collapse}>
            ▾
          </button>
        </div>
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
      <div className="photo-upload-row">
        {item.logo && <img src={item.logo} alt="" className="logo-thumb" />}
        <button type="button" className="btn" onClick={() => logoFileInput.current?.click()}>
          {item.logo ? T.changeLogo : T.chooseLogo}
        </button>
        {item.logo && (
          <button type="button" className="link-btn danger" onClick={() => setItemLogo(itemId, "")}>
            {T.removeLogo}
          </button>
        )}
      </div>
      <input ref={logoFileInput} type="file" accept="image/*" hidden onChange={handleLogoFile} />
      <input
        className="field item-comment"
        placeholder={T.commentPlaceholder}
        title={T.comment}
        value={text.comment}
        onChange={(e) => setItemField(itemId, lang, "comment", e.target.value)}
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
        {item.activities.map((_, i) => (
          <ActivityEditor
            key={i}
            itemId={itemId}
            index={i}
            lang={lang}
            searchQuery={searchQuery}
            dragProps={{
              isDragging: draggedIndex === i,
              isDragOver: dragOverIndex === i && draggedIndex !== i,
              onHandleDragStart: () => setDraggedIndex(i),
              onDragOver: () => setDragOverIndex(i),
              onDrop: () => {
                if (draggedIndex !== null && draggedIndex !== i) reorderActivity(itemId, draggedIndex, i);
                setDraggedIndex(null);
                setDragOverIndex(null);
              },
              onDragEnd: () => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              },
            }}
          />
        ))}
        <button type="button" className="link-btn" onClick={() => addActivity(itemId, "", "")}>
          + {T.addActivity}
        </button>
      </div>
    </div>
  );
}

export function CategoryCard({
  category,
  lang,
  dragProps,
  searchQuery = "",
}: {
  category: Category;
  lang: Lang;
  /** Optional so CategoryCard still renders sensibly if ever used without
   *  a drag-capable parent; ContentTab always supplies it. */
  dragProps?: CategoryDragProps;
  /** Pre-trimmed, lowercased text from the Content tab's search bar. Only
   *  categories that already matched (see ContentTab) get rendered while
   *  this is set, so its mere presence here means "expand and show only
   *  the elements that matched too" rather than needing a fresh check. */
  searchQuery?: string;
}) {
  const T = t(lang);
  const itemOrder = useStore(useShallow((s) => s.itemOrder[category.id] ?? []));
  const items = useStore((s) => s.items);
  const setCategoryTitle = useStore((s) => s.setCategoryTitle);
  const setCategoryBlurb = useStore((s) => s.setCategoryBlurb);
  const toggleCategoryCollapsed = useStore((s) => s.toggleCategoryCollapsed);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const duplicateCategory = useStore((s) => s.duplicateCategory);
  const addItem = useStore((s) => s.addItem);
  const reorderItem = useStore((s) => s.reorderItem);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const handleDelete = () => {
    if (window.confirm(T.confirmDeleteCategory(category.title[lang]))) deleteCategory(category.id);
  };

  const visibleItemIds = searchQuery
    ? itemOrder.filter((id) => {
        const it: LibraryItem | undefined = items[id];
        return it && itemMatchesQuery(it, lang, searchQuery);
      })
    : itemOrder;

  const showCollapsed = category.isCollapsed && !searchQuery;

  const cardClass =
    "category-card" +
    (showCollapsed ? " category-card--collapsed" : "") +
    (dragProps?.isDragging ? " dragging" : "") +
    (dragProps?.isDragOver ? " drag-over" : "");

  if (showCollapsed) {
    return (
      <div
        className={cardClass}
        onDragOver={(e) => {
          if (!dragProps) return;
          e.preventDefault();
          dragProps.onDragOver();
        }}
        onDrop={(e) => {
          if (!dragProps) return;
          e.preventDefault();
          dragProps.onDrop();
        }}
      >
        {dragProps && (
          <span
            className="drag-handle"
            draggable
            onDragStart={dragProps.onHandleDragStart}
            onDragEnd={dragProps.onDragEnd}
            title={T.dragToReorder}
          >
            ⠿
          </span>
        )}
        <button type="button" className="icon-btn" onClick={() => toggleCategoryCollapsed(category.id)} title={T.expand}>
          ▸
        </button>
        <span className="collapsed-label">{category.title[lang]}</span>
      </div>
    );
  }

  return (
    <div
      className={cardClass}
      onDragOver={(e) => {
        if (!dragProps) return;
        e.preventDefault();
        dragProps.onDragOver();
      }}
      onDrop={(e) => {
        if (!dragProps) return;
        e.preventDefault();
        dragProps.onDrop();
      }}
    >
      <div className="category-card-header">
        {dragProps && (
          <span
            className="drag-handle"
            draggable
            onDragStart={dragProps.onHandleDragStart}
            onDragEnd={dragProps.onDragEnd}
            title={T.dragToReorder}
          >
            ⠿
          </span>
        )}
        <button type="button" className="icon-btn" onClick={() => toggleCategoryCollapsed(category.id)} title={T.collapse}>
          ▾
        </button>
        <input
          className="field category-title"
          value={category.title[lang]}
          onChange={(e) => setCategoryTitle(category.id, lang, e.target.value)}
        />
        {category.isCustom && <span className="badge">{T.custom}</span>}
        <button type="button" className="link-btn" onClick={() => duplicateCategory(category.id)}>
          {T.duplicateCategory}
        </button>
        <button type="button" className="link-btn danger" onClick={handleDelete}>
          {T.deleteCategory}
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
        {visibleItemIds.map((id) => (
          <ItemEditor
            key={id}
            itemId={id}
            lang={lang}
            searchQuery={searchQuery}
            dragProps={{
              isDragging: draggedItemId === id,
              isDragOver: dragOverItemId === id && draggedItemId !== id,
              onHandleDragStart: () => setDraggedItemId(id),
              onDragOver: () => setDragOverItemId(id),
              onDrop: () => {
                if (draggedItemId && draggedItemId !== id) reorderItem(category.id, draggedItemId, id);
                setDraggedItemId(null);
                setDragOverItemId(null);
              },
              onDragEnd: () => {
                setDraggedItemId(null);
                setDragOverItemId(null);
              },
            }}
          />
        ))}
        <button type="button" className="link-btn" onClick={() => addItem(category.id)}>
          + {T.addElement}
        </button>
      </div>
    </div>
  );
}
