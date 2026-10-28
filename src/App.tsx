import { useEffect, useRef, useState } from "react";
import { useActiveStore } from "./state/tabs";
import { t } from "./i18n";
import { ContentTab } from "./components/ContentTab";
import { TailorTab } from "./components/TailorTab";
import { DesignTab } from "./components/DesignTab";
import { CvPreview } from "./components/CvPreview";
import { ImportExportBar } from "./components/ImportExportBar";
import { TabBar } from "./components/TabBar";
import { TutorialOverlay } from "./components/TutorialOverlay";
import { useLocalFonts } from "./hooks/useLocalFonts";
import { pxToMm, type PageOverflow } from "./hooks/usePageOverflow";
import { useHoverTarget, isExactHover } from "./state/hoverTarget";
import "./App.css";

type Tab = "content" | "tailor" | "design";

const ZOOM_MIN = 40;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;

const EDITOR_WIDTH_MIN = 340;
// A generous ceiling — the real cap is dynamic (see clampEditorWidth),
// derived from the current window width so the preview panel never gets
// squeezed away entirely.
const EDITOR_WIDTH_MAX = 1600;
const EDITOR_WIDTH_DEFAULT = 480;
const EDITOR_WIDTH_STORAGE_KEY = "cv-builder-editor-width";
/** Keep the CV preview at least this wide, however far the divider drags. */
const PREVIEW_WIDTH_MIN = 320;
/** .panel-resizer's own width plus .app-body's left+right padding — the
 *  chrome between the two panels that isn't available to either one. */
const LAYOUT_CHROME_WIDTH = 16 + 32;

function clampEditorWidth(width: number): number {
  const viewportMax = window.innerWidth - LAYOUT_CHROME_WIDTH - PREVIEW_WIDTH_MIN;
  const max = Math.min(EDITOR_WIDTH_MAX, Math.max(EDITOR_WIDTH_MIN, viewportMax));
  return Math.min(max, Math.max(EDITOR_WIDTH_MIN, width));
}

function loadEditorWidth(): number {
  try {
    const saved = Number(localStorage.getItem(EDITOR_WIDTH_STORAGE_KEY));
    if (saved >= EDITOR_WIDTH_MIN && saved <= EDITOR_WIDTH_MAX) return clampEditorWidth(saved);
  } catch {
    // localStorage unavailable — fall through to the default.
  }
  return EDITOR_WIDTH_DEFAULT;
}

function saveEditorWidth(width: number): void {
  try {
    localStorage.setItem(EDITOR_WIDTH_STORAGE_KEY, String(width));
  } catch {
    // ignore — purely a remembered UI preference, not required to work.
  }
}

