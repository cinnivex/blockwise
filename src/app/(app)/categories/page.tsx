import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { setArchived } from "./actions";

export const metadata: Metadata = { title: "Categories · Blockwise" };

async function CategoryLists() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return <p role="alert" className="text-sm text-red-600">Couldn&apos;t load your categories. Refresh to try again.</p>;
  }

  const categories = (data ?? []) as Category[];
  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);

  return (
    <>
      <section aria-labelledby="active-heading" className="flex flex-col gap-3">
        <h2 id="active-heading" className="text-sm font-medium text-muted">
          Your categories ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            No categories yet. Add your first one above — something like &ldquo;Studying&rdquo; or
            &ldquo;Deep work&rdquo;.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {active.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 && (
        <details className="group rounded-xl border border-border bg-surface">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-muted">
            Archived ({archived.length})
          </summary>
          <ul className="flex flex-col divide-y divide-border border-t border-border">
            {archived.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="size-6 shrink-0 rounded-md opacity-60"
                  style={{ backgroundColor: c.color }}
                  aria-hidden
                />
                <span className="flex-1 truncate text-sm text-muted">{c.name}</span>
                <form action={setArchived}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="archived" value="false" />
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
                  >
                    Restore<span className="sr-only"> {c.name}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-medium">Categories</h1>
        <p className="mt-1 text-sm text-muted">
          Set these up once and reuse them every time you start the timer. Archiving hides a
          category from the timer but keeps its past time and color.
        </p>
      </div>

      <section aria-labelledby="new-heading" className="rounded-xl border border-border bg-surface p-5">
        <h2 id="new-heading" className="mb-4 font-medium">
          New category
        </h2>
        <CategoryForm mode="create" />
      </section>

      <Suspense fallback={<p className="text-sm text-muted">Loading your categories…</p>}>
        <CategoryLists />
      </Suspense>
    </div>
  );
}
