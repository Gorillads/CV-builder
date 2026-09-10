import { useState } from "react";
import { useStore } from "../state/store";
import type { Lang } from "../model/types";
import { t } from "../i18n";
import { CategoryCard } from "./CategoryCard";

export function ContentTab({ lang }: { lang: Lang }) {
  const T = t(lang);
  const order = useStore((s) => s.order);
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const restoreHiddenCategories = useStore((s) => s.restoreHiddenCategories);
  const [newName, setNewName] = useState("");

  const visible = order.filter((id) => categories[id] && !categories[id].isHidden);
  const hasHidden = Object.values(categories).some((c) => c.isHidden);

  return (
    <div className="tab-content">
      {hasHidden && (
        <button type="button" className="link-btn" onClick={restoreHiddenCategories}>
          {T.restoreHidden}
        </button>
      )}
      {visible.map((id) => (
        <CategoryCard key={id} category={categories[id]} lang={lang} />
      ))}
      <form
        className="new-category-form"
        onSubmit={(e) => {
          e.preventDefault();
          addCategory(newName);
          setNewName("");
        }}
      >
        <input
          className="field"
          placeholder={T.newCategoryPlaceholder}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn">
          + {T.newCategory}
        </button>
      </form>
    </div>
  );
}
