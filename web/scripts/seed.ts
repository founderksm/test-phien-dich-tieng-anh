import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { parseArchive } from "@/lib/archive/parse";
import { seedDatabase } from "@/db/seed";
import * as schema from "@/db/schema";
import type { Db } from "@/db/types";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");

  const archive = parseArchive(
    readFileSync(resolve(process.cwd(), "../translations/tong-hop-phien-dich-2026.md"), "utf8"),
  );
  if (archive.warnings.length) {
    throw new Error(`File markdown có cảnh báo định dạng:\n${archive.warnings.join("\n")}`);
  }

  const pool = new Pool({ connectionString: url });
  try {
    const db = drizzle(pool, { schema }) as unknown as Db;
    const result = await seedDatabase(db, archive);
    console.log(
      result.seeded
        ? `Đã nạp ${result.categories} nhóm, ${result.phrases} câu, ${result.terms} thuật ngữ.`
        : "Cơ sở dữ liệu đã có dữ liệu, bỏ qua (không ghi đè).",
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
