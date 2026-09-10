import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { CSSProperties } from "react";
import type { Category, Lang, LibraryItem } from "../model/types";
import { t } from "../i18n";
import { FONTS, SCHEMES, HEAD_SIZES, SIDE_DEFAULT, byId } from "../data/designTokens";

function selectedActivityTexts(
  selectedActivities: Record<string, number[]>,
  item: LibraryItem,
  lang: Lang,
): string[] {
  const indices = selectedActivities[item.id] ?? item.activities.map((_, i) => i);
  return indices.map((i) => item.activities[i]).filter(Boolean).map((a) => a[lang] || a.da);
}

function SectionBlock({ category, lang }: { category: Category; lang: Lang }) {
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
        <div className="cv-tags">
          {items.map((it) => (
            <span className="cv-tag" key={it.id}>
              {it[lang].tagValue}
            </span>
          ))}
        </div>
      ) : (
        items.map((it) => (
          <div className="cv-entry" key={it.id}>
            <div className="cv-entry-meta-col">{it[lang].meta}</div>
            <div className="cv-entry-body">
              <div className="cv-entry-head">
                <strong>{it[lang].head}</strong>
                <span className="cv-entry-meta">{it[lang].meta}</span>
              </div>
              {it[lang].desc && <p className="cv-entry-desc">{it[lang].desc}</p>}
              {(() => {
                const acts = selectedActivityTexts(selectedActivities, it, lang);
                return acts.length ? (
                  <ul className="cv-entry-acts">
                    {acts.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                ) : null;
              })()}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function SectionFlow({ ids, categories, lang }: { ids: string[]; categories: Record<string, Category>; lang: Lang }) {
  return (
    <>
      {ids.map((id) => (
        <SectionBlock key={id} category={categories[id]} lang={lang} />
      ))}
    </>
  );
}

export function CvPreview({ lang }: { lang: Lang }) {
  const T = t(lang);
  const order = useStore((s) => s.order);
  const categories = useStore((s) => s.categories);
  const on = useStore((s) => s.on);
  const place = useStore((s) => s.place);
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

  return (
    <div className="cv-preview" style={themeStyle}>
      <div className={`cv-page struct-${design.struct}`}>
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
              <SectionFlow ids={mainIds} categories={categories} lang={lang} />
            </div>
            <aside className="cv-aside">
              <SectionFlow ids={sidebarIds} categories={categories} lang={lang} />
            </aside>
          </div>
        ) : (
          <div className="cv-flow">
            <SectionFlow ids={mainIds} categories={categories} lang={lang} />
          </div>
        )}
      </div>
      {apxIds.length > 0 && (
        <div className={`cv-page cv-appendix struct-${design.struct}`}>
          <h2>{T.appendix}</h2>
          <div className="cv-flow">
            <SectionFlow ids={apxIds} categories={categories} lang={lang} />
          </div>
        </div>
      )}
    </div>
  );
}
