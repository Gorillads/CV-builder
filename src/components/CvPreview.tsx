import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { CSSProperties, ReactNode } from "react";
import type { Category, Lang, LibraryItem } from "../model/types";
import { t } from "../i18n";
import { FONTS, SCHEMES, HEAD_SIZES, SIDE_DEFAULT, byId, defaultVariant } from "../data/designTokens";
import { usePageOverflow } from "../hooks/usePageOverflow";

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
      {overflow.overflowing && <div className="page-overflow-warning">⚠ {T.pageOverflow(overflow.overflowPx)}</div>}
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

  const themeStyle = {
    "--cv-head": font.head,
    "--cv-body": font.body,
    "--cv-name-size": `${headSize.namePx}px`,
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
          <div className="cv-grid-sidebar">
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
        <Page
          className={`${pageClass} cv-appendix`}
          lang={lang}
          footer={{
            enabled: design.footer.enabled,
            label: T.footerAppendixLabel,
            pageNumberLabel: T.pageLabel(2),
            revision: design.footer.revision,
          }}
        >
          <h2>{T.appendix}</h2>
          <div className="cv-flow">
            <SectionFlow ids={apxIds} categories={categories} variants={variant} lang={lang} />
          </div>
        </Page>
      )}
    </div>
  );
}
