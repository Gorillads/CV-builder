import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import type { Category, Lang, LibraryItem } from "../model/types";
import { t } from "../i18n";

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
            <div className="cv-entry-head">
              <strong>{it[lang].head}</strong>
              {it[lang].meta && <span className="cv-entry-meta">{it[lang].meta}</span>}
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
        ))
      )}
    </section>
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

  const active = order.filter((id) => categories[id] && !categories[id].isHidden && on[id]);
  const cvIds = active.filter((id) => (place[id] ?? "cv") === "cv");
  const apxIds = active.filter((id) => (place[id] ?? "cv") === "apx");

  return (
    <div className="cv-preview">
      <div className="cv-page">
        <header className="cv-header">
          <h1>{header.name || "—"}</h1>
          {appliedTitle[lang] && <p className="cv-applied-title">{appliedTitle[lang]}</p>}
          <p className="cv-contact">
            {[header.phone, header.mail, header.location[lang]].filter(Boolean).join(" · ")}
          </p>
        </header>
        {cvIds.map((id) => (
          <SectionBlock key={id} category={categories[id]} lang={lang} />
        ))}
      </div>
      {apxIds.length > 0 && (
        <div className="cv-page cv-appendix">
          <h2>{T.appendix}</h2>
          {apxIds.map((id) => (
            <SectionBlock key={id} category={categories[id]} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
