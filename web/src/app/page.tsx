import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { getRepo } from "@/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireUser();
  const categories = await (await getRepo()).listCategories();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Tra cứu câu mẫu</h1>
        <SearchBox autoFocus />
      </section>
      <section aria-labelledby="cats">
        <h2 id="cats" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Nhóm tình huống
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/c/${c.number}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-3 hover:border-accent"
              >
                <span>
                  <span className="mr-1.5 text-muted">{c.number}.</span>
                  {c.title}
                </span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">{c.phraseCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
