import type { Metadata } from "next";
import { getRepo } from "@/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Thuật ngữ" };
export const dynamic = "force-dynamic";

export default async function GlossaryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await requireUser();
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.slice(0, 120).trim() ?? "";
  const terms = await (await getRepo()).listGlossary(query);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Thuật ngữ thương mại</h1>
      <form role="search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={120}
          placeholder="Lọc thuật ngữ…"
          aria-label="Lọc thuật ngữ"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
        />
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">Lọc</button>
      </form>
      <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
        Quy ước thành phần sợi trong thông số kỹ thuật: Nylon = N, Polyester = P, Spandex = SP.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[32rem] text-left text-[15px]">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2 font-semibold">Tiếng Việt</th>
              <th className="px-4 py-2 font-semibold">English</th>
              <th className="px-4 py-2 font-semibold">中文</th>
              <th className="px-4 py-2 font-semibold">Viết tắt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {terms.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2 font-medium">{t.vi}</td>
                <td className="px-4 py-2">{t.en}</td>
                <td className="px-4 py-2" lang="zh-Hans">{t.zh}</td>
                <td className="px-4 py-2">{t.abbreviation ?? ""}</td>
              </tr>
            ))}
            {terms.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">Không có thuật ngữ phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
