import type { Activity, Category, Lang, LibraryItem } from "../model/types";

/** All matching is against the currently displayed language only — the
 *  same text the user is looking at, so a hit is always visible right
 *  where the search says it is. `query` is expected pre-trimmed and
 *  lowercased by the caller (it's checked against many rows, so callers
 *  normalize it once up front instead of on every row). */
export function activityMatchesQuery(activity: Activity, lang: Lang, query: string): boolean {
  return activity[lang].toLowerCase().includes(query);
}

export function itemMatchesQuery(item: LibraryItem, lang: Lang, query: string): boolean {
  const text = item[lang];
  return (
    text.head.toLowerCase().includes(query) ||
    text.meta.toLowerCase().includes(query) ||
    text.comment.toLowerCase().includes(query) ||
    text.desc.toLowerCase().includes(query) ||
    item.activities.some((a) => activityMatchesQuery(a, lang, query))
  );
}

export function categoryMatchesQuery(category: Category, items: LibraryItem[], lang: Lang, query: string): boolean {
  return (
    category.title[lang].toLowerCase().includes(query) ||
    category.blurb[lang].toLowerCase().includes(query) ||
    items.some((it) => itemMatchesQuery(it, lang, query))
  );
}
