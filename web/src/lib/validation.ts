import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .max(max, `Tối đa ${max} ký tự`)
    .transform((v) => v.trim())
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const suggestionSchema = z
  .object({
    categoryId: z.coerce.number().int().positive(),
    sourceLang: z.enum(["vi", "en", "zh"]),
    title: optionalText(120),
    vi: optionalText(2000),
    en: optionalText(2000),
    zh: optionalText(2000),
    note: optionalText(500),
  })
  .refine((v) => Boolean(v[v.sourceLang]), {
    message: "Cần nhập nội dung ở ngôn ngữ gốc đã chọn",
    path: ["sourceLang"],
  });

export const editSchema = z.object({
  id: z.coerce.number().int().positive(),
  vi: optionalText(2000),
  en: optionalText(2000),
  zh: optionalText(2000),
  confirmed: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export const moderateSchema = z.object({
  id: z.coerce.number().int().positive(),
  decision: z.enum(["approved", "rejected"]),
});

export function formToObject(form: FormData): Record<string, FormDataEntryValue> {
  const out: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("$ACTION")) out[key] = value;
  }
  return out;
}
