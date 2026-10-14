import { describe, expect, it } from "vitest";
import { AVATARS, getAvatar, isValidAvatar } from "../src/lib/avatars";

describe("AVATARS", () => {
  it("has ten avatars with unique ids", () => {
    expect(AVATARS).toHaveLength(10);
    const ids = AVATARS.map((avatar) => avatar.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("describes every avatar fully", () => {
    for (const avatar of AVATARS) {
      expect(avatar.id).toMatch(/^manga-\d+$/);
      expect(avatar.name.length).toBeGreaterThan(0);
      expect(["girl", "boy"]).toContain(avatar.gender);
      expect(avatar.hairBack.length).toBeGreaterThan(0);
      expect(avatar.hairFront.length).toBeGreaterThan(0);
    }
  });
});

describe("getAvatar", () => {
  it("finds known avatars", () => {
    expect(getAvatar("manga-1")?.id).toBe("manga-1");
    expect(getAvatar("manga-10")?.id).toBe("manga-10");
  });

  it("returns null for unknown or empty ids", () => {
    expect(getAvatar("nope")).toBeNull();
    expect(getAvatar("")).toBeNull();
    expect(getAvatar(null)).toBeNull();
    expect(getAvatar(undefined)).toBeNull();
  });
});

describe("isValidAvatar", () => {
  it("validates ids", () => {
    expect(isValidAvatar("manga-1")).toBe(true);
    expect(isValidAvatar("manga-10")).toBe(true);
    expect(isValidAvatar("manga-11")).toBe(false);
    expect(isValidAvatar("")).toBe(false);
  });
});
