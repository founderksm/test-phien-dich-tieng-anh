import { count } from "drizzle-orm";
import { buildSearchText } from "@/lib/archive/fold";
import type { ParsedArchive } from "@/lib/archive/parse";
import { categories, glossaryTerms, phrases } from "./schema";
import { FIBER_TERMS, NEGOTIATION_VI_SUPPLEMENT } from "./seed-data";
import type { Db } from "./types";

export interface SeedResult {
  seeded: boolean;
  categories: number;
  phrases: number;
  terms: number;
}

export async function seedDatabase(db: Db, archive: ParsedArchive): Promise<SeedResult> {
  const [existing] = await db.select({ value: count() }).from(categories);
  if (existing.value > 0) {
    return { seeded: false, categories: 0, phrases: 0, terms: 0 };
  }

  return db.transaction(async (tx) => {
    const insertedCategories = await tx
      .insert(categories)
      .values(archive.categories.map((c) => ({ number: c.number, title: c.title })))
      .returning({ id: categories.id, number: categories.number });
    const categoryIdByNumber = new Map(insertedCategories.map((c) => [c.number, c.id]));

    const phraseRows = archive.phrases.map((p) => {
      const supplementVi = !p.vi && p.title ? NEGOTIATION_VI_SUPPLEMENT[p.title] : undefined;
      const vi = p.vi ?? supplementVi ?? null;
      const categoryId = categoryIdByNumber.get(p.categoryNumber);
      if (!categoryId) throw new Error(`Thiếu nhóm ${p.categoryNumber}`);
      return {
        categoryId,
        code: p.code,
        title: p.title,
        vi,
        en: p.en,
        zh: p.zh,
        sourceLang: p.sourceLang,
        status: "approved",
        needsReview: supplementVi !== undefined,
        searchText: buildSearchText(p.title, vi, p.en, p.zh),
        sortOrder: p.sortOrder,
        createdBy: "import",
      };
    });
    await tx.insert(phrases).values(phraseRows);

    const termRows = [
      ...archive.terms.map((t) => ({
        vi: t.vi,
        en: t.en,
        zh: t.zh,
        abbreviation: null,
        scope: "all",
        searchText: buildSearchText(t.vi, t.en, t.zh),
        sortOrder: t.sortOrder,
      })),
      ...FIBER_TERMS.map((t, i) => ({
        ...t,
        searchText: buildSearchText(t.vi, t.en, t.zh, t.abbreviation),
        sortOrder: archive.terms.length + i + 1,
      })),
    ];
    await tx.insert(glossaryTerms).values(termRows);

    return {
      seeded: true,
      categories: insertedCategories.length,
      phrases: phraseRows.length,
      terms: termRows.length,
    };
  });
}
