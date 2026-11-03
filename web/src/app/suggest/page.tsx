import type { Metadata } from "next";
import { getRepo } from "@/db";
import { requireUser } from "@/lib/session";
import { submitSuggestion } from "./actions";

export const metadata: Metadata = { title: "Đề xuất câu mới" };
export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent";

export default async function SuggestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const user = await requireUser();
  const { error, sent } = await searchParams;
  const categories = await (await getRepo()).listCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Đề xuất câu mới</h1>
      <p className="text-sm text-muted">
        {user.role === "admin"
          ? "Với quyền admin, câu bạn thêm sẽ được đăng ngay."
          : "Câu đề xuất sẽ chờ admin duyệt trước khi xuất hiện trong kho."}
      </p>
      {sent && (
        <p role="status" className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
          {sent === "published" ? "Đã đăng câu mới." : "Đã gửi, đang chờ admin duyệt."}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">{error}</p>
      )}
      <form action={submitSuggestion} className="space-y-4">
        <label className="block space-y-1 text-sm font-medium">
          Nhóm tình huống
          <select name="categoryId" required className={fieldClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.number}. {c.title}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          Tiêu đề ngắn (không bắt buộc)
          <input name="title" maxLength={120} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          Ngôn ngữ gốc
          <select name="sourceLang" className={fieldClass} defaultValue="vi">
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          Tiếng Việt
          <textarea name="vi" rows={3} maxLength={2000} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          English
          <textarea name="en" rows={3} maxLength={2000} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          中文
          <textarea name="zh" rows={3} maxLength={2000} lang="zh-Hans" className={fieldClass} />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          Ghi chú ngữ cảnh (không bắt buộc)
          <input name="note" maxLength={500} className={fieldClass} />
        </label>
        <button type="submit" className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white">
          Gửi đề xuất
        </button>
      </form>
    </div>
  );
}