function App() {
  const lang = useActiveStore((s) => s.lang);
  const setLang = useActiveStore((s) => s.setLang);
  const header = useActiveStore((s) => s.header);
  const setHeaderField = useActiveStore((s) => s.setHeaderField);
  const setHeaderFieldValue = useActiveStore((s) => s.setHeaderFieldValue);
  const addHeaderField = useActiveStore((s) => s.addHeaderField);
  const removeHeaderField = useActiveStore((s) => s.removeHeaderField);
  const resetAll = useActiveStore((s) => s.resetAll);
  const [tab, setTab] = useState<Tab>("content");
  const [mainPageStatus, setMainPageStatus] = useState<PageOverflow | null>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [editorWidth, setEditorWidth] = useState(loadEditorWidth);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const editorWidthRef = useRef(editorWidth);
  const hoverTarget = useHoverTarget();
  const T = t(lang);
  useLocalFonts();

  useEffect(() => {
    const onResize = () => {
      const next = clampEditorWidth(editorWidthRef.current);
      editorWidthRef.current = next;
      setEditorWidth(next);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = editorWidth;
    const onMove = (moveEvent: PointerEvent) => {
      const next = clampEditorWidth(startWidth + (moveEvent.clientX - startX));
      editorWidthRef.current = next;
      setEditorWidth(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      saveEditorWidth(editorWidthRef.current);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleResizeReset = () => {
    editorWidthRef.current = EDITOR_WIDTH_DEFAULT;
    setEditorWidth(EDITOR_WIDTH_DEFAULT);
    saveEditorWidth(EDITOR_WIDTH_DEFAULT);
  };

  /** Waits for every @font-face requested so far (the CV's own, injected
   *  by useLocalFonts as soon as the app mounts) to actually finish loading
   *  before opening the print dialog — printing mid-load risks the print
   *  engine snapshotting the page before its real font has swapped in. The
   *  bigger fix for print output embedding fonts as real, selectable text
   *  rather than outlined vector shapes is self-hosting them as WOFF (see
   *  src/data/localFonts.ts); this is a smaller, complementary guard against
   *  a timing race on top of that. */
  const handlePrint = () => {
    document.fonts.ready.then(() => window.print());
  };

  const handleResetAll = () => {
    if (window.confirm(T.confirmResetAll)) resetAll();
  };

  return (
    <div className="app">
      <TabBar lang={lang} onOpenTutorial={() => setTutorialOpen(true)} />
      <header className="app-header">
        <h1>{T.appName}</h1>
        <div className="app-header-controls">
          <ImportExportBar lang={lang} />
          <button type="button" className="btn" onClick={handleResetAll}>
            {T.resetAll}
          </button>
          <div className="lang-toggle">
            <button type="button" className={lang === "da" ? "active" : ""} onClick={() => setLang("da")}>
              DA
            </button>
            <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
              EN
            </button>
          </div>
        </div>
      </header>

      <div className="app-body" style={{ "--editor-width": `${editorWidth}px` } as React.CSSProperties}>
        <div className="editor-panel">
          <div className="header-fields">
            <input
              className={"field" + (isExactHover(hoverTarget, "name") ? " hover-exact" : "")}
              placeholder={T.name}
              value={header.name}
              onChange={(e) => setHeaderField("name", e.target.value)}
            />
            {header.fields.map((f, i) => (
              <div className="header-field-row" key={f.id}>
                <input
                  className={"field" + (isExactHover(hoverTarget, "contact") ? " hover-exact" : "")}
                  placeholder={T.field(i + 1)}
                  value={f.value[lang]}
                  onChange={(e) => setHeaderFieldValue(f.id, lang, e.target.value)}
                />
                <button
                  type="button"
                  className="header-field-remove"
                  onClick={() => removeHeaderField(f.id)}
                  title={T.removeField}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="header-field-add" onClick={addHeaderField} title={T.addField}>
              +
            </button>
          </div>

          <div className="tabs">
            <button type="button" className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>
              {T.tabContent}
            </button>
            <button type="button" className={tab === "tailor" ? "active" : ""} onClick={() => setTab("tailor")}>
              {T.tabTailor}
            </button>
            <button type="button" className={tab === "design" ? "active" : ""} onClick={() => setTab("design")}>
              {T.tabDesign}
            </button>
          </div>

          {tab === "content" && <ContentTab lang={lang} />}
          {tab === "tailor" && <TailorTab lang={lang} />}
          {tab === "design" && <DesignTab lang={lang} />}
        </div>

        <div
          className="panel-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label={T.resizePanels}
          title={T.resizePanels}
          onPointerDown={handleResizeStart}
          onDoubleClick={handleResizeReset}
        />

        <div className="preview-panel">
          <div className="preview-toolbar">
            <div className="toolbar-left">
              {mainPageStatus && (
                <div className={"page-status-pill" + (mainPageStatus.overflowing ? " page-status-pill--overflow" : "")}>
                  {mainPageStatus.overflowing
                    ? `⚠ ${T.pageOverflow(mainPageStatus.overflowPx)}`
                    : T.spaceRemaining(pxToMm(mainPageStatus.remainingPx))}
                </div>
              )}
              <div className="zoom-controls">
                <button
                  type="button"
                  className="icon-btn"
                  disabled={zoomPct <= ZOOM_MIN}
                  onClick={() => setZoomPct((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                  title={T.zoomOut}
                >
                  −
                </button>
                <button type="button" className="zoom-level" onClick={() => setZoomPct(100)} title={T.zoomReset}>
                  {zoomPct}%
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={zoomPct >= ZOOM_MAX}
                  onClick={() => setZoomPct((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                  title={T.zoomIn}
                >
                  +
                </button>
              </div>
            </div>
            <button type="button" className="btn" onClick={handlePrint}>
              {T.print}
            </button>
          </div>
          <CvPreview lang={lang} onMainPageStatus={setMainPageStatus} zoom={zoomPct / 100} />
        </div>
      </div>
      {tutorialOpen && <TutorialOverlay lang={lang} onClose={() => setTutorialOpen(false)} />}
    </div>
  );
}

export default App;
