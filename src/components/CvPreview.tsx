import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { CSSProperties, ReactNode } from "react";
import type { Category, Lang, LibraryItem } from "../model/types";
import { t } from "../i18n";
import { FONTS, SCHEMES, HEAD_SIZES, HEADING_SIZES, SIDE_DEFAULT, byId, defaultVariant } from "../data/designTokens";
import { usePageOverflow, pxToMm, type PageOverflow } from "../hooks/usePageOverflow";

/** A4 content box (1123px tall, 40px vertical padding) — the fixed
 *  geometry both the pagination hook and the overflow-detecting Page
 *  component measure against. */
const PAGE_HEIGHT = 1123;
/** Matches .cv-page's CSS width — used only as the zoom viewport's initial
 *  size guess, before its first real measurement lands (see ZoomViewport). */
const PAGE_WIDTH = 794;
const PAGE_VERTICAL_PADDING = 80;
const FOOTER_HEIGHT = 46;
/** A continuation ("Bilag") page's title costs extra height on top of the
 *  page's own padding. */
const APPENDIX_TITLE_HEIGHT = 46;
/** offsetHeight doesn't include an element's own trailing margin (it
 *  collapses out of the measured box), so these approximate the CSS
 *  margin-bottom of `.cv-header` / `.cv-section` for budgeting purposes. */
const HEADER_GAP = 24;
const SECTION_GAP = 18;

function selectedActivityTexts(
  selectedActivities: Record<string, number[]>,
  item: LibraryItem,
  lang: Lang,
): string[] {
  const indices = selectedActivities[item.id] ?? item.activities.map((_, i) => i);
  return indices.map((i) => item.activities[i]).filter(Boolean).map((a) => a[lang] || a.da);
}

function TagsBlock({ items, lang, variant }: { items: LibraryItem[]; lang: Lang; variant: string }) {
  if (variant === "inline") {
    return <p className="cv-tags-inline">{items.map((it) => it[lang].head).filter(Boolean).join(" · ")}</p>;
  }
  return (
    <div className="cv-tags">
      {items.map((it) => (
        <span className="cv-tag" key={it.id}>
          {it[lang].head}
        </span>
      ))}
    </div>
  );
}

