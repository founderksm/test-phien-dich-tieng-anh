import type { Metadata } from "next";
import { getRepo } from "@/db";
import type { PhraseWithCategory } from "@/db/repository";
import { requireAdmin } from "@/lib/session";
import { moderatePhrase, savePhrase } from "./actions";

export const metadata: Metadata = { title: "Duyệt nội dung" };
export const dynamic = "force-dynamic";

const fieldClass = "w-full rounded border border-border bg-background px-2 py-1.5 text-sm";

function EditForm({ phrase }: { phrase: PhraseWithCategory }) {
  return (
    <form action={savePhrase} className="space-y-2">
      <input type="hidden" name="id" value={phrase.id} />
      {(["vi", "en", "zh"] as const).map((lang) => (
        <label key={lang} className="flex items-start gap-2 text-xs font-semibold text-muted">
          <span className="mt-2 w-6">{lang.toUpperCase()}</span>
          <textarea
            name={lang}
            defaultValue={phrase[lang] ?? ""}
            rows={2}
            maxLength={2000}
            lang={lang === "zh" ? "zh-Hans" : lang}
            className={fieldClass}
          />
        </label>
      ))}
      <div className="flex items-center justify-between gap-3">
        {phrase.needsReview ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirmed" /> Đã xác nhận bản dịch
          </label>
        ) : (
          <span />
        )}
        <button type="submit" className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white">Lưu</button>
      </div>
    </form>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const repo = await getRepo();
  const [pending, review, counts] = await Promise.all([
    repo.listPending(),
    repo.listNeedsReview(),
    repo.countByStatus(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Duyệt nội dung</h1>
        <p className="mt-1 text-sm text-muted">
          Đã đăng {counts.approved ?? 0} · Chờ duyệt {counts.pending ?? 0} · Đã từ chối {counts.rejected ?? 0}
        </p>
      </header>

      <section aria-labelledby="pending" className="space-y-3">
        <h2 id="pending" className="text-sm font-semibold uppercase tracking-wide text-muted">
          Đề xuất chờ duyệt ({pending.length})
        </h2>
        {pending.length === 0 && <p className="text-muted">Không có đề xuất nào đang chờ.</p>}
        {pending.map((p) => (
          <article key={p.id} className="space-y-3 rounded-xl border border-border bg-surface p-4" data-testid="pending-item">
            <p className="text-xs text-muted">
              {p.categoryNumber}. {p.categoryTitle} · bởi {p.createdBy}
            </p>
            <EditForm phrase={p} />
            <div className="flex gap-2 border-t border-border pt-3">
              {(["approved", "rejected"] as const).map((decision) => (
                <form key={decision} action={moderatePhrase}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="decision" value={decision} />
                  <button
                    type="submit"
                    className={
                      decision === "approved"
                        ? "rounded bg-accent px-3 py-1.5 text-sm font-medium text-white"
                        : "rounded border border-border px-3 py-1.5 text-sm text-danger"
                    }
                  >
                    {decision === "approved" ? "Duyệt" : "Từ chối"}
                  </button>
                </form>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="review" className="space-y-3">
        <h2 id="review" className="text-sm font-semibold uppercase tracking-wide text-muted">
          Bản dịch chờ xác nhận ({review.length})
        </h2>
        {review.map((p) => (
          <article key={p.id} className="space-y-2 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-muted">{p.categoryNumber}. {p.categoryTitle} · {p.title}</p>
            <EditForm phrase={p} />
          </article>
        ))}
      </section>
    </div>
  );
}
