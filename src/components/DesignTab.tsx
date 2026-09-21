import { useRef, useState } from "react";
import { useStore } from "../state/store";
import type { Lang } from "../model/types";
import { t } from "../i18n";
import {
  FONTS,
  SCHEMES,
  STRUCTS,
  HEADS,
  SIDEBAR_SIDES,
  PHOTO_SIZES,
  PHOTO_POSITIONS,
  SIZE_STEPS,
  clampStep,
} from "../data/designTokens";

/** A plain 0-9 slider, unnamed — every size step (density, and the four
 *  individual controls it defaults to) is a position on this same range,
 *  not a handful of named categories a person has to pick a label for. */
function StepSlider({ value, onChange, disabled }: { value: number; onChange: (step: number) => void; disabled?: boolean }) {
  return (
    <input
      type="range"
      className="size-slider"
      min={0}
      max={SIZE_STEPS - 1}
      step={1}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/** One individual size control (heading/heading 2/text/text-in-elements):
 *  a "follow density" checkbox plus a slider that's only interactive once
 *  that checkbox is off — pinning an explicit step overrides whatever the
 *  overall density slider is doing, for just this one text type. */
function SizeSlider({
  label,
  value,
  onChange,
  followLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  followLabel: string;
}) {
  const following = value === "auto";
  const step = following ? undefined : clampStep(Number(value));

  return (
    <div className="design-group">
      <div className="design-group-label">{label}</div>
      <label className="in-cv">
        <input
          type="checkbox"
          checked={following}
          onChange={(e) => onChange(e.target.checked ? "auto" : String(clampStep(Number(value))))}
        />
        {followLabel}
      </label>
      {!following && <StepSlider value={step ?? 4} onChange={(s) => onChange(String(s))} />}
    </div>
  );
}

/** The overall density control plus the seven individual controls it
 *  defaults each of them to (five text sizes, plus section/element
 *  spacing) — grouped into one design-group with the individual ones
 *  nested visually underneath (see .design-subgroup in App.css) so the
 *  "this knob adjusts those seven" relationship reads at a glance instead
 *  of eight same-looking boxes in a row. */
function DensityGroup({
  design,
  setDesign,
  T,
}: {
  design: {
    density: string;
    headSize: string;
    headingSize: string;
    textSize: string;
    elementTextSize: string;
    contactSize: string;
    sectionGap: string;
    entryGap: string;
  };
  setDesign: (
    field:
      | "density"
      | "headSize"
      | "headingSize"
      | "textSize"
      | "elementTextSize"
      | "contactSize"
      | "sectionGap"
      | "entryGap",
    value: string,
  ) => void;
  T: ReturnType<typeof t>;
}) {
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className="design-group">
      <div className="design-group-label">{T.density}</div>
      <StepSlider value={clampStep(Number(design.density))} onChange={(s) => setDesign("density", String(s))} />

      <label className="in-cv advanced-toggle">
        <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
        {T.advancedSizes}
      </label>

      {advanced && (
        <div className="design-subgroup">
          <SizeSlider
            label={T.headerSize}
            value={design.headSize}
            onChange={(v) => setDesign("headSize", v)}
            followLabel={T.followDensity}
          />

          <SizeSlider
            label={T.headingSize}
            value={design.headingSize}
            onChange={(v) => setDesign("headingSize", v)}
            followLabel={T.followDensity}
          />

          <SizeSlider
            label={T.textSize}
            value={design.textSize}
            onChange={(v) => setDesign("textSize", v)}
            followLabel={T.followDensity}
          />

          <SizeSlider
            label={T.elementTextSize}
            value={design.elementTextSize}
            onChange={(v) => setDesign("elementTextSize", v)}
            followLabel={T.followDensity}
          />

          <SizeSlider
            label={T.contactSize}
            value={design.contactSize}
            onChange={(v) => setDesign("contactSize", v)}
            followLabel={T.followDensity}
          />

          <SizeSlider
            label={T.sectionGap}
            value={design.sectionGap}
            onChange={(v) => setDesign("sectionGap", v)}
            followLabel={T.followDensity}
          />

          <SizeSlider
            label={T.entryGap}
            value={design.entryGap}
            onChange={(v) => setDesign("entryGap", v)}
            followLabel={T.followDensity}
          />
        </div>
      )}
    </div>
  );
}

/** Downscales/re-encodes an uploaded photo client-side (longest side capped
 *  at maxDim, re-encoded as JPEG) before it ever reaches the store — an
 *  unmodified phone photo can be several MB, which would bloat both
 *  localStorage and JSON backups for what only ever renders at a few
 *  hundred px on the CV. */
function resizePhoto(file: File, maxDim = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function DesignTab({ lang }: { lang: Lang }) {
  const T = t(lang);
  const design = useStore((s) => s.design);
  const setDesign = useStore((s) => s.setDesign);
  const header = useStore((s) => s.header);
  const setHeaderPhoto = useStore((s) => s.setHeaderPhoto);
  const setFooterEnabled = useStore((s) => s.setFooterEnabled);
  const setFooterRevision = useStore((s) => s.setFooterRevision);
  const photoFileInput = useRef<HTMLInputElement>(null);

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    resizePhoto(file).then(setHeaderPhoto).catch(() => window.alert(T.jsonImportError));
  };

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

      <DensityGroup design={design} setDesign={setDesign} T={T} />

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

      <div className="design-group">
        <div className="design-group-label">{T.profilePhoto}</div>
        <div className="photo-upload-row">
          {header.photo && <img src={header.photo} alt="" className="photo-thumb" />}
          <button type="button" className="btn" onClick={() => photoFileInput.current?.click()}>
            {header.photo ? T.changePhoto : T.choosePhoto}
          </button>
          {header.photo && (
            <button type="button" className="link-btn danger" onClick={() => setHeaderPhoto("")}>
              {T.removePhoto}
            </button>
          )}
        </div>
        <input ref={photoFileInput} type="file" accept="image/*" hidden onChange={handlePhotoFile} />
      </div>

      {header.photo && (
        <div className="design-group">
          <div className="design-group-label">{T.photoSize}</div>
          <div className="design-pills">
            {PHOTO_SIZES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={"pill" + (design.photoSize === p.id ? " active" : "")}
                onClick={() => setDesign("photoSize", p.id)}
              >
                {p.name[lang]}
              </button>
            ))}
          </div>
        </div>
      )}

      {header.photo && (
        <div className="design-group">
          <div className="design-group-label">{T.photoPosition}</div>
          <div className="design-pills">
            {PHOTO_POSITIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={"pill" + (design.photoPosition === p.id ? " active" : "")}
                onClick={() => setDesign("photoPosition", p.id)}
              >
                {p.name[lang]}
              </button>
            ))}
          </div>
        </div>
      )}

      {design.struct === "sidebar" && (
        <div className="design-group">
          <div className="design-group-label">{T.sidebarSide}</div>
          <div className="design-pills">
            {SIDEBAR_SIDES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={"pill" + (design.sidebarSide === s.id ? " active" : "")}
                onClick={() => setDesign("sidebarSide", s.id)}
              >
                {s.name[lang]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="design-group">
        <div className="design-group-label">{T.footer}</div>
        <label className="in-cv">
          <input
            type="checkbox"
            checked={design.footer.enabled}
            onChange={(e) => setFooterEnabled(e.target.checked)}
          />
          {T.footerEnable}
        </label>
        {design.footer.enabled && (
          <input
            className="field"
            placeholder={T.footerRevisionPlaceholder}
            value={design.footer.revision}
            onChange={(e) => setFooterRevision(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
