import { useRef } from "react";
import { useStore } from "../state/store";
import type { Lang } from "../model/types";
import { t } from "../i18n";
import { downloadCsv } from "../csv/exportCsv";
import { downloadJson } from "../json/backupJson";

export function ImportExportBar({ lang }: { lang: Lang }) {
  const T = t(lang);
  const state = useStore((s) => s);
  const parseImport = useStore((s) => s.parseImport);
  const commitImport = useStore((s) => s.commitImport);
  const parseJsonImport = useStore((s) => s.parseJsonImport);
  const commitJsonImport = useStore((s) => s.commitJsonImport);
  const csvFileInput = useRef<HTMLInputElement>(null);
  const jsonFileInput = useRef<HTMLInputElement>(null);

  const handleExportCsv = () => {
    downloadCsv(state, lang === "da" ? "CV-bibliotek.csv" : "CV-library.csv");
  };

  const handleExportJson = () => {
    downloadJson(state, "CV-builder-backup.json");
  };

  const handleImportCsvClick = () => csvFileInput.current?.click();
  const handleImportJsonClick = () => jsonFileInput.current?.click();

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = parseJsonImport(text);
      if (!result.ok) {
        window.alert(T.jsonImportError + ": " + result.error);
        return;
      }
      if (!window.confirm(T.confirmJsonImport)) return;
      commitJsonImport(result.data);
      window.alert(T.jsonImportDone);
    };
    reader.readAsText(file);
  };

  return (
    <div className="import-export-bar">
      <button type="button" className="btn" onClick={handleExportCsv}>
        {T.exportCsv}
      </button>
      <button type="button" className="btn" onClick={handleImportCsvClick}>
        {T.importCsv}
      </button>
      <button type="button" className="btn" onClick={handleExportJson}>
        {T.exportJson}
      </button>
      <button type="button" className="btn" onClick={handleImportJsonClick}>
        {T.importJson}
      </button>
      <input ref={csvFileInput} type="file" accept=".csv,text/csv" hidden onChange={handleCsvFile} />
      <input ref={jsonFileInput} type="file" accept=".json,application/json" hidden onChange={handleJsonFile} />
    </div>
  );
}
