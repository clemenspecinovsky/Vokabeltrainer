import { promises as fs } from "node:fs";
import path from "node:path";
import type { StoredUser, VocabEntry, VocabPair } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
  return JSON.parse(raw) as T;
}

export async function loadVocabulary(): Promise<VocabEntry[]> {
  const pairs = await readJson<VocabPair[]>("vocabulary.json");
  if (!Array.isArray(pairs)) return [];
  return pairs
    .filter((pair) => Array.isArray(pair) && pair.length >= 2)
    .map((pair, index) => ({
      id: `w${index}`,
      de: String(pair[0]).trim(),
      en: String(pair[1]).trim(),
    }))
    .filter((entry) => entry.de.length > 0 && entry.en.length > 0);
}

export async function loadUsers(): Promise<StoredUser[]> {
  const data = await readJson<{ users: StoredUser[] }>("users.json");
  return Array.isArray(data?.users) ? data.users : [];
}

export async function saveUsers(users: StoredUser[]): Promise<void> {
  const file = path.join(DATA_DIR, "users.json");
  await fs.writeFile(file, `${JSON.stringify({ users }, null, 2)}\n`, "utf8");
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const users = await loadUsers();
  return users.find((entry) => entry.id === id) ?? null;
}
