import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseArchive } from "./parse";

const archivePath = resolve(__dirname, "../../../../translations/tong-hop-phien-dich-2026.md");
const archive = parseArchive(readFileSync(archivePath, "utf8"));

describe("parseArchive (file thực tế)", () => {
  it("đọc đủ số nhóm, câu và thuật ngữ", () => {
    expect(archive.categories).toHaveLength(17);
    expect(archive.phrases).toHaveLength(92);
    expect(archive.terms).toHaveLength(26);
  });

  it("không có cảnh báo định dạng", () => {
    expect(archive.warnings).toEqual([]);
  });

  it("giữ nguyên mục 2.2 có ngôn ngữ gốc là tiếng Trung", () => {
    const phrase = archive.phrases.find((p) => p.code === "2.2");
    expect(phrase).toMatchObject({
      sourceLang: "zh",
      zh: "我们是一家内销公司",
      vi: "Chúng tôi là một công ty bán hàng nội địa.",
      en: "We are a domestic sales company.",
    });
  });

  it("đọc câu ngắn dạng bullet ở nhóm 15", () => {
    const short = archive.phrases.filter((p) => p.categoryNumber === 15);
    expect(short).toHaveLength(8);
    expect(short[0]).toMatchObject({ vi: "Hàng có chưa bạn?", code: null, title: null });
  });

  it("mẫu thương lượng nhóm 17 chưa có bản VI", () => {
    const negotiation = archive.phrases.filter((p) => p.categoryNumber === 17);
    expect(negotiation).toHaveLength(5);
    expect(negotiation.every((p) => p.vi === null && p.sourceLang === "en")).toBe(true);
  });

  it("mọi câu đều có EN và ZH", () => {
    expect(archive.phrases.filter((p) => !p.en || !p.zh)).toEqual([]);
  });

  it("giữ nguyên mã vải, số lượng và đơn giá", () => {
    const text = JSON.stringify(archive.phrases);
    for (const token of ["9236#", "FT2239", "7030", "1.200", "42"]) {
      expect(text).toContain(token);
    }
  });

  it("bảng thuật ngữ đủ 3 cột, không dòng trống", () => {
    for (const term of archive.terms) {
      expect(term.vi && term.en && term.zh).toBeTruthy();
    }
    expect(archive.terms.at(-1)).toMatchObject({ vi: "WeChat", zh: "微信" });
  });
});

describe("parseArchive (trường hợp biên)", () => {
  it("cảnh báo khi thiếu bản dịch", () => {
    const result = parseArchive("## 1. Nhóm\n\n### 1.1 Câu\n**VI:** Xin chào\n");
    expect(result.warnings.some((w) => w.includes("thiếu EN hoặc ZH"))).toBe(true);
  });

  it("cảnh báo khi trường bị lặp", () => {
    const result = parseArchive(
      "## 1. Nhóm\n\n### 1.1 Câu\n**VI:** A\n\n**VI:** B\n\n**EN:** C\n\n**ZH:** D\n",
    );
    expect(result.warnings.some((w) => w.includes("bị lặp"))).toBe(true);
  });

  it("nối các dòng tiếp theo vào cùng một trường", () => {
    const result = parseArchive(
      "## 1. Nhóm\n\n### 1.1 Câu\n**VI:** Dòng một\ndòng hai\n\n**EN:** E\n\n**ZH:** Z\n",
    );
    expect(result.phrases[0].vi).toBe("Dòng một\ndòng hai");
  });
});
