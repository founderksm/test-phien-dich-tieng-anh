import { describe, expect, it } from "vitest";
import { editSchema, moderateSchema, suggestionSchema } from "./validation";

describe("suggestionSchema", () => {
  it("chấp nhận câu hợp lệ và cắt khoảng trắng", () => {
    const r = suggestionSchema.parse({ categoryId: "4", sourceLang: "vi", vi: "  Xin chào  ", en: "", zh: "" });
    expect(r).toMatchObject({ categoryId: 4, vi: "Xin chào", en: null, zh: null });
  });

  it("bắt buộc có nội dung ở ngôn ngữ gốc", () => {
    expect(suggestionSchema.safeParse({ categoryId: "4", sourceLang: "zh", vi: "Xin chào" }).success).toBe(false);
  });

  it("từ chối ngôn ngữ lạ, nhóm sai và văn bản quá dài", () => {
    expect(suggestionSchema.safeParse({ categoryId: "4", sourceLang: "fr", vi: "a" }).success).toBe(false);
    expect(suggestionSchema.safeParse({ categoryId: "abc", sourceLang: "vi", vi: "a" }).success).toBe(false);
    expect(suggestionSchema.safeParse({ categoryId: "4", sourceLang: "vi", vi: "a".repeat(2001) }).success).toBe(false);
  });
});

describe("moderateSchema / editSchema", () => {
  it("chỉ nhận quyết định hợp lệ", () => {
    expect(moderateSchema.safeParse({ id: "3", decision: "approved" }).success).toBe(true);
    expect(moderateSchema.safeParse({ id: "3", decision: "deleted" }).success).toBe(false);
  });

  it("checkbox xác nhận chuyển thành boolean", () => {
    expect(editSchema.parse({ id: "1", confirmed: "on" }).confirmed).toBe(true);
    expect(editSchema.parse({ id: "1" }).confirmed).toBe(false);
  });
});
