import type { Metadata } from "next";
import { PhraseCard } from "@/components/PhraseCard";
import { SearchBox } from "@/components/SearchBox";
import { getRepo } from "@/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Kết quả tìm kiếm" };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await requireUser();
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.slice(0, 120).trim() ?? "";
  const repo = await getRepo();
  const [phrases, terms] = query
    ? await Promise.all([repo.searchPhrases(query), repo.listGlossary(query)])
    : [[], []];

  return (
    <div className="space-y-6">
      <SearchBox defaultValue={query} />
      {!query && <p className="text-muted">Nhập từ khóa để tìm.</p>}
      {query && phrases.length === 0 && terms.length === 0 && (
        <p className="text-muted">Không tìm thấy kết quả cho “{query}”.</p>
      )}
      {terms.length > 0 && (
        <section aria-labelledby="terms">
          <h2 id="terms" className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Thuật ngữ ({terms.length})
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {terms.map((t) => (
              <li key={t.id} className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2.5 text-[15px]">
                <span className="font-medium">{t.vi}</span>
                <span>{t.en}</span>
                <span lang="zh-Hans">{t.zh}</span>
                {t.abbreviation && (
                  <span className="rounded bg-accent-soft px-1.5 text-xs leading-6 text-accent">{t.abbreviation}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {phrases.length > 0 && (
        <section aria-labelledby="phrases" className="space-y-3">
          <h2 id="phrases" className="text-sm font-semibold uppercase tracking-wide text-muted">
            Câu mẫu ({phrases.length})
          </h2>
          {phrases.map((p) => (
            <PhraseCard key={p.id} phrase={p} showCategory />
          ))}
        </section>
      )}
    </div>
  );
}
