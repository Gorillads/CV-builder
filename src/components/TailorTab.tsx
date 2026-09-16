import { useState } from "react";
import { useStore, isActivitySelected } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { Lang } from "../model/types";
import { t } from "../i18n";
import { defaultVariant, variantsFor, isInSidebar } from "../data/designTokens";

/** An item's own bullet pool, checkable one by one — the counterpart to
 *  the item-level checkbox above it. Content tab owns the text (adding/
 *  editing/removing bullets); this tab owns which of them make it onto
 *  the current CV, exactly like item selection itself. Drag-reorders the
 *  same way category and item rows do, since activities have no stable
 *  id of their own — position is identity for the length of one drag. */
function ActivityChecklist({ itemId, lang }: { itemId: string; lang: Lang }) {
  const item = useStore((s) => s.items[itemId]);
  const selected = useStore(
    useShallow((s) => (item ? item.activities.map((_, i) => isActivitySelected(s, item, i)) : [])),
  );
  const toggleActivitySelected = useStore((s) => s.toggleActivitySelected);
  const reorderActivity = useStore((s) => s.reorderActivity);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!item || !item.activities.length) return null;

  return (
    <div className="activity-checklist">
      {item.activities.map((a, i) => (
        <label
          className={
            "activity-checklist-row" +
            (draggedIndex === i ? " dragging" : "") +
            (dragOverIndex === i && draggedIndex !== i ? " drag-over" : "")
          }
          key={i}
          draggable
          onDragStart={(e) => {
            setDraggedIndex(i);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragOverIndex !== i) setDragOverIndex(i);
          }}
          onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedIndex !== null && draggedIndex !== i) reorderActivity(itemId, draggedIndex, i);
            setDraggedIndex(null);
            setDragOverIndex(null);
          }}
          onDragEnd={() => {
            setDraggedIndex(null);
            setDragOverIndex(null);
          }}
        >
          <span className="drag-handle drag-handle--small" aria-hidden="true">
            ⠿
          </span>
          <input type="checkbox" checked={selected[i]} onChange={() => toggleActivitySelected(itemId, i)} />
          {a[lang] || a.da}
        </label>
      ))}
    </div>
  );
}

function ItemChecklist({ categoryId, lang }: { categoryId: string; lang: Lang }) {
  const T = t(lang);
  const items = useStore((s) => s.items);
  const itemOrder = useStore(useShallow((s) => s.itemOrder[categoryId] ?? []));
  const selectedIds = useStore(useShallow((s) => s.selectedItems[categoryId] ?? []));
  const toggleItemInCv = useStore((s) => s.toggleItemInCv);
  const reorderItem = useStore((s) => s.reorderItem);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  if (!itemOrder.length) return null;

  return (
    <div className="item-checklist">
      {itemOrder.map((id) => {
        const item = items[id];
        if (!item) return null;
        const text = item[lang];
        const desc = text.desc.trim();
        const label = text.head || (desc.length > 40 ? `${desc.slice(0, 40)}…` : desc) || T.custom;
        return (
          <div
            key={id}
            className={
              "item-checklist-item" +
              (draggedId === id ? " dragging" : "") +
              (dragOverId === id && draggedId !== id ? " drag-over" : "")
            }
            draggable
            onDragStart={(e) => {
              setDraggedId(id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverId !== id) setDragOverId(id);
            }}
            onDragLeave={() => setDragOverId((cur) => (cur === id ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedId && draggedId !== id) reorderItem(categoryId, draggedId, id);
              setDraggedId(null);
              setDragOverId(null);
            }}
            onDragEnd={() => {
              setDraggedId(null);
              setDragOverId(null);
            }}
          >
            <label className="item-checklist-row">
              <span className="drag-handle drag-handle--small" aria-hidden="true">
                ⠿
              </span>
              <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleItemInCv(categoryId, id)} />
              {label}
            </label>
            <ActivityChecklist itemId={id} lang={lang} />
          </div>
        );
      })}
    </div>
  );
}

export function TailorTab({ lang }: { lang: Lang }) {
  const T = t(lang);
  const order = useStore((s) => s.order);
  const categories = useStore((s) => s.categories);
  const on = useStore((s) => s.on);
  const variant = useStore((s) => s.variant);
  const sidebarPlacement = useStore((s) => s.sidebarPlacement);
  const design = useStore((s) => s.design);
  const toggleCategoryOn = useStore((s) => s.toggleCategoryOn);
  const setVariant = useStore((s) => s.setVariant);
  const setSidebarPlacement = useStore((s) => s.setSidebarPlacement);
  const moveCategory = useStore((s) => s.moveCategory);
  const reorderCategory = useStore((s) => s.reorderCategory);
  const appliedTitle = useStore((s) => s.appliedTitle);
  const setAppliedTitle = useStore((s) => s.setAppliedTitle);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const visible = order.filter((id) => categories[id] && !categories[id].isHidden);

  return (
    <div className="tab-content">
      <div className="tailor-field">
        <label>{T.appliedTitle}</label>
        <input
          className="field"
          value={appliedTitle[lang]}
          onChange={(e) => setAppliedTitle(lang, e.target.value)}
        />
      </div>

      <div className="tailor-list">
        {visible.map((id, i) => {
          const cat = categories[id];
          const options = variantsFor();
          return (
            <div className="tailor-item" key={id}>
              <div
                className={
                  "tailor-row" +
                  (draggedId === id ? " dragging" : "") +
                  (dragOverId === id && draggedId !== id ? " drag-over" : "")
                }
                draggable
                onDragStart={(e) => {
                  setDraggedId(id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverId !== id) setDragOverId(id);
                }}
                onDragLeave={() => setDragOverId((cur) => (cur === id ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId && draggedId !== id) reorderCategory(draggedId, id);
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                }}
              >
                <span className="drag-handle" aria-hidden="true" title={T.dragToReorder}>
                  ⠿
                </span>
                <label className="in-cv">
                  <input type="checkbox" checked={!!on[id]} onChange={() => toggleCategoryOn(id)} />
                  {cat.title[lang]}
                </label>
                <select
                  className="field placement-select"
                  value={variant[id] ?? defaultVariant()}
                  onChange={(e) => setVariant(id, e.target.value)}
                  title={T.format}
                >
                  {options.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name[lang]}
                    </option>
                  ))}
                </select>
                {design.struct === "sidebar" &&
                  (() => {
                    const inSidebar = isInSidebar(id, sidebarPlacement);
                    return (
                      <button
                        type="button"
                        className={"pill sidebar-placement-toggle" + (inSidebar ? " active" : "")}
                        onClick={() => setSidebarPlacement(id, !inSidebar)}
                        title={inSidebar ? T.moveToMainColumn : T.moveToSidebar}
                      >
                        {inSidebar ? T.inSidebar : T.inMainColumn}
                      </button>
                    );
                  })()}
                <button type="button" className="icon-btn" disabled={i === 0} onClick={() => moveCategory(id, -1)} title={T.moveUp}>
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={i === visible.length - 1}
                  onClick={() => moveCategory(id, 1)}
                  title={T.moveDown}
                >
                  ↓
                </button>
              </div>
              <ItemChecklist categoryId={id} lang={lang} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
