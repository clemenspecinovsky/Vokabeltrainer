import { describe, expect, it } from "vitest";
import { MAX_ACTIVITY, appendActivity, normalizeActivity, sortActivityDesc } from "../src/lib/activity";
import type { ActivityEntry } from "../src/lib/types";

describe("normalizeActivity", () => {
  it("keeps valid entries", () => {
    expect(normalizeActivity([{ type: "test", at: 5 }])).toEqual([{ type: "test", at: 5 }]);
  });

  it("drops non-arrays and malformed entries", () => {
    expect(normalizeActivity(undefined)).toEqual([]);
    expect(normalizeActivity("nope")).toEqual([]);
    expect(
      normalizeActivity([
        null,
        { type: "dance", at: 1 },
        { type: "test", at: "soon" },
        { type: "test", at: Number.NaN },
        { type: "learn", at: 2 },
      ]),
    ).toEqual([{ type: "learn", at: 2 }]);
  });
});

describe("sortActivityDesc", () => {
  it("orders newest first without mutating the input", () => {
    const entries: ActivityEntry[] = [
      { type: "test", at: 10 },
      { type: "learn", at: 30 },
      { type: "test", at: 20 },
    ];
    expect(sortActivityDesc(entries).map((entry) => entry.at)).toEqual([30, 20, 10]);
    expect(entries.map((entry) => entry.at)).toEqual([10, 30, 20]);
  });
});

describe("appendActivity", () => {
  it("prepends the new entry", () => {
    const history = appendActivity([{ type: "learn", at: 10 }], { type: "test", at: 20 });
    expect(history).toEqual([
      { type: "test", at: 20 },
      { type: "learn", at: 10 },
    ]);
  });

  it("starts a fresh list when nothing is stored", () => {
    expect(appendActivity(undefined, { type: "learn", at: 1 })).toEqual([{ type: "learn", at: 1 }]);
  });

  it("sorts existing entries before prepending", () => {
    const existing = [
      { type: "test", at: 5 },
      { type: "learn", at: 30 },
    ];
    const history = appendActivity(existing, { type: "test", at: 40 });
    expect(history.map((entry) => entry.at)).toEqual([40, 30, 5]);
  });

  it("caps the history length", () => {
    const existing = Array.from({ length: MAX_ACTIVITY + 10 }, (_, index) => ({
      type: "test" as const,
      at: index,
    }));
    const history = appendActivity(existing, { type: "learn", at: 9_999 });
    expect(history).toHaveLength(MAX_ACTIVITY);
    expect(history[0]).toEqual({ type: "learn", at: 9_999 });
  });
});
