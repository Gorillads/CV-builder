import { useStore } from "../state/store";
import type { Lang } from "../model/types";
import { t } from "../i18n";
import { FONTS, SCHEMES, HEAD_SIZES, STRUCTS, HEADS } from "../data/designTokens";

export function DesignTab({ lang }: { lang: Lang }) {
  const T = t(lang);
  const design = useStore((s) => s.design);
  const setDesign = useStore((s) => s.setDesign);

  return (
    <div className="tab-content design-tab">
      <div className="design-group">
        <div className="design-group-label">{T.fontPairing}</div>
        <div className="design-cards">
          {FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={"design-card font-card" + (design.font === f.id ? " active" : "")}
              style={{ fontFamily: f.head }}
              onClick={() => setDesign("font", f.id)}
            >
              {f.name[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="design-group">
        <div className="design-group-label">{T.colorScheme}</div>
        <div className="design-swatches">
          {SCHEMES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={"swatch" + (design.scheme === s.id ? " active" : "")}
              style={{ background: s.accent }}
              onClick={() => setDesign("scheme", s.id)}
              title={s.name[lang]}
            />
          ))}
        </div>
      </div>

      <div className="design-group">
        <div className="design-group-label">{T.headerSize}</div>
        <div className="design-pills">
          {HEAD_SIZES.map((h) => (
            <button
              key={h.id}
              type="button"
              className={"pill" + (design.headSize === h.id ? " active" : "")}
              onClick={() => setDesign("headSize", h.id)}
            >
              {h.name[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="design-group">
        <div className="design-group-label">{T.layoutStructure}</div>
        <div className="design-pills">
          {STRUCTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={"pill" + (design.struct === s.id ? " active" : "")}
              onClick={() => setDesign("struct", s.id)}
            >
              {s.name[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="design-group">
        <div className="design-group-label">{T.headerAlignment}</div>
        <div className="design-pills">
          {HEADS.map((h) => (
            <button
              key={h.id}
              type="button"
              className={"pill" + (design.headKind === h.id ? " active" : "")}
              onClick={() => setDesign("headKind", h.id)}
            >
              {h.name[lang]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
