import { useState } from "react";
import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { Category, Lang } from "../model/types";
import { t } from "../i18n";

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
}: {
  itemId: string;
  index: number;
  lang: Lang;
  dragProps: IndexDragProps;
}) {
  const activity = useStore((s) => s.items[itemId]?.activities[index]);
  const removeActivity = useStore((s) => s.removeActivity);
  const setActivity = useStore((s) => s.setActivity);
  const toggleActivityCollapsed = useStore((s) => s.toggleActivityCollapsed);
  const T = t(lang);

  if (!activity) return null;

  const rowClass =
    "activity-row" +
    (activity.isCollapsed ? " activity-row--collapsed" : "") +
    (dragProps.isDragging ? " dragging" : "") +
    (dragProps.isDragOver ? " drag-over" : "");

  if (activity.isCollapsed) {
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
}: {
  itemId: string;
  lang: Lang;
  dragProps: CategoryDragProps;
}) {
  const item = useStore((s) => s.items[itemId]);
  const setItemField = useStore((s) => s.setItemField);
  const deleteItem = useStore((s) => s.deleteItem);
  const addActivity = useStore((s) => s.addActivity);
  const reorderActivity = useStore((s) => s.reorderActivity);
  const toggleItemCollapsed = useStore((s) => s.toggleItemCollapsed);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const T = t(lang);

  if (!item) return null;
  const text = item[lang];

  const handleDelete = () => {
    if (window.confirm(T.confirmDeleteItem(text.head || "?"))) deleteItem(itemId);
  };

  const cardClass =
    "item-card" +
    (item.isCollapsed ? " item-card--collapsed" : "") +
    (dragProps.isDragging ? " dragging" : "") +
    (dragProps.isDragOver ? " drag-over" : "");

  if (item.isCollapsed) {
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
}: {
  category: Category;
  lang: Lang;
  /** Optional so CategoryCard still renders sensibly if ever used without
   *  a drag-capable parent; ContentTab always supplies it. */
  dragProps?: CategoryDragProps;
}) {
  const T = t(lang);
  const itemOrder = useStore(useShallow((s) => s.itemOrder[category.id] ?? []));
  const setCategoryTitle = useStore((s) => s.setCategoryTitle);
  const setCategoryBlurb = useStore((s) => s.setCategoryBlurb);
  const hideCategory = useStore((s) => s.hideCategory);
  const unhideCategory = useStore((s) => s.unhideCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const addItem = useStore((s) => s.addItem);
  const reorderItem = useStore((s) => s.reorderItem);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const handleHide = () => {
    if (window.confirm(T.confirmHideCategory(category.title[lang]))) hideCategory(category.id);
  };

  const handleDelete = () => {
    if (window.confirm(T.confirmDeleteCategory(category.title[lang]))) deleteCategory(category.id);
  };

  const cardClass =
    "category-card" +
    (category.isHidden ? " category-card--collapsed" : "") +
    (dragProps?.isDragging ? " dragging" : "") +
    (dragProps?.isDragOver ? " drag-over" : "");

  if (category.isHidden) {
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
        <span className="collapsed-label">{category.title[lang]}</span>
        <button type="button" className="link-btn" onClick={() => unhideCategory(category.id)}>
          {T.showCategory}
        </button>
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
        <input
          className="field category-title"
          value={category.title[lang]}
          onChange={(e) => setCategoryTitle(category.id, lang, e.target.value)}
        />
        {category.isCustom && <span className="badge">{T.custom}</span>}
        <button type="button" className="link-btn" onClick={handleHide}>
          {T.hideCategory}
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
        {itemOrder.map((id) => (
          <ItemEditor
            key={id}
            itemId={id}
            lang={lang}
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
