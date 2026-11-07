/** Temporary page body until a milestone's feature is built. */
export function Placeholder({
  title,
  milestone,
  items,
}: {
  title: string;
  milestone: string;
  items: string[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium">{title}</h1>
      <div className="rounded-xl border border-dashed border-border bg-surface p-6">
        <p className="text-sm font-medium text-muted">Coming in {milestone}</p>
        <ul className="mt-3 list-disc pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
