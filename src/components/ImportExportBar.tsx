import { useRef } from "react";
import { useStore } from "../state/store";
import type { Lang } from "../model/types";
import { t } from "../i18n";
import { downloadCsv } from "../csv/exportCsv";

export function ImportExportBar({ lang }: { lang: Lang }) {
  const T = t(lang);
  const state = useStore((s) => s);
  const parseImport = useStore((s) => s.parseImport);
  const commitImport = useStore((s) => s.commitImport);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadCsv(state, lang === "da" ? "CV-bibliotek.csv" : "CV-library.csv");
  };

  const handleImportClick = () => fileInput.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = parseImport(text);
      if (!result.ok) {
        window.alert(T.importError + ": " + result.error);
        return;
      }
      const { plan } = result;
      if (!window.confirm(T.confirmImport(plan.rowCount, plan.sectionCount))) return;
      commitImport(plan);
      window.alert(T.importDone(plan.rowCount, plan.sectionCount));
    };
    reader.readAsText(file);
  };

  return (
    <div className="import-export-bar">
      <button type="button" className="btn" onClick={handleExport}>
        {T.exportCsv}
      </button>
      <button type="button" className="btn" onClick={handleImportClick}>
        {T.importCsv}
      </button>
      <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
    </div>
  );
}
