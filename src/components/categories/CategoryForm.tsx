"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createCategory,
  updateCategory,
  type CategoryFormState,
  type CategoryValues,
} from "@/app/(app)/categories/actions";
import { PALETTE } from "@/lib/palette";
import type { Category } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-2 focus:outline-accent";

type Props =
  | { mode: "create"; category?: undefined; onDone?: () => void }
  | { mode: "edit"; category: Category; onDone: () => void };

export function CategoryForm({ mode, category, onDone }: Props) {
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(
    mode === "create" ? createCategory : updateCategory,
    {},
  );

  // After a successful save, tell the parent (closes the edit form).
  useEffect(() => {
    if (state.ok) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  // A new key after each save remounts the create form, clearing every field.
  const formKey = mode === "create" ? (state.savedAt ?? 0) : category.id;

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <Fields mode={mode} category={category} values={state.error ? state.values : undefined} />

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : mode === "create" ? "Add category" : "Save changes"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-background"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Fields({
  mode,
  category,
  values,
}: {
  mode: "create" | "edit";
  category?: Category;
  values?: CategoryValues;
}) {
  const [color, setColor] = useState<string>(values?.color || category?.color || PALETTE[0].hex);
  const idPrefix = mode === "edit" && category ? `cat-${category.id}` : "cat-new";

  return (
    <>
      {mode === "edit" && category && <input type="hidden" name="id" value={category.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Name
          <input
            name="name"
            required
            maxLength={40}
            defaultValue={values?.name ?? category?.name}
            placeholder="e.g. Studying"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          <span>
            Description <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            name="description"
            maxLength={200}
            defaultValue={values?.description ?? category?.description ?? ""}
            placeholder="e.g. Coursework and exam prep"
            className={inputClass}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Color</legend>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => {
            const id = `${idPrefix}-${c.name}`;
            const selected = color === c.hex;
            return (
              <div key={c.hex}>
                <input
                  type="radio"
                  id={id}
                  name="color"
                  value={c.hex}
                  checked={selected}
                  onChange={() => setColor(c.hex)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id}
                  title={c.name}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-accent"
                  style={{ backgroundColor: c.hex }}
                >
                  <span className="sr-only">{c.name}</span>
                  {selected && (
                    <svg viewBox="0 0 20 20" className="size-4 fill-white" aria-hidden>
                      <path d="M7.6 13.2 4.4 10l-1.2 1.2 4.4 4.4 9.2-9.2-1.2-1.2z" />
                    </svg>
                  )}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}
