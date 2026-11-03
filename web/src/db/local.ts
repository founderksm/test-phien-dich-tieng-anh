import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parseArchive } from "@/lib/archive/parse";
import { seedDatabase } from "./seed";
import * as schema from "./schema";
import type { Db } from "./types";

const root = process.cwd();

export async function createLocalDb(
  PGlite: typeof import("@electric-sql/pglite").PGlite,
  drizzle: typeof import("drizzle-orm/pglite").drizzle,
): Promise<Db> {
  const client = new PGlite(process.env.PGLITE_DIR ?? resolve(root, ".pglite"));
  await client.waitReady;

  const exists = await client.query<{ n: number }>(
    "select count(*)::int as n from information_schema.tables where table_name = 'phrases'",
  );
  if (exists.rows[0].n === 0) {
    const dir = resolve(root, "drizzle");
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      for (const statement of readFileSync(resolve(dir, file), "utf8").split("--> statement-breakpoint")) {
        if (statement.trim()) await client.exec(statement);
      }
    }
  }

  const db = drizzle(client, { schema }) as unknown as Db;
  const archivePath = resolve(root, "../translations/tong-hop-phien-dich-2026.md");
  await seedDatabase(db, parseArchive(readFileSync(archivePath, "utf8")));
  return db;
}
