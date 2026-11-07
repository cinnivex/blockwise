"use client";

import { useState } from "react";
import { setArchived } from "@/app/(app)/categories/actions";
import { colorName } from "@/lib/palette";
import type { Category } from "@/lib/types";
import { CategoryForm } from "./CategoryForm";

const buttonClass =
  "rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background";

export function CategoryCard({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl border border-border bg-surface p-4">
        <CategoryForm mode="edit" category={category} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
      <span
        className="size-10 shrink-0 rounded-lg"
        style={{ backgroundColor: category.color }}
        title={colorName(category.color)}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{category.name}</p>
        {category.description && (
          <p className="truncate text-sm text-muted">{category.description}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => setEditing(true)} className={buttonClass}>
          Edit<span className="sr-only"> {category.name}</span>
        </button>
        <form action={setArchived}>
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="archived" value="true" />
          <button type="submit" className={buttonClass}>
            Archive<span className="sr-only"> {category.name}</span>
          </button>
        </form>
      </div>
    </li>
  );
}
