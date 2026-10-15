import { describe, expect, it } from "vitest";
import { WordProgress } from "../src/lib/progress";
import type { StoredProgress } from "../src/lib/types";

const IDS = ["w0", "w1", "w2", "w3", "w4", "w5", "w6", "w7"];

function seq(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
}

function emptyProgress(): StoredProgress {
  const direction = () => ({ frontier: 0, knownAbove: [], unknownBelow: [] });
  return { en2de: direction(), de2en: direction() };
}

describe("WordProgress serialization", () => {
  it("starts empty and round-trips", () => {
    const progress = new WordProgress(IDS);
    expect(progress.knownCount("de2en")).toBe(0);
    expect(progress.knownCount("en2de")).toBe(0);
    expect(progress.percent()).toBe(0);
    expect(progress.firstUnknownId()).toBe("w0");

    const stored = progress.toJSON();
    expect(stored).toEqual(emptyProgress());
    const reloaded = new WordProgress(IDS, stored);
    expect(reloaded.learnedCount()).toBe(0);
  });

  it("stores a full direction as a single frontier number", () => {
    const progress = new WordProgress(IDS);
    for (const id of IDS) progress.markKnown("de2en", id);

    const stored = progress.toJSON();
    expect(stored.de2en).toEqual({ frontier: IDS.length, knownAbove: [], unknownBelow: [] });
    expect(stored.en2de).toEqual({ frontier: 0, knownAbove: [], unknownBelow: [] });
  });

  it("keeps the frontier high and lists only the gap for a single missing word", () => {
    const progress = new WordProgress(IDS);
    for (const id of IDS) progress.markKnown("de2en", id);
    progress.markUnknown("de2en", "w1");

    const stored = progress.toJSON();
    expect(stored.de2en.frontier).toBe(IDS.length);
    expect(stored.de2en.knownAbove).toEqual([]);
    expect(stored.de2en.unknownBelow).toEqual(["w1"]);

    const reloaded = new WordProgress(IDS, stored);
    expect(reloaded.isKnown("de2en", "w1")).toBe(false);
    expect(reloaded.isKnown("de2en", "w0")).toBe(true);
    expect(reloaded.isKnown("de2en", "w7")).toBe(true);
    expect(reloaded.knownCount("de2en")).toBe(IDS.length - 1);
  });

  it("uses knownAbove when known words sit above the frontier", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("en2de", "w0");
    progress.markKnown("en2de", "w1");
    progress.markKnown("en2de", "w2");
    progress.markKnown("en2de", "w6");
    progress.markKnown("en2de", "w7");

    const stored = progress.toJSON();
    expect(stored.en2de.frontier).toBe(3);
    expect(stored.en2de.unknownBelow).toEqual([]);
    expect(stored.en2de.knownAbove).toEqual(["w6", "w7"]);

    const reloaded = new WordProgress(IDS, stored);
    expect(reloaded.knownIds("en2de")).toEqual(["w0", "w1", "w2", "w6", "w7"]);
  });

  it("selects the exception-minimising frontier", () => {
    const progress = new WordProgress(IDS);
    for (const id of ["w0", "w1", "w2", "w3", "w4", "w5", "w6"]) progress.markKnown("de2en", id);

    const stored = progress.toJSON();
    expect(stored.de2en.frontier).toBe(7);
    expect(stored.de2en.knownAbove).toEqual([]);
    expect(stored.de2en.unknownBelow).toEqual([]);

    const reloaded = new WordProgress(IDS, stored);
    expect(reloaded.isKnown("de2en", "w7")).toBe(false);
    expect(reloaded.knownCount("de2en")).toBe(7);
  });

  it("ignores unknown ids and clamps out-of-range frontiers", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("de2en", "nope");
    expect(progress.knownCount("de2en")).toBe(0);

    const reloaded = new WordProgress(IDS, {
      de2en: { frontier: 999, knownAbove: [], unknownBelow: [] },
      en2de: { frontier: -5, knownAbove: [], unknownBelow: [] },
    });
    expect(reloaded.knownCount("de2en")).toBe(IDS.length);
    expect(reloaded.knownCount("en2de")).toBe(0);
  });

  it("survives malformed stored data", () => {
    const reloaded = new WordProgress(IDS, {
      de2en: { frontier: Number.NaN, knownAbove: [1, "w2"] as unknown as string[], unknownBelow: "x" as unknown as string[] },
      en2de: undefined as unknown as StoredProgress["en2de"],
    });
    expect(reloaded.knownCount("de2en")).toBe(1);
    expect(reloaded.knownCount("en2de")).toBe(0);
  });
});

