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

  if (!activity) return null;

  return (
    <div
      className={"activity-row" + (dragProps.isDragging ? " dragging" : "") + (dragProps.isDragOver ? " drag-over" : "")}
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
      <input className="field" value={activity[lang]} onChange={(e) => setActivity(itemId, index, lang, e.target.value)} />
      <button type="button" className="icon-btn" onClick={() => removeActivity(itemId, index)}>
        ×
      </button>
    </div>
  );
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const T = t(lang);

  if (!item) return null;
  const text = item[lang];

  const handleDelete = () => {
    if (window.confirm(T.confirmDeleteItem(text.head || "?"))) deleteItem(itemId);
  };

  return (
    <div
      className={"item-card" + (dragProps.isDragging ? " dragging" : "") + (dragProps.isDragOver ? " drag-over" : "")}
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
  const removeCategory = useStore((s) => s.removeCategory);
  const addItem = useStore((s) => s.addItem);
  const reorderItem = useStore((s) => s.reorderItem);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const handleRemove = () => {
    const msg = category.isCustom ? T.confirmDeleteCategory(category.title[lang]) : T.confirmHideCategory(category.title[lang]);
    if (window.confirm(msg)) removeCategory(category.id);
  };

  return (
    <div
      className={"category-card" + (dragProps?.isDragging ? " dragging" : "") + (dragProps?.isDragOver ? " drag-over" : "")}
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
