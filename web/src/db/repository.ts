import { and, asc, count, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { buildSearchText, escapeLike, foldText } from "@/lib/archive/fold";
import {
  categories,
  glossaryTerms,
  phraseRevisions,
  phrases,
  type Phrase,
  type PhraseStatus,
} from "./schema";
import type { Db } from "./types";

export interface PhraseInput {
  categoryId: number;
  title?: string | null;
  vi?: string | null;
  en?: string | null;
  zh?: string | null;
  sourceLang: "vi" | "en" | "zh";
  note?: string | null;
}

export type PhrasePatch = Partial<Pick<PhraseInput, "title" | "vi" | "en" | "zh" | "note">> & {
  categoryId?: number;
  needsReview?: boolean;
};

export type PhraseWithCategory = Phrase & { categoryNumber: number; categoryTitle: string };

const MAX_SEARCH_TOKENS = 6;
const MAX_SEARCH_RESULTS = 60;

function tokenize(query: string): string[] {
  return foldText(query).split(" ").filter(Boolean).slice(0, MAX_SEARCH_TOKENS);
}

function snapshot(phrase: Phrase) {
  const { id, categoryId, code, title, vi, en, zh, status, needsReview, note } = phrase;
  return { id, categoryId, code, title, vi, en, zh, status, needsReview, note };
}

export function createRepository(db: Db) {
  const withCategory = () =>
    db
      .select({
        phrase: phrases,
        categoryNumber: categories.number,
        categoryTitle: categories.title,
      })
      .from(phrases)
      .innerJoin(categories, eq(phrases.categoryId, categories.id));

  const flatten = (
    rows: Array<{ phrase: Phrase; categoryNumber: number; categoryTitle: string }>,
  ): PhraseWithCategory[] =>
    rows.map((r) => ({ ...r.phrase, categoryNumber: r.categoryNumber, categoryTitle: r.categoryTitle }));

  return {
    async listCategories() {
      const rows = await db
        .select({
          id: categories.id,
          number: categories.number,
          title: categories.title,
          phraseCount: count(phrases.id),
        })
        .from(categories)
        .leftJoin(phrases, and(eq(phrases.categoryId, categories.id), eq(phrases.status, "approved")))
        .groupBy(categories.id)
        .orderBy(asc(categories.number));
      return rows;
    },

    async getCategoryByNumber(number: number) {
      const [row] = await db.select().from(categories).where(eq(categories.number, number));
      return row ?? null;
    },

    async listPhrasesByCategory(categoryNumber: number) {
      const rows = await withCategory()
        .where(and(eq(categories.number, categoryNumber), eq(phrases.status, "approved")))
        .orderBy(asc(phrases.sortOrder), asc(phrases.id));
      return flatten(rows);
    },

    async searchPhrases(query: string) {
      const tokens = tokenize(query);
      if (tokens.length === 0) return [];
      const conditions = tokens.map((t) => ilike(phrases.searchText, `%${escapeLike(t)}%`));
      const rows = await withCategory()
        .where(and(eq(phrases.status, "approved"), ...conditions))
        .orderBy(asc(categories.number), asc(phrases.sortOrder))
        .limit(MAX_SEARCH_RESULTS);
      return flatten(rows);
    },

    async listGlossary(query?: string) {
      const tokens = query ? tokenize(query) : [];
      const conditions = tokens.map((t) => ilike(glossaryTerms.searchText, `%${escapeLike(t)}%`));
      return db
        .select()
        .from(glossaryTerms)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(glossaryTerms.sortOrder));
    },

    async createSuggestion(input: PhraseInput, actorEmail: string, autoApprove: boolean) {
      const status: PhraseStatus = autoApprove ? "approved" : "pending";
      return db.transaction(async (tx) => {
        const [{ next }] = await tx
          .select({ next: sql<number>`coalesce(max(${phrases.sortOrder}), 0) + 1` })
          .from(phrases);
        const [created] = await tx
          .insert(phrases)
          .values({
            categoryId: input.categoryId,
            title: input.title ?? null,
            vi: input.vi ?? null,
            en: input.en ?? null,
            zh: input.zh ?? null,
            sourceLang: input.sourceLang,
            note: input.note ?? null,
            status,
            needsReview: false,
            searchText: buildSearchText(input.title, input.vi, input.en, input.zh),
            sortOrder: Number(next),
            createdBy: actorEmail,
          })
          .returning();
        await tx.insert(phraseRevisions).values({
          phraseId: created.id,
          action: autoApprove ? "create" : "suggest",
          actorEmail,
          before: null,
          after: snapshot(created),
        });
        return created;
      });
    },

    async listPending() {
      const rows = await withCategory()
        .where(eq(phrases.status, "pending"))
        .orderBy(desc(phrases.createdAt));
      return flatten(rows);
    },

    async listNeedsReview() {
      const rows = await withCategory()
        .where(and(eq(phrases.needsReview, true), eq(phrases.status, "approved")))
        .orderBy(asc(phrases.sortOrder));
      return flatten(rows);
    },

    async moderate(id: number, decision: "approved" | "rejected", actorEmail: string) {
      return db.transaction(async (tx) => {
        const [before] = await tx.select().from(phrases).where(eq(phrases.id, id));
        if (!before) return null;
        if (before.status !== "pending") return before;
        const [after] = await tx
          .update(phrases)
          .set({ status: decision, updatedAt: new Date() })
          .where(eq(phrases.id, id))
          .returning();
        await tx.insert(phraseRevisions).values({
          phraseId: id,
          action: decision === "approved" ? "approve" : "reject",
          actorEmail,
          before: snapshot(before),
          after: snapshot(after),
        });
        return after;
      });
    },

    async updatePhrase(id: number, patch: PhrasePatch, actorEmail: string) {
      return db.transaction(async (tx) => {
        const [before] = await tx.select().from(phrases).where(eq(phrases.id, id));
        if (!before) return null;
        const merged = {
          categoryId: patch.categoryId ?? before.categoryId,
          title: patch.title === undefined ? before.title : patch.title,
          vi: patch.vi === undefined ? before.vi : patch.vi,
          en: patch.en === undefined ? before.en : patch.en,
          zh: patch.zh === undefined ? before.zh : patch.zh,
          note: patch.note === undefined ? before.note : patch.note,
          needsReview: patch.needsReview ?? before.needsReview,
        };
        const [after] = await tx
          .update(phrases)
          .set({
            ...merged,
            searchText: buildSearchText(merged.title, merged.vi, merged.en, merged.zh),
            updatedAt: new Date(),
          })
          .where(eq(phrases.id, id))
          .returning();
        await tx.insert(phraseRevisions).values({
          phraseId: id,
          action: "update",
          actorEmail,
          before: snapshot(before),
          after: snapshot(after),
        });
        return after;
      });
    },

    async listRevisions(phraseId: number) {
      return db
        .select()
        .from(phraseRevisions)
        .where(eq(phraseRevisions.phraseId, phraseId))
        .orderBy(desc(phraseRevisions.createdAt), desc(phraseRevisions.id));
    },

    async countByStatus() {
      const rows = await db
        .select({ status: phrases.status, value: count() })
        .from(phrases)
        .where(inArray(phrases.status, ["pending", "approved", "rejected"]))
        .groupBy(phrases.status);
      return Object.fromEntries(rows.map((r) => [r.status, r.value])) as Record<string, number>;
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
