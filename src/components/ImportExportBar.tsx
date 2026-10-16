import { useRef } from "react";
import { useActiveStore, useTabsStore, MAX_TABS } from "../state/tabs";
import type { Lang } from "../model/types";
import { t } from "../i18n";
import { downloadCsv } from "../csv/exportCsv";
import { downloadJson, parseJsonBackup } from "../json/backupJson";

export function ImportExportBar({ lang }: { lang: Lang }) {
  const T = t(lang);
  const state = useActiveStore((s) => s);
  const parseImport = useActiveStore((s) => s.parseImport);
  const commitImport = useActiveStore((s) => s.commitImport);
  const addTabFromData = useTabsStore((s) => s.addTabFromData);
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
      const result = parseJsonBackup(text);
      if (!result.ok) {
        window.alert(T.jsonImportError + ": " + result.error);
        return;
      }
      // Opens as its own new tab rather than replacing what's currently
      // open, so there's nothing destructive here to confirm — the
      // backup's own name, or the existing content underneath, never
      // disappears.
      if (useTabsStore.getState().tabs.length >= MAX_TABS) {
        window.alert(T.jsonImportTabLimit);
        return;
      }
      addTabFromData(result.data);
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
