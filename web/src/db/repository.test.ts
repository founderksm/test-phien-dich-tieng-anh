import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { parseArchive } from "@/lib/archive/parse";
import { createRepository, type Repository } from "./repository";
import { seedDatabase } from "./seed";
import { createTestDb } from "./test-db";

let repo: Repository;
let seedResult: Awaited<ReturnType<typeof seedDatabase>>;
let secondSeed: Awaited<ReturnType<typeof seedDatabase>>;

beforeAll(async () => {
  const { db } = await createTestDb();
  const archive = parseArchive(
    readFileSync(resolve(__dirname, "../../../translations/tong-hop-phien-dich-2026.md"), "utf8"),
  );
  seedResult = await seedDatabase(db, archive);
  secondSeed = await seedDatabase(db, archive);
  repo = createRepository(db);
}, 60_000);

describe("seed", () => {
  it("nạp đủ dữ liệu và không nạp lại lần hai", () => {
    expect(seedResult).toEqual({ seeded: true, categories: 17, phrases: 92, terms: 29 });
    expect(secondSeed.seeded).toBe(false);
  });

  it("gắn cờ cần duyệt cho 5 câu VI do hệ thống bổ sung", async () => {
    const review = await repo.listNeedsReview();
    expect(review).toHaveLength(5);
    expect(review.every((p) => p.categoryNumber === 17 && p.vi)).toBe(true);
  });
});

describe("tìm kiếm", () => {
  it("tìm không dấu ra kết quả có dấu", async () => {
    const results = await repo.searchPhrases("do ben mau");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.categoryNumber === 5)).toBe(true);
  });

  it("tìm theo tiếng Anh và tiếng Trung", async () => {
    expect((await repo.searchPhrases("color fastness")).length).toBeGreaterThan(0);
    expect((await repo.searchPhrases("色牢度")).length).toBeGreaterThan(0);
  });

  it("tìm theo mã vải", async () => {
    const results = await repo.searchPhrases("9236#");
    expect(results.some((p) => p.code === "3.6")).toBe(true);
  });

  it("nhiều từ khóa phải khớp đồng thời", async () => {
    const both = await repo.searchPhrases("alipay hoa don");
    const one = await repo.searchPhrases("alipay");
    expect(both.length).toBeGreaterThan(0);
    expect(both.length).toBeLessThanOrEqual(one.length);
  });

  it("ký tự % và _ được coi là chữ thường, không phải ký tự đại diện", async () => {
    const percent = await repo.searchPhrases("%");
    expect(percent.map((p) => p.code).sort()).toEqual(["1.5", "11.1"]);
    expect(percent.every((p) => `${p.vi}${p.en}${p.zh}`.includes("%"))).toBe(true);
    expect(await repo.searchPhrases("_")).toHaveLength(0);
  });

  it("chuỗi rỗng trả về không kết quả", async () => {
    expect(await repo.searchPhrases("   ")).toEqual([]);
  });
});

describe("thuật ngữ", () => {
  it("có quy ước N / P / SP", async () => {
    const fibers = await repo.listGlossary("nylon");
    expect(fibers[0]).toMatchObject({ en: "Nylon", abbreviation: "N" });
    expect((await repo.listGlossary("spandex"))[0]).toMatchObject({ abbreviation: "SP" });
    expect((await repo.listGlossary("polyester"))[0]).toMatchObject({ abbreviation: "P" });
  });
});

describe("đề xuất và duyệt", () => {
  it("câu đề xuất ở trạng thái chờ duyệt và chưa hiện ở tra cứu", async () => {
    const category = await repo.getCategoryByNumber(4);
    const created = await repo.createSuggestion(
      {
        categoryId: category!.id,
        vi: "Giá này đã gồm thuế chưa?",
        en: "Is tax included in this price?",
        zh: "这个价格含税吗？",
        sourceLang: "vi",
      },
      "nhanvien@example.com",
      false,
    );
    expect(created.status).toBe("pending");
    expect(await repo.searchPhrases("da gom thue chua")).toHaveLength(0);
    expect((await repo.listPending()).map((p) => p.id)).toContain(created.id);
  });

  it("admin duyệt thì câu xuất hiện ở tra cứu và có lịch sử", async () => {
    const [pending] = await repo.listPending();
    const approved = await repo.moderate(pending.id, "approved", "admin@example.com");
    expect(approved?.status).toBe("approved");
    expect((await repo.searchPhrases("da gom thue chua")).length).toBe(1);
    const history = await repo.listRevisions(pending.id);
    expect(history.map((h) => h.action)).toEqual(["approve", "suggest"]);
  });

  it("không duyệt lại câu đã xử lý", async () => {
    const [approved] = await repo.searchPhrases("da gom thue chua");
    const again = await repo.moderate(approved.id, "rejected", "admin@example.com");
    expect(again?.status).toBe("approved");
  });

  it("câu bị từ chối không hiện ở tra cứu", async () => {
    const category = await repo.getCategoryByNumber(4);
    const created = await repo.createSuggestion(
      { categoryId: category!.id, vi: "Câu thử từ chối", en: "Reject me", zh: "拒绝", sourceLang: "vi" },
      "nhanvien@example.com",
      false,
    );
    await repo.moderate(created.id, "rejected", "admin@example.com");
    expect(await repo.searchPhrases("cau thu tu choi")).toHaveLength(0);
  });

  it("sửa câu cập nhật lại chỉ mục tìm kiếm và ghi lịch sử", async () => {
    const [target] = await repo.searchPhrases("da gom thue chua");
    await repo.updatePhrase(target.id, { vi: "Giá này đã bao gồm VAT chưa?" }, "admin@example.com");
    expect(await repo.searchPhrases("da gom thue chua")).toHaveLength(0);
    expect((await repo.searchPhrases("bao gom vat")).length).toBe(1);
    expect((await repo.listRevisions(target.id))[0].action).toBe("update");
  });

  it("admin tạo câu thì duyệt luôn", async () => {
    const category = await repo.getCategoryByNumber(7);
    const created = await repo.createSuggestion(
      { categoryId: category!.id, vi: "Câu admin", en: "Admin phrase", zh: "管理员", sourceLang: "vi" },
      "admin@example.com",
      true,
    );
    expect(created.status).toBe("approved");
  });
});
