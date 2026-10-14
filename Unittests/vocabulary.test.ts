import { describe, expect, it } from "vitest";
import { findUserById, loadUsers, loadVocabulary } from "../src/lib/vocabulary";

describe("loadVocabulary", () => {
  it("returns non-empty entries with ids and both languages", async () => {
    const entries = await loadVocabulary();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.id).toMatch(/^w\d+$/);
      expect(entry.de.length).toBeGreaterThan(0);
      expect(entry.en.length).toBeGreaterThan(0);
    }
  });
});

describe("loadUsers", () => {
  it("returns an array of users", async () => {
    const users = await loadUsers();
    expect(Array.isArray(users)).toBe(true);
    for (const user of users) {
      expect(typeof user.id).toBe("string");
      expect(user.id.length).toBeGreaterThan(0);
      expect(typeof user.displayName).toBe("string");
    }
  });
});

describe("findUserById", () => {
  it("finds a known user", async () => {
    const users = await loadUsers();
    const [first] = users;
    if (!first) throw new Error("no users to test with");

    const found = await findUserById(first.id);
    expect(found?.id).toBe(first.id);
  });

  it("returns null for an unknown id", async () => {
    expect(await findUserById("does-not-exist")).toBeNull();
  });
});
