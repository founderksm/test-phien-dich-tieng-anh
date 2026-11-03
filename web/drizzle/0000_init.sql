CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "categories_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "glossary_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"vi" text NOT NULL,
	"en" text NOT NULL,
	"zh" text NOT NULL,
	"abbreviation" text,
	"scope" text DEFAULT 'all' NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phrase_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"phrase_id" integer NOT NULL,
	"action" text NOT NULL,
	"actor_email" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phrases" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"code" text,
	"title" text,
	"vi" text,
	"en" text,
	"zh" text,
	"source_lang" text DEFAULT 'vi' NOT NULL,
	"status" text DEFAULT 'approved' NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"note" text,
	"search_text" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phrase_revisions" ADD CONSTRAINT "phrase_revisions_phrase_id_phrases_id_fk" FOREIGN KEY ("phrase_id") REFERENCES "public"."phrases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phrases" ADD CONSTRAINT "phrases_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "phrase_revisions_phrase_idx" ON "phrase_revisions" USING btree ("phrase_id");--> statement-breakpoint
CREATE INDEX "phrases_category_idx" ON "phrases" USING btree ("category_id","sort_order");--> statement-breakpoint
CREATE INDEX "phrases_status_idx" ON "phrases" USING btree ("status");