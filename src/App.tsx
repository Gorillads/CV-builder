import { useEffect, useRef, useState } from "react";
import { useStore } from "./state/store";
import { t } from "./i18n";
import { ContentTab } from "./components/ContentTab";
import { TailorTab } from "./components/TailorTab";
import { DesignTab } from "./components/DesignTab";
import { CvPreview } from "./components/CvPreview";
import { ImportExportBar } from "./components/ImportExportBar";
import { useLocalFonts } from "./hooks/useLocalFonts";
import { pxToMm, type PageOverflow } from "./hooks/usePageOverflow";
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
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const header = useStore((s) => s.header);
  const setHeaderField = useStore((s) => s.setHeaderField);
  const [tab, setTab] = useState<Tab>("content");
  const [mainPageStatus, setMainPageStatus] = useState<PageOverflow | null>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [editorWidth, setEditorWidth] = useState(loadEditorWidth);
  const editorWidthRef = useRef(editorWidth);
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>{T.appName}</h1>
        <div className="app-header-controls">
          <ImportExportBar lang={lang} />
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
              className="field"
              placeholder={T.name}
              value={header.name}
              onChange={(e) => setHeaderField("name", e.target.value)}
            />
            <input
              className="field"
              placeholder={T.phone}
              value={header.phone}
              onChange={(e) => setHeaderField("phone", e.target.value)}
            />
            <input
              className="field"
              placeholder={T.mail}
              value={header.mail}
              onChange={(e) => setHeaderField("mail", e.target.value)}
            />
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
    </div>
  );
}

export default App;
