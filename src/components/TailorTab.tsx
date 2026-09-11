import { useState } from "react";
import { useStore } from "../state/store";
import type { Lang, Placement } from "../model/types";
import { t } from "../i18n";
import { defaultVariant, variantsFor } from "../data/designTokens";

export function TailorTab({ lang }: { lang: Lang }) {
  const T = t(lang);
  const order = useStore((s) => s.order);
  const categories = useStore((s) => s.categories);
  const on = useStore((s) => s.on);
  const place = useStore((s) => s.place);
  const variant = useStore((s) => s.variant);
  const toggleCategoryOn = useStore((s) => s.toggleCategoryOn);
  const setPlacement = useStore((s) => s.setPlacement);
  const setVariant = useStore((s) => s.setVariant);
  const moveCategory = useStore((s) => s.moveCategory);
  const reorderCategory = useStore((s) => s.reorderCategory);
  const appliedTitle = useStore((s) => s.appliedTitle);
  const keywords = useStore((s) => s.keywords);
  const setAppliedTitle = useStore((s) => s.setAppliedTitle);
  const setKeywords = useStore((s) => s.setKeywords);
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
      <div className="tailor-field">
        <label>{T.keywords}</label>
        <textarea
          className="field"
          rows={2}
          value={keywords[lang]}
          onChange={(e) => setKeywords(lang, e.target.value)}
        />
      </div>

      <div className="tailor-list">
        {visible.map((id, i) => {
          const cat = categories[id];
          const options = variantsFor(cat.kind);
          return (
            <div
              className={
                "tailor-row" +
                (draggedId === id ? " dragging" : "") +
                (dragOverId === id && draggedId !== id ? " drag-over" : "")
              }
              key={id}
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
              {options.length > 0 && (
                <select
                  className="field placement-select"
                  value={variant[id] ?? defaultVariant(cat.kind)}
                  onChange={(e) => setVariant(id, e.target.value)}
                  title={T.format}
                >
                  {options.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name[lang]}
                    </option>
                  ))}
                </select>
              )}
              <select
                className="field placement-select"
                value={place[id] ?? "cv"}
                onChange={(e) => setPlacement(id, e.target.value as Placement)}
              >
                <option value="cv">{T.placementCv}</option>
                <option value="apx">{T.placementAppendix}</option>
              </select>
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
          );
        })}
      </div>
    </div>
  );
}
