import { useState } from "react";
import { useStore } from "./state/store";
import { t } from "./i18n";
import { ContentTab } from "./components/ContentTab";
import { TailorTab } from "./components/TailorTab";
import { DesignTab } from "./components/DesignTab";
import { CvPreview } from "./components/CvPreview";
import { ImportExportBar } from "./components/ImportExportBar";
import { useGoogleFont } from "./hooks/useGoogleFont";
import { pxToMm, type PageOverflow } from "./hooks/usePageOverflow";
import "./App.css";

type Tab = "content" | "tailor" | "design";

const ZOOM_MIN = 40;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;

function App() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const header = useStore((s) => s.header);
  const setHeaderField = useStore((s) => s.setHeaderField);
  const font = useStore((s) => s.design.font);
  const [tab, setTab] = useState<Tab>("content");
  const [mainPageStatus, setMainPageStatus] = useState<PageOverflow | null>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const T = t(lang);
  useGoogleFont(font);

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

      <div className="app-body">
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
            <button type="button" className="btn" onClick={() => window.print()}>
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
