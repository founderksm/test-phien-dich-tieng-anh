import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import type { Db } from "./types";

const migrationsDir = resolve(__dirname, "../../drizzle");

export async function applyMigrations(client: PGlite) {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(resolve(migrationsDir, file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) await client.exec(statement);
    }
  }
}

export async function createTestDb(dataDir?: string): Promise<{ db: Db; client: PGlite }> {
  const client = new PGlite(dataDir);
  await client.waitReady;
  const tables = await client.query<{ n: number }>(
    "select count(*)::int as n from information_schema.tables where table_name = 'phrases'",
  );
  if (tables.rows[0].n === 0) await applyMigrations(client);
  const db = drizzle(client, { schema }) as unknown as Db;
  return { db, client };
}
