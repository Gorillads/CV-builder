import { useStore } from "../state/store";
import type { Lang, Placement } from "../model/types";
import { t } from "../i18n";

export function TailorTab({ lang }: { lang: Lang }) {
  const T = t(lang);
  const order = useStore((s) => s.order);
  const categories = useStore((s) => s.categories);
  const on = useStore((s) => s.on);
  const place = useStore((s) => s.place);
  const toggleCategoryOn = useStore((s) => s.toggleCategoryOn);
  const setPlacement = useStore((s) => s.setPlacement);
  const moveCategory = useStore((s) => s.moveCategory);
  const appliedTitle = useStore((s) => s.appliedTitle);
  const keywords = useStore((s) => s.keywords);
  const setAppliedTitle = useStore((s) => s.setAppliedTitle);
  const setKeywords = useStore((s) => s.setKeywords);

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
          return (
            <div className="tailor-row" key={id}>
              <label className="in-cv">
                <input type="checkbox" checked={!!on[id]} onChange={() => toggleCategoryOn(id)} />
                {cat.title[lang]}
              </label>
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
