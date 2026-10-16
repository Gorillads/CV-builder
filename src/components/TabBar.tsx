import { useTabsStore, getDocStore, MAX_TABS } from "../state/tabs";
import type { Lang } from "../model/types";
import { t } from "../i18n";

/** One tab's own document store feeds its label directly (the CV owner's
 *  own name, same as it appears in the header fields) — a dedicated
 *  component so each tab's `getDocStore(id)(...)` is its own single, fixed
 *  hook call per mounted instance, rather than a variable number of hook
 *  calls inside a .map() in the parent (which the rules of hooks forbid). */
function TabButton({
  id,
  active,
  closable,
  onSelect,
  onClose,
  T,
}: {
  id: string;
  active: boolean;
  closable: boolean;
  onSelect: () => void;
  onClose: () => void;
  T: ReturnType<typeof t>;
}) {
  const name = getDocStore(id)((s) => s.header.name);
  const label = name.trim() || T.untitledCv;

  return (
    <button type="button" className={"tab-item" + (active ? " active" : "")} onClick={onSelect} title={label}>
      <span className="tab-item-label">{label}</span>
      {closable && (
        <span
          role="button"
          tabIndex={0}
          className="tab-item-close"
          title={T.closeTab}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }
          }}
        >
          ×
        </span>
      )}
    </button>
  );
}

/** Lets several CVs stay open side by side — e.g. one kept as reference
 *  while another is drafted as a cover letter — rather than one editor
 *  session always overwriting the last. Each tab is its own fully
 *  independent, independently-persisted document (see state/tabs.ts); this
 *  bar is just the switcher/opener/closer UI on top of that. */
export function TabBar({ lang }: { lang: Lang }) {
  const T = t(lang);
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const addTab = useTabsStore((s) => s.addTab);
  const duplicateActiveTab = useTabsStore((s) => s.duplicateActiveTab);
  const closeTab = useTabsStore((s) => s.closeTab);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);
  const atLimit = tabs.length >= MAX_TABS;

  const handleClose = (id: string) => {
    if (window.confirm(T.confirmCloseTab)) closeTab(id);
  };

  return (
    <div className="tab-bar">
      <div className="tab-bar-items">
        {tabs.map((id) => (
          <TabButton
            key={id}
            id={id}
            active={id === activeId}
            closable={tabs.length > 1}
            onSelect={() => setActiveTab(id)}
            onClose={() => handleClose(id)}
            T={T}
          />
        ))}
      </div>
      <div className="tab-bar-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={duplicateActiveTab}
          disabled={atLimit}
          title={atLimit ? T.tabLimitReached : T.duplicateTab}
        >
          ⧉
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={addTab}
          disabled={atLimit}
          title={atLimit ? T.tabLimitReached : T.newTab}
        >
          +
        </button>
      </div>
    </div>
  );
}
