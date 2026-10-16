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
  SIDEBAR_WIDTHS,
  PHOTO_POSITIONS,
  PHOTO_SHAPES,
  SIZE_STEPS,
  clampStep,
  DEFAULT_PAGE_BG,
  resolveBoxColor,
  resolveBgSwatch,
} from "../data/designTokens";
import { resizeImage } from "../utils/resizeImage";

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
export function SizeSlider({
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
    logoSize: string;
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
      | "logoSize"
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
            label={T.logoSize}
            value={design.logoSize}
            onChange={(v) => setDesign("logoSize", v)}
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

/** One preset color option for a ColorControl's swatch row — "color" is
 *  what both the swatch itself is painted and what gets stored on pick
 *  (see deriveChipTrio/deriveTextTones/resolveBoxColor in
 *  src/data/designTokens, which turn that single value into the actual
 *  rendered trio/tones at render time in CvPreview.tsx). */
interface ColorSwatchOption {
  id: string;
  color: string;
  title: string;
}

/** One Theme sub-control (Box/Chips/Text/Background): a "Follow theme"
 *  checkbox plus, once unchecked, a row of curated swatches — one per
 *  scheme, so there's always a quick, coordinated option — followed by a
 *  "Custom…" swatch that opens a native color picker for a free RGB/hex
 *  pick. Mirrors SizeSlider's "follow master, or pin your own" shape. */
function ColorControl({
  label,
  value,
  onChange,
  followLabel,
  customLabel,
  swatches,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  followLabel: string;
  customLabel: string;
  swatches: ColorSwatchOption[];
}) {
  const following = value === "auto";
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isPreset = swatches.some((s) => s.color === value);
  const isCustomActive = !following && !isPreset;

  return (
    <div className="design-group">
      <div className="design-group-label">{label}</div>
      <label className="in-cv">
        <input
          type="checkbox"
          checked={following}
          onChange={(e) => onChange(e.target.checked ? "auto" : (swatches[0]?.color ?? "#000000"))}
        />
        {followLabel}
      </label>
      {!following && (
        <div className="design-swatches">
          {swatches.map((s) => (
            <button
              key={s.id}
              type="button"
              className={"swatch" + (value === s.color ? " active" : "")}
              style={{ background: s.color }}
              title={s.title}
              onClick={() => onChange(s.color)}
            />
          ))}
          <button
            type="button"
            className={"swatch swatch-custom" + (isCustomActive ? " active" : "")}
            style={isCustomActive ? { background: value } : undefined}
            title={customLabel}
            onClick={() => colorInputRef.current?.click()}
          />
          <input
            ref={colorInputRef}
            type="color"
            className="color-input-hidden"
            value={isCustomActive ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

/** The overall color scheme plus the individual color controls it defaults
 *  each of them to (box, chips, background, and eight text categories —
 *  roughly one per Density's own text-size categories, with Density's
 *  elementTextSize and contactSize each further split in two, see each
 *  ColorControl's comment below) — same "one master, many followers" shape
 *  as DensityGroup above. */
function ThemeGroup({
  design,
  setDesign,
  lang,
  T,
}: {
  design: {
    scheme: string;
    boxColor: string;
    chipColor: string;
    bgColor: string;
    heading1Color: string;
    heading2Color: string;
    heading3Color: string;
    underheadingColor: string;
    elementTextColor: string;
    activityColor: string;
    contactColor: string;
    bodyTextColor: string;
  };
  setDesign: (
    field:
      | "scheme"
      | "boxColor"
      | "chipColor"
      | "bgColor"
      | "heading1Color"
      | "heading2Color"
      | "heading3Color"
      | "underheadingColor"
      | "elementTextColor"
      | "activityColor"
      | "contactColor"
      | "bodyTextColor",
    value: string,
  ) => void;
  lang: Lang;
  T: ReturnType<typeof t>;
}) {
  const [advanced, setAdvanced] = useState(false);
  const activeScheme = SCHEMES.find((s) => s.id === design.scheme);
  const pageBg = design.bgColor === "auto" ? (activeScheme?.textOverride?.pageBg ?? DEFAULT_PAGE_BG) : design.bgColor;

  // Each scheme's own box swatch previews against *its own* page
  // background (its textOverride.pageBg, if it has one) rather than always
  // the currently active one, so e.g. the "Mørk" swatch still looks right
  // under Box even while some other (light) scheme is actually selected.
  const boxSwatches: ColorSwatchOption[] = SCHEMES.map((s) => ({
    id: s.id,
    color: resolveBoxColor(s.accent, s.textOverride?.pageBg ?? pageBg),
    title: s.name[lang],
  }));
  const chipSwatches: ColorSwatchOption[] = SCHEMES.map((s) => ({ id: s.id, color: s.chipFg, title: s.name[lang] }));
  const bgSwatches: ColorSwatchOption[] = SCHEMES.map((s) => ({
    id: s.id,
    color: s.textOverride?.pageBg ?? resolveBgSwatch(s.accent),
    title: s.name[lang],
  }));
  // Heading-ish controls (the name, section titles, an entry's own
  // heading) offer each scheme's bold accent as a quick preset; the more
  // secondary ones (dates, element text, running text) offer its softer
  // tone instead — both are just starting points, not tied to what "auto"
  // actually resolves to for that particular control (see each CSS rule's
  // own fallback in App.css for that).
  const accentSwatches: ColorSwatchOption[] = SCHEMES.map((s) => ({ id: s.id, color: s.accent, title: s.name[lang] }));
  const softSwatches: ColorSwatchOption[] = SCHEMES.map((s) => ({ id: s.id, color: s.soft, title: s.name[lang] }));

  return (
    <div className="design-group">
      <div className="design-group-label">{T.theme}</div>
      <div className="design-group-label">{T.colorScheme}</div>
      <div className="design-swatches">
        {SCHEMES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={"swatch" + (design.scheme === s.id ? " active" : "")}
            // A scheme with its own dark page (see ColorScheme.textOverride
            // in designTokens.ts) previews as that page color instead of
            // its accent — "Mørk"'s accent is deliberately a light color
            // (it needs to read against its own dark page), which would
            // otherwise make its swatch look like a *light* theme instead
            // of the dark one it actually is.
            style={{ background: s.textOverride?.pageBg ?? s.accent }}
            onClick={() => setDesign("scheme", s.id)}
            title={s.name[lang]}
          />
        ))}
      </div>

      <label className="in-cv advanced-toggle">
        <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
        {T.advancedColors}
      </label>

      {advanced && (
        <div className="design-subgroup">
          <ColorControl
            label={T.boxColor}
            value={design.boxColor}
            onChange={(v) => setDesign("boxColor", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={boxSwatches}
          />
          <ColorControl
            label={T.chipColor}
            value={design.chipColor}
            onChange={(v) => setDesign("chipColor", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={chipSwatches}
          />
          <ColorControl
            label={T.bgColor}
            value={design.bgColor}
            onChange={(v) => setDesign("bgColor", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={bgSwatches}
          />
          <ColorControl
            label={T.heading1Color}
            value={design.heading1Color}
            onChange={(v) => setDesign("heading1Color", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={accentSwatches}
          />
          <ColorControl
            label={T.heading2Color}
            value={design.heading2Color}
            onChange={(v) => setDesign("heading2Color", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={accentSwatches}
          />
          <ColorControl
            label={T.heading3Color}
            value={design.heading3Color}
            onChange={(v) => setDesign("heading3Color", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={accentSwatches}
          />
          <ColorControl
            label={T.underheadingColor}
            value={design.underheadingColor}
            onChange={(v) => setDesign("underheadingColor", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={softSwatches}
          />
          <ColorControl
            label={T.elementTextColor}
            value={design.elementTextColor}
            onChange={(v) => setDesign("elementTextColor", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={softSwatches}
          />
          <ColorControl
            label={T.activityColor}
            value={design.activityColor}
            onChange={(v) => setDesign("activityColor", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={softSwatches}
          />
          <ColorControl
            label={T.contactColor}
            value={design.contactColor}
            onChange={(v) => setDesign("contactColor", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={softSwatches}
          />
          <ColorControl
            label={T.bodyTextColor}
            value={design.bodyTextColor}
            onChange={(v) => setDesign("bodyTextColor", v)}
            followLabel={T.followTheme}
            customLabel={T.customColor}
            swatches={softSwatches}
          />
        </div>
      )}
    </div>
  );
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
    resizeImage(file).then(setHeaderPhoto).catch(() => window.alert(T.jsonImportError));
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

      <ThemeGroup design={design} setDesign={setDesign} lang={lang} T={T} />

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
          <StepSlider value={clampStep(Number(design.photoSize))} onChange={(s) => setDesign("photoSize", String(s))} />
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

      {header.photo && (
        <div className="design-group">
          <div className="design-group-label">{T.photoShape}</div>
          <div className="design-pills">
            {PHOTO_SHAPES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={"pill" + (design.photoShape === p.id ? " active" : "")}
                onClick={() => setDesign("photoShape", p.id)}
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

      {design.struct === "sidebar" && (
        <div className="design-group">
          <div className="design-group-label">{T.sidebarWidth}</div>
          <div className="design-pills">
            {SIDEBAR_WIDTHS.map((w) => (
              <button
                key={w.id}
                type="button"
                className={"pill" + (design.sidebarWidth === w.id ? " active" : "")}
                onClick={() => setDesign("sidebarWidth", w.id)}
              >
                {w.name[lang]}
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