function EntryBlock({
  item,
  lang,
  variant,
  selectedActivities,
}: {
  item: LibraryItem;
  lang: Lang;
  variant: string;
  selectedActivities: Record<string, number[]>;
}) {
  const text = item[lang];

  if (variant === "line") {
    return (
      <div className="cv-entry cv-entry--line">
        <span className="cv-entry-line-head">{text.head}</span>
        {text.meta && <span className="cv-entry-line-meta">{text.meta}</span>}
      </div>
    );
  }

  const acts = selectedActivityTexts(selectedActivities, item, lang);
  const showHead = text.head || (variant !== "rows" && text.meta);

  return (
    <div className={"cv-entry" + (variant === "rows" ? " cv-entry--rows" : "")}>
      {variant === "rows" && <div className="cv-entry-meta-col">{text.meta}</div>}
      <div className="cv-entry-body">
        {showHead && (
          <div className="cv-entry-head">
            <strong>{text.head}</strong>
            {variant !== "rows" && text.meta && <span className="cv-entry-meta">{text.meta}</span>}
          </div>
        )}
        {text.desc && <p className="cv-entry-desc">{text.desc}</p>}
        {acts.length > 0 && (
          <ul className="cv-entry-acts">
            {acts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function groupLabelOf(item: LibraryItem, lang: Lang): string {
  return (item.group?.[lang] || item.group?.da || item.group?.en || "").trim();
}

/** Renders entry items in order, inserting a subheading whenever the
 *  item's group ("Kategori" in the CSV) differs from the previous one —
 *  ungrouped items (the common case) get no heading at all. */
function EntryList({
  items,
  lang,
  variant,
  selectedActivities,
}: {
  items: LibraryItem[];
  lang: Lang;
  variant: string;
  selectedActivities: Record<string, number[]>;
}) {
  return (
    <>
      {items.map((it, i) => {
        const group = groupLabelOf(it, lang);
        const prevGroup = i > 0 ? groupLabelOf(items[i - 1], lang) : "";
        const showHeading = group !== "" && group !== prevGroup;
        return (
          <Fragment key={it.id}>
            {showHeading && <h4 className="cv-subgroup">{group}</h4>}
            <EntryBlock item={it} lang={lang} variant={variant} selectedActivities={selectedActivities} />
          </Fragment>
        );
      })}
    </>
  );
}

function SectionBlock({ category, lang, variant }: { category: Category; lang: Lang; variant: string }) {
  const items = useStore(
    useShallow((s) => {
      const ids = s.selectedItems[category.id] ?? [];
      return ids.map((id) => s.items[id]).filter((it): it is LibraryItem => !!it);
    }),
  );
  const selectedActivities = useStore((s) => s.selectedActivities);
  if (!items.length && !category.blurb[lang]) return null;

  // "chips"/"inline" are compact, name-only display choices available to
  // any category; every other variant renders the full entry shape (name,
  // year/source, description, activities) — the same for every category.
  const usePillRendering = variant === "chips" || variant === "inline";

  return (
    <section className="cv-section">
      <h3>{category.title[lang]}</h3>
      {category.blurb[lang] && <p className="cv-blurb">{category.blurb[lang]}</p>}
      {usePillRendering ? (
        <TagsBlock items={items} lang={lang} variant={variant} />
      ) : variant === "two-col" ? (
        <div className="cv-entries-grid">
          <EntryList items={items} lang={lang} variant="standard" selectedActivities={selectedActivities} />
        </div>
      ) : (
        <EntryList items={items} lang={lang} variant={variant} selectedActivities={selectedActivities} />
      )}
    </section>
  );
}

function SectionFlow({
  ids,
  categories,
  variants,
  lang,
}: {
  ids: string[];
  categories: Record<string, Category>;
  variants: Record<string, string>;
  lang: Lang;
}) {
  return (
    <>
      {ids.map((id) => {
        const cat = categories[id];
        return <SectionBlock key={id} category={cat} lang={lang} variant={variants[id] ?? defaultVariant()} />;
      })}
    </>
  );
}

function HeaderBlock({
  name,
  appliedTitle,
  phone,
  mail,
  location,
  headKind,
}: {
  name: string;
  appliedTitle: string;
  phone: string;
  mail: string;
  location: string;
  headKind: string;
}) {
  return (
    <header className={`cv-header head-${headKind}`}>
      <h1>{name || "—"}</h1>
      {appliedTitle && <p className="cv-applied-title">{appliedTitle}</p>}
      <p className="cv-contact">{[phone, mail, location].filter(Boolean).join(" · ")}</p>
    </header>
  );
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

interface PaginationResult {
  page1Main: string[];
  page1Aside: string[];
  overflowChunks: string[][];
}

function samePagination(a: PaginationResult, b: PaginationResult): boolean {
  return (
    sameIds(a.page1Main, b.page1Main) &&
    sameIds(a.page1Aside, b.page1Aside) &&
    a.overflowChunks.length === b.overflowChunks.length &&
    a.overflowChunks.every((chunk, i) => sameIds(chunk, b.overflowChunks[i]))
  );
}

/** Greedily takes as many leading ids as fit within `budget` (always at
 *  least one, even if it alone overflows) and returns the rest — a
 *  reading-order-preserving prefix split, not general bin-packing. */
function splitPrefix(ids: string[], heights: Map<string, number>, budget: number): { fit: string[]; overflow: string[] } {
  const fit: string[] = [];
  const overflow: string[] = [];
  let used = 0;
  ids.forEach((id) => {
    const h = (heights.get(id) ?? 0) + SECTION_GAP;
    if (fit.length === 0 || used + h <= budget) {
      fit.push(id);
      used += h;
    } else {
      overflow.push(id);
    }
  });
  return { fit, overflow };
}

/** Packs a list of ids into page-sized chunks by greedily filling pages in
 *  order, same algorithm as the old fixed appendix packer. */
function chunkByBudget(ids: string[], heights: Map<string, number>, budget: number): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  let used = 0;
  ids.forEach((id) => {
    const h = (heights.get(id) ?? 0) + SECTION_GAP;
    if (current.length && used + h > budget) {
      result.push(current);
      current = [];
      used = 0;
    }
    current.push(id);
    used += h;
  });
  if (current.length) result.push(current);
  return result;
}

/** Automatic pagination: measures the header and every active category's
 *  real rendered height via a hidden off-screen twin (single fixed column
 *  width, regardless of struct — a two-column struct's CSS columns just
 *  make an already-safe page more compact, never overflow it), then
 *  decides how much fits on page 1 and greedily flows the rest onto
 *  continuation "Bilag" pages. For the sidebar struct, main and aside are
 *  simultaneous columns rather than stacked, so each gets its own
 *  independent prefix-fit against the same page-1 budget; their combined
 *  overflow is re-sequenced back into `activeIds`' original order before
 *  being chunked into continuation pages. Returns no continuation pages
 *  at all when everything already fits on page 1. */
function usePagination(
  activeIds: string[],
  mainIds: string[],
  asideIds: string[],
  isSidebar: boolean,
  variants: Record<string, string>,
  lang: Lang,
  footerEnabled: boolean,
): { result: PaginationResult; measureRef: RefObject<HTMLDivElement | null> } {
  const measureRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<PaginationResult>(() => ({
    page1Main: mainIds,
    page1Aside: asideIds,
    overflowChunks: [],
  }));

  useEffect(() => {
    const container = measureRef.current;
    if (!container || activeIds.length === 0) {
      setResult((prev) => {
        const next: PaginationResult = { page1Main: mainIds, page1Aside: asideIds, overflowChunks: [] };
        return samePagination(prev, next) ? prev : next;
      });
      return;
    }

    const appendixBudget = PAGE_HEIGHT - PAGE_VERTICAL_PADDING - APPENDIX_TITLE_HEIGHT - (footerEnabled ? FOOTER_HEIGHT : 0);

    const measure = () => {
      const heights = new Map<string, number>();
      activeIds.forEach((id) => {
        const el = container.querySelector<HTMLElement>(`[data-measure-id="${CSS.escape(id)}"]`);
        if (el) heights.set(id, el.offsetHeight);
      });
      const headerEl = container.querySelector<HTMLElement>('[data-measure-id="__header__"]');
      const headerHeight = (headerEl?.offsetHeight ?? 0) + HEADER_GAP;
      const page1Budget = PAGE_HEIGHT - PAGE_VERTICAL_PADDING - (footerEnabled ? FOOTER_HEIGHT : 0) - headerHeight;

      let page1Main: string[];
      let page1Aside: string[];
      let overflowSet: Set<string>;

      if (isSidebar) {
        const mainSplit = splitPrefix(mainIds, heights, page1Budget);
        const asideSplit = splitPrefix(asideIds, heights, page1Budget);
        page1Main = mainSplit.fit;
        page1Aside = asideSplit.fit;
        overflowSet = new Set([...mainSplit.overflow, ...asideSplit.overflow]);
      } else {
        const split = splitPrefix(mainIds, heights, page1Budget);
        page1Main = split.fit;
        page1Aside = [];
        overflowSet = new Set(split.overflow);
      }

      const overflow = activeIds.filter((id) => overflowSet.has(id));
      const overflowChunks = overflow.length ? chunkByBudget(overflow, heights, appendixBudget) : [];
      const next: PaginationResult = { page1Main, page1Aside, overflowChunks };
      setResult((prev) => (samePagination(prev, next) ? prev : next));
    };

    // Content edits (new/removed items, longer text) resize the measured
    // elements without changing the id lists themselves, so re-pagination
    // has to react to the actual DOM rather than a React dependency array.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    Array.from(container.children).forEach((child) => ro.observe(child));
    const mo = new MutationObserver(measure);
    mo.observe(container, { childList: true, subtree: true, characterData: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
    // Re-attach observers whenever the visible set, columns, its formats,
    // language, or the page budget (footer) changes; the observers alone
    // handle content edits within an already-observed category.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIds.join("|"), mainIds.join("|"), asideIds.join("|"), isSidebar, JSON.stringify(variants), lang, footerEnabled]);

  return { result, measureRef };
}

function OverflowPages({
  chunks,
  categories,
  variants,
  lang,
  pageClass,
  footerEnabled,
  footerRevision,
}: {
  chunks: string[][];
  categories: Record<string, Category>;
  variants: Record<string, string>;
  lang: Lang;
  pageClass: string;
  footerEnabled: boolean;
  footerRevision: string;
}) {
  const T = t(lang);
  return (
    <>
      {chunks.map((chunkIds, i) => (
        <Page
          key={i}
          className={`${pageClass} cv-appendix`}
          lang={lang}
          footer={{
            enabled: footerEnabled,
            label: T.footerAppendixLabel,
            pageNumberLabel: T.pageLabel(2 + i),
            revision: footerRevision,
          }}
        >
          <h2>
            {T.appendix}
            {i > 0 ? ` (${i + 1})` : ""}
          </h2>
          <div className="cv-flow">
            <SectionFlow ids={chunkIds} categories={categories} variants={variants} lang={lang} />
          </div>
        </Page>
      ))}
    </>
  );
}

interface FooterInfo {
  enabled: boolean;
  label: string;
  pageNumberLabel: string;
  revision: string;
}

/** One printed sheet: measures its own content against the fixed A4 box
 *  (see usePageOverflow) and surfaces a warning below it when the CV
 *  won't actually fit on one page. `onOverflowChange` lets a parent
 *  mirror this page's status somewhere else on screen — used for the
 *  main page's status pill pinned in the toolbar, which stays visible
 *  without scrolling all the way down to this page's own bottom edge. */
function Page({
  className,
  children,
  lang,
  footer,
  onOverflowChange,
}: {
  className: string;
  children: ReactNode;
  lang: Lang;
  footer: FooterInfo;
  onOverflowChange?: (overflow: PageOverflow) => void;
}) {
  const T = t(lang);
  const [ref, overflow] = usePageOverflow<HTMLDivElement>();

  useEffect(() => {
    onOverflowChange?.(overflow);
  }, [overflow, onOverflowChange]);

  return (
    <>
      <div ref={ref} className={className + (overflow.overflowing ? " cv-page--overflow" : "")}>
        {children}
        {footer.enabled && (
          <footer className="cv-footer">
            <span>
              {footer.label} · {footer.pageNumberLabel}
            </span>
            {footer.revision && <span>{footer.revision}</span>}
          </footer>
        )}
      </div>
      {overflow.overflowing ? (
        <div className="page-overflow-warning">⚠ {T.pageOverflow(overflow.overflowPx)}</div>
      ) : (
        <div className="page-space-remaining">{T.spaceRemaining(pxToMm(overflow.remainingPx))}</div>
      )}
    </>
  );
}

/** Visually scales its children (the real, unscaled pages) for the zoom
 *  control, while keeping the space it occupies in the surrounding layout
 *  sized to match — otherwise a `transform: scale` alone would either
 *  leave dead space below the shrunk pages (zoomed out) or need its own
 *  scrollbar for the part that grew past its box (zoomed in). Measures its
 *  own natural (pre-transform) size via ResizeObserver, the same pattern
 *  already used by the pagination/overflow hooks above, so it stays
 *  correct for however many pages and indicator lines are actually
 *  rendered rather than a hand-computed guess. */
function ZoomViewport({ zoom, children }: { zoom: number; children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  // Height guess includes headroom for the space-remaining/overflow line
  // below the page, so the viewport doesn't clip it for the one frame
  // before the real measurement below lands.
  const [size, setSize] = useState({ width: PAGE_WIDTH, height: PAGE_HEIGHT + 60 });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setSize({ width: el.offsetWidth, height: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });

  return (
    <div className="cv-zoom-viewport" style={{ width: size.width * zoom, height: size.height * zoom }}>
      <div ref={frameRef} className="cv-zoom-frame" style={{ transform: `scale(${zoom})` }}>
        {children}
      </div>
    </div>
  );
}

export function CvPreview({
  lang,
  onMainPageStatus,
  zoom = 1,
}: {
  lang: Lang;
  /** Reports the main (first) page's overflow/remaining-space status on
   *  every measurement, so a caller can show it somewhere always-visible
   *  (e.g. pinned in the toolbar) instead of only below the page itself. */
  onMainPageStatus?: (overflow: PageOverflow) => void;
  /** On-screen display scale, purely visual — pagination and overflow
   *  measurement always happen against the real (unscaled) page size. */
  zoom?: number;
}) {
  const T = t(lang);
  const order = useStore((s) => s.order);
  const categories = useStore((s) => s.categories);
  const on = useStore((s) => s.on);
  const variant = useStore((s) => s.variant);
  const header = useStore((s) => s.header);
  const appliedTitle = useStore((s) => s.appliedTitle);
  const design = useStore((s) => s.design);

  const activeIds = order.filter((id) => categories[id] && !categories[id].isHidden && on[id]);

  const font = byId(FONTS, design.font);
  const scheme = byId(SCHEMES, design.scheme);
  const headSize = byId(HEAD_SIZES, design.headSize);
  const headingSize = byId(HEADING_SIZES, design.headingSize);

  const themeStyle = {
    "--cv-head": font.head,
    "--cv-body": font.body,
    "--cv-name-size": `${headSize.namePx}px`,
    "--cv-heading-size": `${headingSize.px}px`,
    "--cv-accent": scheme.accent,
    "--cv-accent-soft": scheme.soft,
    "--cv-line": scheme.line,
    "--cv-chip-border": scheme.chipBorder,
    "--cv-chip-bg": scheme.chipBg,
    "--cv-chip-fg": scheme.chipFg,
  } as CSSProperties;

  const isSidebar = design.struct === "sidebar";
  const sidebarIds = isSidebar ? activeIds.filter((id) => SIDE_DEFAULT.has(id)) : [];
  const mainIds = isSidebar ? activeIds.filter((id) => !SIDE_DEFAULT.has(id)) : activeIds;
  const pageClass = `cv-page struct-${design.struct} density-${design.density}`;
  const sidebarClass = `cv-grid-sidebar side-${design.sidebarSide}`;

  const { result, measureRef } = usePagination(
    activeIds,
    mainIds,
    sidebarIds,
    isSidebar,
    variant,
    lang,
    design.footer.enabled,
  );
  return (
    <div className="cv-preview" style={themeStyle} id="cv-print-area">
      <div ref={measureRef} className={`${pageClass} cv-measure-hidden`} aria-hidden="true">
        <div data-measure-id="__header__">
          <HeaderBlock
            name={header.name}
            appliedTitle={appliedTitle[lang]}
            phone={header.phone}
            mail={header.mail}
            location={header.location[lang]}
            headKind={design.headKind}
          />
        </div>
        {activeIds.map((id) => (
          <div key={id} data-measure-id={id}>
            <SectionBlock category={categories[id]} lang={lang} variant={variant[id] ?? defaultVariant()} />
          </div>
        ))}
      </div>
      <ZoomViewport zoom={zoom}>
        <Page
          className={pageClass}
          lang={lang}
          footer={{
            enabled: design.footer.enabled,
            label: T.footerCvLabel,
            pageNumberLabel: T.pageLabel(1),
            revision: design.footer.revision,
          }}
          onOverflowChange={onMainPageStatus}
        >
          <HeaderBlock
            name={header.name}
            appliedTitle={appliedTitle[lang]}
            phone={header.phone}
            mail={header.mail}
            location={header.location[lang]}
            headKind={design.headKind}
          />
          {isSidebar ? (
            <div className={sidebarClass}>
              <div className="cv-main">
                <SectionFlow ids={result.page1Main} categories={categories} variants={variant} lang={lang} />
              </div>
              <aside className="cv-aside">
                <SectionFlow ids={result.page1Aside} categories={categories} variants={variant} lang={lang} />
              </aside>
            </div>
          ) : (
            <div className="cv-flow">
              <SectionFlow ids={result.page1Main} categories={categories} variants={variant} lang={lang} />
            </div>
          )}
        </Page>
        {result.overflowChunks.length > 0 && (
          <OverflowPages
            chunks={result.overflowChunks}
            categories={categories}
            variants={variant}
            lang={lang}
            pageClass={pageClass}
            footerEnabled={design.footer.enabled}
            footerRevision={design.footer.revision}
          />
        )}
      </ZoomViewport>
    </div>
  );
}
