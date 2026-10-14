import { describe, expect, it } from "vitest";
import { randomInt, shuffle } from "../src/lib/shuffle";

describe("shuffle", () => {
  it("keeps the same elements", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = shuffle(input);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it("returns a new array", () => {
    const input = [1, 2, 3];
    expect(shuffle(input)).not.toBe(input);
  });

  it("handles empty and single-item arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["x"])).toEqual(["x"]);
  });
});

describe("randomInt", () => {
  it("stays within the inclusive range", () => {
    for (let i = 0; i < 2000; i += 1) {
      const value = randomInt(1, 6);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    }
  });

  it("returns the only value for a fixed range", () => {
    expect(randomInt(5, 5)).toBe(5);
  });
});
