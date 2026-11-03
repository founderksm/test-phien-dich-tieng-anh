import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";
import type { Db } from "./types";

const globalForDb = globalThis as unknown as { __db?: Promise<Db> };

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url });
    return drizzleNeon(pool, { schema }) as unknown as Db;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL chưa được cấu hình");
  }

  const [{ PGlite }, { drizzle }, { createLocalDb }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("./local"),
  ]);
  return createLocalDb(PGlite, drizzle);
}

export function getDb(): Promise<Db> {
  globalForDb.__db ??= connect();
  return globalForDb.__db;
}
