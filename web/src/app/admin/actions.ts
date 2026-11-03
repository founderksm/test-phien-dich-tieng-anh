"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/db";
import { requireAdmin } from "@/lib/session";
import { editSchema, formToObject, moderateSchema } from "@/lib/validation";

export async function moderatePhrase(form: FormData) {
  const admin = await requireAdmin();
  const parsed = moderateSchema.safeParse(formToObject(form));
  if (!parsed.success) return;
  await (await getRepo()).moderate(parsed.data.id, parsed.data.decision, admin.email);
  revalidatePath("/admin");
}

export async function savePhrase(form: FormData) {
  const admin = await requireAdmin();
  const parsed = editSchema.safeParse(formToObject(form));
  if (!parsed.success) return;
  const { id, vi, en, zh, confirmed } = parsed.data;
  await (await getRepo()).updatePhrase(
    id,
    { vi, en, zh, ...(confirmed ? { needsReview: false } : {}) },
    admin.email,
  );
  revalidatePath("/admin");
}
