import { useState } from "react";
import { isActivitySelected } from "../state/store";
import { useActiveStore } from "../state/tabs";
import { useShallow } from "zustand/react/shallow";
import type { Lang } from "../model/types";
import { t } from "../i18n";
import { defaultVariant, variantsFor, defaultActivityStyle, ACTIVITY_STYLES, isInSidebar } from "../data/designTokens";
import { SizeSlider } from "./DesignTab";
import { useHoverTarget, isExactHover, isCategoryAncestorHover, isItemAncestorHover } from "../state/hoverTarget";

/** An item's own bullet pool, checkable one by one — the counterpart to
 *  the item-level checkbox above it. Content tab owns the text (adding/
 *  editing/removing bullets); this tab owns which of them make it onto
 *  the current CV, exactly like item selection itself. Drag-reorders the
 *  same way category and item rows do, since activities have no stable
 *  id of their own — position is identity for the length of one drag. */
function ActivityChecklist({ itemId, lang }: { itemId: string; lang: Lang }) {
  const item = useActiveStore((s) => s.items[itemId]);
  const selected = useActiveStore(
    useShallow((s) => (item ? item.activities.map((_, i) => isActivitySelected(s, item, i)) : [])),
  );
  const toggleActivitySelected = useActiveStore((s) => s.toggleActivitySelected);
  const reorderActivity = useActiveStore((s) => s.reorderActivity);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const hoverTarget = useHoverTarget();

  if (!item || !item.activities.length) return null;

  return (
    <div className="activity-checklist">
      {item.activities.map((a, i) => (
        <label
          className={
            "activity-checklist-row" +
            (draggedIndex === i ? " dragging" : "") +
            (dragOverIndex === i && draggedIndex !== i ? " drag-over" : "") +
            (isExactHover(hoverTarget, "activity", { itemId, activityIndex: i }) ? " hover-exact" : "")
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
  const items = useActiveStore((s) => s.items);
  const itemOrder = useActiveStore(useShallow((s) => s.itemOrder[categoryId] ?? []));
  const selectedIds = useActiveStore(useShallow((s) => s.selectedItems[categoryId] ?? []));
  const variant = useActiveStore((s) => s.variant);
  const activityStyle = useActiveStore((s) => s.activityStyle);
  const toggleItemInCv = useActiveStore((s) => s.toggleItemInCv);
  const toggleItemLogoVisible = useActiveStore((s) => s.toggleItemLogoVisible);
  const setItemLogoSize = useActiveStore((s) => s.setItemLogoSize);
  const setActivityStyle = useActiveStore((s) => s.setActivityStyle);
  const toggleItemCollapsed = useActiveStore((s) => s.toggleItemCollapsed);
  const reorderItem = useActiveStore((s) => s.reorderItem);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const hoverTarget = useHoverTarget();

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
        const hasActivities = showsActivities && item.activities.length > 0;
        const hasLogoSize = !!item.logo && item.logoVisible;
        const collapsible = hasActivities || hasLogoSize;
        const showCollapsed = collapsible && item.isCollapsed;
        return (
          <div
            key={id}
            className={
              "item-checklist-item" +
              (draggedId === id ? " dragging" : "") +
              (dragOverId === id && draggedId !== id ? " drag-over" : "") +
              (isItemAncestorHover(hoverTarget, id) ? " hover-ancestor" : "")
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
              <label
                className={
                  "item-checklist-label" +
                  (isExactHover(hoverTarget, ["entryHeading", "chip"], { itemId: id }) ? " hover-exact" : "")
                }
              >
                <span className="drag-handle drag-handle--small" aria-hidden="true">
                  ⠿
                </span>
                <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleItemInCv(categoryId, id)} />
                {label}
              </label>
              {collapsible && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => toggleItemCollapsed(id)}
                  title={showCollapsed ? T.expand : T.collapse}
                >
                  {showCollapsed ? "▸" : "▾"}
                </button>
              )}
              {item.logo && (
                <label
                  className={"in-cv item-logo-toggle" + (isExactHover(hoverTarget, "logo", { itemId: id }) ? " hover-exact" : "")}
                >
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
            {!showCollapsed && hasLogoSize && (
              <div className="item-logo-size-row">
                <SizeSlider
                  label={T.itemLogoSize}
                  value={item.logoSize}
                  onChange={(v) => setItemLogoSize(id, v)}
                  followLabel={T.followGlobalLogoSize}
                  highlight={isExactHover(hoverTarget, "logo", { itemId: id })}
                />
              </div>
            )}
            {!showCollapsed && <ActivityChecklist itemId={id} lang={lang} />}
          </div>
        );
      })}
    </div>
  );
}

export function TailorTab({ lang }: { lang: Lang }) {
  const T = t(lang);
  const order = useActiveStore((s) => s.order);
  const categories = useActiveStore((s) => s.categories);
  const on = useActiveStore((s) => s.on);
  const variant = useActiveStore((s) => s.variant);
  const sidebarPlacement = useActiveStore((s) => s.sidebarPlacement);
  const design = useActiveStore((s) => s.design);
  const toggleCategoryOn = useActiveStore((s) => s.toggleCategoryOn);
  const setVariant = useActiveStore((s) => s.setVariant);
  const setSidebarPlacement = useActiveStore((s) => s.setSidebarPlacement);
  const toggleCategoryCollapsed = useActiveStore((s) => s.toggleCategoryCollapsed);
  const reorderCategory = useActiveStore((s) => s.reorderCategory);
  const appliedTitle = useActiveStore((s) => s.appliedTitle);
  const setAppliedTitle = useActiveStore((s) => s.setAppliedTitle);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const hoverTarget = useHoverTarget();

  const visible = order.filter((id) => categories[id] && !categories[id].isHidden);

  return (
    <div className="tab-content">
      <div className="tailor-field">
        <label>{T.appliedTitle}</label>
        <input
          className={"field" + (isExactHover(hoverTarget, "appliedTitle") ? " hover-exact" : "")}
          value={appliedTitle[lang]}
          onChange={(e) => setAppliedTitle(lang, e.target.value)}
        />
      </div>

      <div className="tailor-list">
        {visible.map((id) => {
          const cat = categories[id];
          const options = variantsFor();
          const currentVariant = variant[id] ?? defaultVariant();
          // The category's on/off toggle doubles as "sectionHeading"'s own
          // exact control (it's literally what shows/hides "PROFIL" etc.)
          // — anything else belonging to this category only lights the
          // row at the lighter ancestor weight.
          const rowIsExact = isExactHover(hoverTarget, "sectionHeading", { categoryId: id });
          const rowIsAncestor = !rowIsExact && isCategoryAncestorHover(hoverTarget, id);
          return (
            <div className="tailor-item" key={id}>
              <div
                className={
                  "tailor-row" +
                  (draggedId === id ? " dragging" : "") +
                  (dragOverId === id && draggedId !== id ? " drag-over" : "") +
                  (rowIsExact ? " hover-exact" : "") +
                  (rowIsAncestor ? " hover-ancestor" : "")
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
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => toggleCategoryCollapsed(id)}
                  title={cat.isCollapsed ? T.expand : T.collapse}
                >
                  {cat.isCollapsed ? "▸" : "▾"}
                </button>
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
              {!cat.isCollapsed && <ItemChecklist categoryId={id} lang={lang} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
