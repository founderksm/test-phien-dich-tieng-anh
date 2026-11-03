import { getDb } from "./client";
import { createRepository, type Repository } from "./repository";

export async function getRepo(): Promise<Repository> {
  return createRepository(await getDb());
}