describe("WordProgress counts", () => {
  it("caps at 50% when only one direction is known", () => {
    const progress = new WordProgress(IDS);
    for (const id of IDS) progress.markKnown("de2en", id);
    expect(progress.percent()).toBe(50);
    expect(progress.directionPercent("de2en")).toBe(100);
    expect(progress.directionPercent("en2de")).toBe(0);
  });

  it("reaches 100% when both directions are known", () => {
    const progress = new WordProgress(IDS);
    for (const id of IDS) {
      progress.markKnown("de2en", id);
      progress.markKnown("en2de", id);
    }
    expect(progress.percent()).toBe(100);
    expect(progress.learnedCount()).toBe(IDS.length * 2);
  });

  it("returns learned only when both directions are known", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("de2en", "w0");
    expect(progress.status("w0")).toEqual({ de2en: true, en2de: false, learned: false });
    expect(progress.isLearned("w0")).toBe(false);
    progress.markKnown("en2de", "w0");
    expect(progress.status("w0")).toEqual({ de2en: true, en2de: true, learned: true });
    expect(progress.isLearned("w0")).toBe(true);
  });

  it("handles an empty vocabulary", () => {
    const progress = new WordProgress([]);
    expect(progress.size).toBe(0);
    expect(progress.percent()).toBe(0);
    expect(progress.firstUnknownId()).toBeNull();
    expect(progress.planTest({ direction: "de2en" })).toEqual([]);
  });

  it("exposes a copy of the ordered ids and membership", () => {
    const progress = new WordProgress(IDS);
    const ids = progress.idsInOrder();
    expect(ids).toEqual(IDS);
    ids.pop();
    expect(progress.idsInOrder()).toEqual(IDS);
    expect(progress.has("w2")).toBe(true);
    expect(progress.has("nope")).toBe(false);
  });

  it("lists unknown ids in order", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("de2en", "w1");
    progress.markKnown("de2en", "w3");
    expect(progress.unknownIds("de2en")).toEqual(["w0", "w2", "w4", "w5", "w6", "w7"]);
  });
});

describe("WordProgress.record", () => {
  it("adds on correct and removes on wrong", () => {
    const progress = new WordProgress(IDS);
    progress.record("de2en", "w2", true);
    expect(progress.isKnown("de2en", "w2")).toBe(true);
    progress.record("de2en", "w2", false);
    expect(progress.isKnown("de2en", "w2")).toBe(false);
  });

  it("unlearns a previously known word when answered wrong", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("en2de", "w3");
    expect(progress.isKnown("en2de", "w3")).toBe(true);
    progress.record("en2de", "w3", false);
    expect(progress.isKnown("en2de", "w3")).toBe(false);
  });
});

describe("WordProgress.firstUnknownId", () => {
  it("returns the first word missing in either direction", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("de2en", "w0");
    progress.markKnown("en2de", "w0");
    progress.markKnown("de2en", "w1");
    expect(progress.firstUnknownId()).toBe("w1");
  });

  it("returns null when everything is learned", () => {
    const progress = new WordProgress(IDS);
    for (const id of IDS) {
      progress.markKnown("de2en", id);
      progress.markKnown("en2de", id);
    }
    expect(progress.firstUnknownId()).toBeNull();
  });
});

