import type { ActivityEntry, ActivityType } from "./types";

export const MAX_ACTIVITY = 50;

const TYPES: ActivityType[] = ["test", "learn"];

export function normalizeActivity(value: unknown): ActivityEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ActivityEntry => {
      if (!item || typeof item !== "object") return false;
      const entry = item as { type?: unknown; at?: unknown };
      return (
        TYPES.includes(entry.type as ActivityType) &&
        typeof entry.at === "number" &&
        Number.isFinite(entry.at)
      );
    })
    .map((entry) => ({ type: entry.type, at: entry.at }));
}

export function sortActivityDesc(entries: readonly ActivityEntry[]): ActivityEntry[] {
  return [...entries].sort((a, b) => b.at - a.at);
}

export function appendActivity(existing: unknown, entry: ActivityEntry): ActivityEntry[] {
  const sorted = sortActivityDesc(normalizeActivity(existing));
  return [entry, ...sorted].slice(0, MAX_ACTIVITY);
}
