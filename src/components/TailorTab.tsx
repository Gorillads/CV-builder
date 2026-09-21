import { useState } from "react";
import { useStore, isActivitySelected } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { Lang } from "../model/types";
import { t } from "../i18n";
import { defaultVariant, variantsFor, defaultActivityStyle, ACTIVITY_STYLES, isInSidebar } from "../data/designTokens";

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
  const variant = useStore((s) => s.variant);
  const activityStyle = useStore((s) => s.activityStyle);
  const toggleItemInCv = useStore((s) => s.toggleItemInCv);
  const toggleItemLogoVisible = useStore((s) => s.toggleItemLogoVisible);
  const setActivityStyle = useStore((s) => s.setActivityStyle);
  const reorderItem = useStore((s) => s.reorderItem);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  if (!itemOrder.length) return null;

  // Activities only render at all for entry variants that show the full
  // entry body — "line", "chips" and "inline" never show them, so the
  // per-item format toggle would have nothing to affect there.
  const categoryVariant = variant[categoryId] ?? defaultVariant();
  const showsActivities = categoryVariant !== "line" && categoryVariant !== "chips" && categoryVariant !== "inline";

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
            <div className="item-checklist-row">
              <label className="item-checklist-label">
                <span className="drag-handle drag-handle--small" aria-hidden="true">
                  ⠿
                </span>
                <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleItemInCv(categoryId, id)} />
                {label}
              </label>
              {item.logo && (
                <label className="in-cv item-logo-toggle">
                  <input
                    type="checkbox"
                    checked={item.logoVisible}
                    onChange={() => toggleItemLogoVisible(id)}
                  />
                  <img src={item.logo} alt="" className="logo-thumb logo-thumb--tiny" />
                  {T.showLogo}
                </label>
              )}
              {showsActivities && item.activities.length > 0 && (
                <select
                  className="field placement-select"
                  value={activityStyle[id] ?? defaultActivityStyle()}
                  onChange={(e) => setActivityStyle(id, e.target.value)}
                  title={T.activityFormat}
                >
                  {ACTIVITY_STYLES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name[lang]}
                    </option>
                  ))}
                </select>
              )}
            </div>
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
        {visible.map((id) => {
          const cat = categories[id];
          const options = variantsFor();
          const currentVariant = variant[id] ?? defaultVariant();
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
                  value={currentVariant}
                  onChange={(e) => setVariant(id, e.target.value)}
                  title={T.format}
                >
                  {options.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name[lang]}
                    </option>
                  ))}
                </select>
                {(design.struct === "sidebar" || design.struct === "two") &&
                  (() => {
                    const inSidebar = isInSidebar(id, sidebarPlacement);
                    const isTwo = design.struct === "two";
                    const onLabel = isTwo ? T.inColumnRight : T.inSidebar;
                    const offLabel = isTwo ? T.inColumnLeft : T.inMainColumn;
                    const onTitle = isTwo ? T.moveToColumnLeft : T.moveToMainColumn;
                    const offTitle = isTwo ? T.moveToColumnRight : T.moveToSidebar;
                    return (
                      <button
                        type="button"
                        className={"pill sidebar-placement-toggle" + (inSidebar ? " active" : "")}
                        onClick={() => setSidebarPlacement(id, !inSidebar)}
                        title={inSidebar ? onTitle : offTitle}
                      >
                        {inSidebar ? onLabel : offLabel}
                      </button>
                    );
                  })()}
              </div>
              <ItemChecklist categoryId={id} lang={lang} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