describe("WordProgress.planTest", () => {
  it("asks lower unknown words first", () => {
    const progress = new WordProgress(IDS);
    const queue = progress.planTest({ direction: "de2en", count: 3, random: () => 0.99, offsetRange: 0 });
    expect(queue.map((item) => item.id)).toEqual(["w0", "w1", "w2"]);
    expect(queue.every((item) => item.direction === "de2en")).toBe(true);
    expect(queue.every((item) => !item.refresh)).toBe(true);
  });

  it("skips words already known in the chosen direction", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("de2en", "w0");
    progress.markKnown("de2en", "w2");
    const queue = progress.planTest({ direction: "de2en", count: 2, random: () => 0.99, offsetRange: 0 });
    expect(queue.map((item) => item.id)).toEqual(["w1", "w3"]);
  });

  it("keeps strict order when the offset range is zero", () => {
    const progress = new WordProgress(IDS);
    const queue = progress.planTest({ direction: "de2en", count: 2, random: () => 0.99, offsetRange: 0 });
    expect(queue.map((item) => item.id)).toEqual(["w0", "w1"]);
  });

  it("spaces consecutive questions by a word-id distance of 2 to 10", () => {
    const progress = new WordProgress(IDS);
    const queue = progress.planTest({ direction: "de2en", count: 6, random: () => 0 });
    expect(queue.map((item) => item.id)).toEqual(["w0", "w2", "w4", "w1", "w3", "w5"]);
    const indices = queue.map((item) => Number(item.id.slice(1)));
    for (let i = 1; i < indices.length; i += 1) {
      const distance = Math.abs(indices[i] - indices[i - 1]);
      expect(distance).toBeGreaterThanOrEqual(2);
      expect(distance).toBeLessThanOrEqual(10);
    }
  });

  it("returns a single question when the count is one", () => {
    const progress = new WordProgress(IDS);
    const queue = progress.planTest({ direction: "de2en", count: 1, random: () => 0.99 });
    expect(queue).toHaveLength(1);
  });

  it("limits to the requested count", () => {
    const progress = new WordProgress(IDS);
    const queue = progress.planTest({ direction: "de2en", count: 3, random: () => 0.99 });
    expect(queue).toHaveLength(3);
  });

  it("returns every word when count is zero", () => {
    const progress = new WordProgress(IDS);
    const queue = progress.planTest({ direction: "de2en", count: 0, random: () => 0.99 });
    expect(queue).toHaveLength(IDS.length);
  });

  it("mixes in known words about 10% of the time", () => {
    const progress = new WordProgress(IDS);
    for (const id of ["w0", "w1", "w2", "w3"]) progress.markKnown("de2en", id);
    const queue = progress.planTest({ direction: "de2en", count: 4, random: () => 0.05 });
    expect(queue.filter((item) => item.refresh)).toHaveLength(4);
    expect(queue.every((item) => ["w0", "w1", "w2", "w3"].includes(item.id))).toBe(true);
  });

  it("does not refresh when no known words exist", () => {
    const progress = new WordProgress(IDS);
    const queue = progress.planTest({ direction: "de2en", count: 4, random: () => 0.0 });
    expect(queue.every((item) => !item.refresh)).toBe(true);
  });

  it("fills remaining slots with known words when unknowns run out", () => {
    const progress = new WordProgress(IDS);
    for (const id of ["w0", "w1", "w2", "w3", "w4", "w5"]) progress.markKnown("de2en", id);
    const queue = progress.planTest({ direction: "de2en", count: 4, random: () => 0.99 });
    expect(queue).toHaveLength(4);
    expect(queue.filter((item) => item.refresh)).toHaveLength(2);
  });

  it("targets the missing direction for mixed tests", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("de2en", "w0");
    const queue = progress.planTest({ direction: "mixed", count: 1, random: () => 0.99, offsetRange: 0 });
    expect(queue[0].id).toBe("w0");
    expect(queue[0].direction).toBe("en2de");
  });

  it("uses the still-missing direction when only en2de is known", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("en2de", "w0");
    const queue = progress.planTest({ direction: "mixed", count: 1, random: () => 0.99, offsetRange: 0 });
    expect(queue[0].id).toBe("w0");
    expect(queue[0].direction).toBe("de2en");
  });

  it("refreshes fully learned words in mixed mode", () => {
    const progress = new WordProgress(IDS);
    progress.markKnown("de2en", "w0");
    progress.markKnown("en2de", "w0");
    const queue = progress.planTest({ direction: "mixed", count: 1, random: () => 0 });
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe("w0");
    expect(queue[0].refresh).toBe(true);
  });

  it("picks either direction for fully unknown words in mixed mode", () => {
    const progress = new WordProgress(IDS);
    const queue = progress.planTest({ direction: "mixed", count: 2, random: seq([0.1, 0.9, 0.9, 0.9]), offsetRange: 0 });
    expect(queue[0].direction).toBe("de2en");
    expect(queue[1].direction).toBe("en2de");
  });
});

describe("WordProgress.planReask", () => {
  it("places the re-asked word at least five positions later", () => {
    const progress = new WordProgress(IDS);
    const earlier = progress.planReask(20, "de2en", { random: () => 0, direction: "de2en" });
    expect(earlier.position).toBe(5);
    const later = progress.planReask(20, "de2en", { random: () => 0.99, direction: "de2en" });
    expect(later.position).toBe(20);
  });

  it("flips direction when no direction is forced", () => {
    const progress = new WordProgress(IDS);
    expect(progress.planReask(10, "de2en", { random: () => 0 }).direction).toBe("en2de");
    expect(progress.planReask(10, "en2de", { random: () => 0 }).direction).toBe("de2en");
  });

  it("keeps the forced direction", () => {
    const progress = new WordProgress(IDS);
    expect(progress.planReask(10, "de2en", { random: () => 0, direction: "de2en" }).direction).toBe("de2en");
  });

  it("never exceeds the queue length", () => {
    const progress = new WordProgress(IDS);
    const plan = progress.planReask(2, "de2en", { random: () => 0.99 });
    expect(plan.position).toBeLessThanOrEqual(2);
  });
});
