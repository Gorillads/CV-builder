import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { AppState } from "../model/types";
import { createDocumentStore, LEGACY_DOC_KEY, type Store } from "./store";
import { createDefaultState } from "../data/defaultCategories";
import { snapshotAppState } from "../json/backupJson";

/** How many CVs a person can have open at once — purely a sanity cap on
 *  the tab bar and on localStorage usage, not a meaningful product limit.
 *  The "+"/duplicate buttons just disable past this. */
export const MAX_TABS = 10;

/** The one tab id that always exists and is never actually removable (see
 *  closeTab below) — its document store is the original pre-tabs storage
 *  key (see LEGACY_DOC_KEY), so a returning user's one CV becomes this tab
 *  automatically, with nothing to migrate. */
const LEGACY_TAB_ID = "legacy";

let tabSeq = 0;
function newTabId(): string {
  tabSeq += 1;
  return `tab_${Date.now().toString(36)}_${tabSeq}`;
}

function docStorageKey(id: string): string {
  return id === LEGACY_TAB_ID ? LEGACY_DOC_KEY : `cv-builder-doc-${id}`;
}

type DocStore = ReturnType<typeof createDocumentStore>;

/** Every currently-open tab's document store, created lazily the first
 *  time it's needed (a fresh tab, or the legacy/any previously-saved tab
 *  on initial load) and kept here for the lifetime of the page — there's
 *  no need to ever recreate one, since each is independently persisted
 *  under its own key regardless of which tab is currently active. */
const docStoreCache = new Map<string, DocStore>();

export function getDocStore(id: string): DocStore {
  let store = docStoreCache.get(id);
  if (!store) {
    store = createDocumentStore(docStorageKey(id));
    docStoreCache.set(id, store);
  }
  return store;
}

function removeDocStorage(id: string): void {
  docStoreCache.delete(id);
  try {
    localStorage.removeItem(docStorageKey(id));
  } catch {
    // ignore — same best-effort spirit as safeStorage below.
  }
}

/** Same fallback-to-memory shape as store.ts's own safeStorage — this
 *  manifest (which tabs are open, and which is active) is small, separate
 *  persisted state of its own, so it needs the same guard independently. */
const memoryFallback = new Map<string, string>();
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return memoryFallback.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      memoryFallback.set(name, value);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      memoryFallback.delete(name);
    }
  },
};

interface TabsState {
  /** Open tab ids, in display order. Always at least one. */
  tabs: string[];
  activeId: string;
  /** Opens a new blank tab and makes it active. No-op past MAX_TABS. */
  addTab(): void;
  /** Opens a new tab seeded from an imported JSON backup and makes it
   *  active — used so importing a full-document backup never overwrites
   *  whatever's already open (see ImportExportBar.tsx). No-op past
   *  MAX_TABS. */
  addTabFromData(data: Partial<AppState>): void;
  /** Opens a new tab that's an exact copy of the currently active one and
   *  makes it active — e.g. to draft a cover letter in the same format
   *  without touching the CV it was copied from. No-op past MAX_TABS. */
  duplicateActiveTab(): void;
  /** Closes the given tab. If it's the only one open, its content is reset
   *  instead (there's always at least one tab) — otherwise the tab and its
   *  storage are removed outright, and if it was the active one, whichever
   *  tab now sits in its old position becomes active. */
  closeTab(id: string): void;
  setActiveTab(id: string): void;
}

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [LEGACY_TAB_ID],
      activeId: LEGACY_TAB_ID,

      addTab: () => {
        if (get().tabs.length >= MAX_TABS) return;
        const id = newTabId();
        set((s) => ({ tabs: [...s.tabs, id], activeId: id }));
      },

      addTabFromData: (data) => {
        if (get().tabs.length >= MAX_TABS) return;
        const id = newTabId();
        getDocStore(id).setState({ ...createDefaultState(), ...data });
        set((s) => ({ tabs: [...s.tabs, id], activeId: id }));
      },

      duplicateActiveTab: () => {
        if (get().tabs.length >= MAX_TABS) return;
        const sourceId = get().activeId;
        const id = newTabId();
        const snapshot = snapshotAppState(getDocStore(sourceId).getState());
        getDocStore(id).setState({ ...createDefaultState(), ...snapshot });
        set((s) => ({ tabs: [...s.tabs, id], activeId: id }));
      },

      closeTab: (id) => {
        set((s) => {
          const index = s.tabs.indexOf(id);
          if (index === -1) return s;
          const tabs = s.tabs.filter((t) => t !== id);
          if (tabs.length === 0) {
            getDocStore(id).getState().resetAll();
            return { tabs: [id], activeId: id };
          }
          removeDocStorage(id);
          const activeId = s.activeId === id ? tabs[Math.min(index, tabs.length - 1)] : s.activeId;
          return { tabs, activeId };
        });
      },

      setActiveTab: (id) => set({ activeId: id }),
    }),
    {
      name: "cv-builder-tabs-v1",
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);

/** Resolves to whichever document store the currently active tab points
 *  at, and subscribes the calling component to it with `selector` — the
 *  hook every tab-aware component uses instead of importing a document
 *  store directly, since which underlying store is "active" changes
 *  whenever the user switches tabs. Calling a *different* underlying
 *  store's hook across renders (as activeId changes) is safe here: it's
 *  always exactly one hook call, in the same position, on every render —
 *  React's rules of hooks only require a consistent call *count* and
 *  *order*, not that it's literally the same function reference each
 *  time. */
export function useActiveStore<T>(selector: (s: Store) => T): T {
  const activeId = useTabsStore((s) => s.activeId);
  return getDocStore(activeId)(selector);
}

/** Non-reactive equivalent of useActiveStore, for event handlers and other
 *  code outside of render that needs to read or act on whichever document
 *  is currently active without subscribing to it. */
export function getActiveDocStore(): DocStore {
  return getDocStore(useTabsStore.getState().activeId);
}
