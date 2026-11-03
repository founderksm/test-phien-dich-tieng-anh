import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  title: text("title").notNull(),
});

export const phrases = pgTable(
  "phrases",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    code: text("code"),
    title: text("title"),
    vi: text("vi"),
    en: text("en"),
    zh: text("zh"),
    sourceLang: text("source_lang").notNull().default("vi"),
    status: text("status").notNull().default("approved"),
    needsReview: boolean("needs_review").notNull().default(false),
    note: text("note"),
    searchText: text("search_text").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("phrases_category_idx").on(table.categoryId, table.sortOrder),
    index("phrases_status_idx").on(table.status),
  ],
);

export const glossaryTerms = pgTable("glossary_terms", {
  id: serial("id").primaryKey(),
  vi: text("vi").notNull(),
  en: text("en").notNull(),
  zh: text("zh").notNull(),
  abbreviation: text("abbreviation"),
  scope: text("scope").notNull().default("all"),
  searchText: text("search_text").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const phraseRevisions = pgTable(
  "phrase_revisions",
  {
    id: serial("id").primaryKey(),
    phraseId: integer("phrase_id")
      .notNull()
      .references(() => phrases.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    actorEmail: text("actor_email").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("phrase_revisions_phrase_idx").on(table.phraseId)],
);

export type Category = typeof categories.$inferSelect;
export type Phrase = typeof phrases.$inferSelect;
export type NewPhrase = typeof phrases.$inferInsert;
export type GlossaryTerm = typeof glossaryTerms.$inferSelect;
export type PhraseStatus = "pending" | "approved" | "rejected";
