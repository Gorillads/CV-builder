import { useEffect, useRef, useState, type RefObject } from "react";
import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { CSSProperties, ReactNode } from "react";
import type { Category, Lang, LibraryItem } from "../model/types";
import { t } from "../i18n";
import { FONTS, SCHEMES, HEAD_SIZES, HEADING_SIZES, SIDE_DEFAULT, byId, defaultVariant } from "../data/designTokens";
import { usePageOverflow, pxToMm } from "../hooks/usePageOverflow";

/** A4 content box (1123px tall, 40px vertical padding) minus the "Bilag"
 *  title's own height — the budget available for an appendix page's
 *  sections. Kept in one place since both the pagination hook and the
 *  overflow-detecting Page component need the same fixed geometry. */
const APPENDIX_TITLE_HEIGHT = 46;
const PAGE_VERTICAL_PADDING = 80;
const FOOTER_HEIGHT = 46;

function selectedActivityTexts(
  selectedActivities: Record<string, number[]>,
  item: LibraryItem,
  lang: Lang,
): string[] {
  const indices = selectedActivities[item.id] ?? item.activities.map((_, i) => i);
  return indices.map((i) => item.activities[i]).filter(Boolean).map((a) => a[lang] || a.da);
}

function TagsBlock({ items, lang, variant }: { items: LibraryItem[]; lang: Lang; variant: string }) {
  if (variant === "list") {
    return (
      <ul className="cv-taglist">
        {items.map((it) => (
          <li key={it.id}>{it[lang].tagValue}</li>
        ))}
      </ul>
    );
  }
  if (variant === "inline") {
    return <p className="cv-tags-inline">{items.map((it) => it[lang].tagValue).filter(Boolean).join(" · ")}</p>;
  }
  return (
    <div className="cv-tags">
      {items.map((it) => (
        <span className="cv-tag" key={it.id}>
          {it[lang].tagValue}
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

  return (
    <div className={"cv-entry" + (variant === "rows" ? " cv-entry--rows" : "")}>
      {variant === "rows" && <div className="cv-entry-meta-col">{text.meta}</div>}
      <div className="cv-entry-body">
        <div className="cv-entry-head">
          <strong>{text.head}</strong>
          {variant !== "rows" && text.meta && <span className="cv-entry-meta">{text.meta}</span>}
        </div>
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

function SectionBlock({ category, lang, variant }: { category: Category; lang: Lang; variant: string }) {
  const items = useStore(
    useShallow((s) => {
      const ids = s.selectedItems[category.id] ?? [];
      return ids.map((id) => s.items[id]).filter((it): it is LibraryItem => !!it);
    }),
  );
  const selectedActivities = useStore((s) => s.selectedActivities);
  if (!items.length && !category.blurb[lang]) return null;

  return (
    <section className="cv-section">
      <h3>{category.title[lang]}</h3>
      {category.blurb[lang] && <p className="cv-blurb">{category.blurb[lang]}</p>}
      {category.kind === "tags" ? (
        <TagsBlock items={items} lang={lang} variant={variant} />
      ) : variant === "two-col" ? (
        <div className="cv-entries-grid">
          {items.map((it) => (
            <EntryBlock key={it.id} item={it} lang={lang} variant="standard" selectedActivities={selectedActivities} />
          ))}
        </div>
      ) : (
        items.map((it) => (
          <EntryBlock key={it.id} item={it} lang={lang} variant={variant} selectedActivities={selectedActivities} />
        ))
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
        return <SectionBlock key={id} category={cat} lang={lang} variant={variants[id] ?? defaultVariant(cat.kind)} />;
      })}
    </>
  );
}

/** Packs appendix sections into page-sized chunks by actually measuring
 *  each section's rendered height (in a hidden, full-width copy) and
 *  greedily filling pages in order — the same section never reorders,
 *  it just starts a new page when it wouldn't fit. Measured at a fixed
 *  single-column width regardless of the chosen page structure, so a
 *  two-column struct's CSS columns only make an already-safe page more
 *  compact, never overflow it. */
function sameChunks(a: string[][], b: string[][]): boolean {
  if (a.length !== b.length) return false;
  return a.every((chunk, i) => chunk.length === b[i].length && chunk.every((id, j) => id === b[i][j]));
}

function useAppendixChunks(
  ids: string[],
  variants: Record<string, string>,
  lang: Lang,
  budgetPx: number,
): { chunks: string[][]; measureRef: RefObject<HTMLDivElement | null> } {
  const measureRef = useRef<HTMLDivElement>(null);
  const [chunks, setChunks] = useState<string[][]>(() => (ids.length ? [ids] : []));

  useEffect(() => {
    const container = measureRef.current;
    if (!container || ids.length === 0) {
      setChunks(ids.length ? [ids] : []);
      return;
    }
    const GAP = 18; // approximates .cv-section's own margin-bottom

    const measure = () => {
      const heights = new Map<string, number>();
      ids.forEach((id) => {
        const el = container.querySelector<HTMLElement>(`[data-measure-id="${CSS.escape(id)}"]`);
        if (el) heights.set(id, el.offsetHeight);
      });
      const result: string[][] = [];
      let current: string[] = [];
      let used = 0;
      ids.forEach((id) => {
        const h = (heights.get(id) ?? 0) + GAP;
        if (current.length && used + h > budgetPx) {
          result.push(current);
          current = [];
          used = 0;
        }
        current.push(id);
        used += h;
      });
      if (current.length) result.push(current);
      const next = result.length ? result : [ids];
      setChunks((prev) => (sameChunks(prev, next) ? prev : next));
    };

    // Content edits (new/removed items, longer text) resize the measured
    // section elements without changing `ids` itself, so re-chunking has
    // to react to the actual DOM rather than a React dependency array.
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
    // Re-attach observers whenever the visible set, its formats, language,
    // or the page budget (density/footer) changes; the observers alone
    // handle content edits within an already-observed category.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|"), JSON.stringify(variants), lang, budgetPx]);

  return { chunks: chunks.length ? chunks : [[]], measureRef };
}

function AppendixPages({
  ids,
  categories,
  variants,
  lang,
  pageClass,
  footerEnabled,
  footerRevision,
}: {
  ids: string[];
  categories: Record<string, Category>;
  variants: Record<string, string>;
  lang: Lang;
  pageClass: string;
  footerEnabled: boolean;
  footerRevision: string;
}) {
  const T = t(lang);
  const budget = 1123 - PAGE_VERTICAL_PADDING - APPENDIX_TITLE_HEIGHT - (footerEnabled ? FOOTER_HEIGHT : 0);
  const { chunks, measureRef } = useAppendixChunks(ids, variants, lang, budget);

  return (
    <>
      <div ref={measureRef} className={`${pageClass} cv-measure-hidden`} aria-hidden="true">
        {ids.map((id) => {
          const cat = categories[id];
          return (
            <div key={id} data-measure-id={id}>
              <SectionBlock category={cat} lang={lang} variant={variants[id] ?? defaultVariant(cat.kind)} />
            </div>
          );
        })}
      </div>
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
 *  won't actually fit on one page. */
function Page({
  className,
  children,
  lang,
  footer,
}: {
  className: string;
  children: ReactNode;
  lang: Lang;
  footer: FooterInfo;
}) {
  const T = t(lang);
  const [ref, overflow] = usePageOverflow<HTMLDivElement>();

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

export function CvPreview({ lang }: { lang: Lang }) {
  const T = t(lang);
  const order = useStore((s) => s.order);
  const categories = useStore((s) => s.categories);
  const on = useStore((s) => s.on);
  const place = useStore((s) => s.place);
  const variant = useStore((s) => s.variant);
  const header = useStore((s) => s.header);
  const appliedTitle = useStore((s) => s.appliedTitle);
  const design = useStore((s) => s.design);

  const active = order.filter((id) => categories[id] && !categories[id].isHidden && on[id]);
  const cvIds = active.filter((id) => (place[id] ?? "cv") === "cv");
  const apxIds = active.filter((id) => (place[id] ?? "cv") === "apx");

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

  const sidebarIds = design.struct === "sidebar" ? cvIds.filter((id) => SIDE_DEFAULT.has(id)) : [];
  const mainIds = design.struct === "sidebar" ? cvIds.filter((id) => !SIDE_DEFAULT.has(id)) : cvIds;
  const pageClass = `cv-page struct-${design.struct} density-${design.density}`;
  const sidebarClass = `cv-grid-sidebar side-${design.sidebarSide}`;

  return (
    <div className="cv-preview" style={themeStyle} id="cv-print-area">
      <Page
        className={pageClass}
        lang={lang}
        footer={{
          enabled: design.footer.enabled,
          label: T.footerCvLabel,
          pageNumberLabel: T.pageLabel(1),
          revision: design.footer.revision,
        }}
      >
        <header className={`cv-header head-${design.headKind}`}>
          <h1>{header.name || "—"}</h1>
          {appliedTitle[lang] && <p className="cv-applied-title">{appliedTitle[lang]}</p>}
          <p className="cv-contact">
            {[header.phone, header.mail, header.location[lang]].filter(Boolean).join(" · ")}
          </p>
        </header>
        {design.struct === "sidebar" ? (
          <div className={sidebarClass}>
            <div className="cv-main">
              <SectionFlow ids={mainIds} categories={categories} variants={variant} lang={lang} />
            </div>
            <aside className="cv-aside">
              <SectionFlow ids={sidebarIds} categories={categories} variants={variant} lang={lang} />
            </aside>
          </div>
        ) : (
          <div className="cv-flow">
            <SectionFlow ids={mainIds} categories={categories} variants={variant} lang={lang} />
          </div>
        )}
      </Page>
      {apxIds.length > 0 && (
        <AppendixPages
          ids={apxIds}
          categories={categories}
          variants={variant}
          lang={lang}
          pageClass={pageClass}
          footerEnabled={design.footer.enabled}
          footerRevision={design.footer.revision}
        />
      )}
    </div>
  );
}
