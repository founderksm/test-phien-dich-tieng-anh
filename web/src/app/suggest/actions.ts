"use server";

import { redirect } from "next/navigation";
import { getRepo } from "@/db";
import { requireUser } from "@/lib/session";
import { formToObject, suggestionSchema } from "@/lib/validation";

export async function submitSuggestion(form: FormData) {
  const user = await requireUser();
  const parsed = suggestionSchema.safeParse(formToObject(form));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    redirect(`/suggest?error=${encodeURIComponent(message)}`);
  }
  const repo = await getRepo();
  const category = (await repo.listCategories()).find((c) => c.id === parsed.data.categoryId);
  if (!category) redirect(`/suggest?error=${encodeURIComponent("Nhóm không tồn tại")}`);

  await repo.createSuggestion(parsed.data, user.email, user.role === "admin");
  redirect(`/suggest?sent=${user.role === "admin" ? "published" : "pending"}`);
}
