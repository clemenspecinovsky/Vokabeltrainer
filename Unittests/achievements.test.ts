import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_GROUPS,
  berlinTime,
  buildContext,
  evaluateAchievements,
  getAchievement,
  mergeAchievements,
  normalizeStats,
  normalizeTestSummary,
  updateStats,
  type AchievementContext,
  type TestSummary,
} from "../src/lib/achievements";
import { WordProgress } from "../src/lib/progress";
import type { StoredProgress, StoredUser } from "../src/lib/types";

const SUMMARY: TestSummary = {
  correct: 0,
  wrong: 0,
  wrongDistinct: 0,
  bestStreakUnder3s: 0,
  forgotThenLearned: false,
  ponderedCorrect: false,
};

const BASE: AchievementContext = {
  wordsLearned: 0,
  firstWordsLearned: 0,
  percent: 0,
  avatarMade: false,
  tests: 0,
  dayStreak: 0,
  todayCount: 0,
  sawSat: false,
  sawSun: false,
  hour: null,
  summary: null,
};

function ctx(partial: Partial<AchievementContext>): AchievementContext {
  return { ...BASE, ...partial };
}

function withSummary(partial: Partial<TestSummary>): AchievementContext {
  return ctx({ summary: { ...SUMMARY, ...partial } });
}

describe("achievement catalog", () => {
  it("has 26 unique achievements with valid groups", () => {
    const ids = ACHIEVEMENTS.map((achievement) => achievement.id);
    expect(ids).toHaveLength(26);
    expect(new Set(ids).size).toBe(26);
    const groups = new Set(ACHIEVEMENT_GROUPS.map((group) => group.id));
    for (const achievement of ACHIEVEMENTS) {
      expect(groups.has(achievement.group)).toBe(true);
      expect(achievement.title.length).toBeGreaterThan(0);
      expect(achievement.description.length).toBeGreaterThan(0);
      expect(achievement.emoji.length).toBeGreaterThan(0);
    }
  });

  it("looks up achievements by id", () => {
    expect(getAchievement("first-test")?.title).toBe("Eisbrecher");
    expect(getAchievement("unbekannt")).toBeNull();
  });
});

describe("berlinTime", () => {
  it("converts winter time (CET, UTC+1)", () => {
    const parts = berlinTime(Date.parse("2026-01-01T07:30:00+01:00"));
    expect(parts).toEqual({ dayKey: "2026-01-01", weekday: "Thu", hour: 7 });
  });

  it("rolls to the next day across midnight", () => {
    const parts = berlinTime(Date.parse("2026-01-01T23:30:00Z"));
    expect(parts.dayKey).toBe("2026-01-02");
    expect(parts.hour).toBe(0);
    expect(parts.weekday).toBe("Fri");
  });

  it("converts summer time (CEST, UTC+2)", () => {
    const parts = berlinTime(Date.parse("2026-07-01T22:00:00Z"));
    expect(parts.dayKey).toBe("2026-07-02");
    expect(parts.hour).toBe(0);
  });
});

describe("normalizeStats", () => {
  it("returns empty stats for invalid input", () => {
    expect(normalizeStats(null)).toEqual({
      tests: 0,
      lastDay: "",
      dayStreak: 0,
      todayCount: 0,
      sawSat: false,
      sawSun: false,
    });
  });

  it("sanitizes fields", () => {
    const stats = normalizeStats({
      tests: -3,
      lastDay: 42,
      dayStreak: 2.9,
      todayCount: "x",
      sawSat: 1,
      sawSun: true,
    });
    expect(stats).toEqual({
      tests: 0,
      lastDay: "",
      dayStreak: 2,
      todayCount: 0,
      sawSat: false,
      sawSun: true,
    });
  });
});

describe("updateStats", () => {
  const day = (iso: string) => berlinTime(Date.parse(iso));

  it("starts a streak on the first test", () => {
    const stats = updateStats(undefined, day("2026-01-01T09:00:00+01:00"));
    expect(stats).toMatchObject({ tests: 1, lastDay: "2026-01-01", dayStreak: 1, todayCount: 1 });
  });

  it("grows todayCount for multiple tests on the same day", () => {
    let stats = updateStats(undefined, day("2026-01-01T09:00:00+01:00"));
    stats = updateStats(stats, day("2026-01-01T21:00:00+01:00"));
    expect(stats.tests).toBe(2);
    expect(stats.todayCount).toBe(2);
    expect(stats.dayStreak).toBe(1);
  });

  it("extends the streak on consecutive days and resets after a gap", () => {
    let stats = updateStats(undefined, day("2026-01-01T09:00:00+01:00"));
    stats = updateStats(stats, day("2026-01-02T09:00:00+01:00"));
    stats = updateStats(stats, day("2026-01-03T09:00:00+01:00"));
    expect(stats.dayStreak).toBe(3);
    stats = updateStats(stats, day("2026-01-06T09:00:00+01:00"));
    expect(stats.dayStreak).toBe(1);
    expect(stats.todayCount).toBe(1);
  });

  it("remembers weekend activity", () => {
    let stats = updateStats(undefined, day("2026-01-03T12:00:00+01:00"));
    expect(stats.sawSat).toBe(true);
    expect(stats.sawSun).toBe(false);
    stats = updateStats(stats, day("2026-01-04T12:00:00+01:00"));
    expect(stats.sawSun).toBe(true);
    expect(stats.dayStreak).toBe(2);
  });
});

describe("normalizeTestSummary", () => {
  it("returns null for invalid input", () => {
    expect(normalizeTestSummary(null)).toBeNull();
    expect(normalizeTestSummary("nope")).toBeNull();
  });

  it("coerces values", () => {
    const summary = normalizeTestSummary({
      correct: 3.7,
      wrong: -2,
      wrongDistinct: 1,
      bestStreakUnder3s: 5,
      forgotThenLearned: true,
      ponderedCorrect: 1,
    });
    expect(summary).toEqual({
      correct: 3,
      wrong: 0,
      wrongDistinct: 1,
      bestStreakUnder3s: 5,
      forgotThenLearned: true,
      ponderedCorrect: false,
    });
  });
});

describe("evaluateAchievements", () => {
  it("unlocks nothing on an empty context", () => {
    expect(evaluateAchievements(BASE)).toEqual([]);
  });

  const positives: [string, AchievementContext][] = [
    ["learned-10", ctx({ wordsLearned: 11 })],
    ["learned-20", ctx({ wordsLearned: 21 })],
    ["learned-50", ctx({ wordsLearned: 51 })],
    ["learned-100", ctx({ wordsLearned: 101 })],
    ["words-first-50", ctx({ firstWordsLearned: 50 })],
    ["words-first-100", ctx({ firstWordsLearned: 100 })],
    ["words-first-1000", ctx({ firstWordsLearned: 1000 })],
    ["early-bird", ctx({ hour: 7 })],
    ["night-owl", ctx({ hour: 20 })],
    ["streak-5", ctx({ dayStreak: 5 })],
    ["weekend-wonder", ctx({ sawSat: true, sawSun: true })],
    ["tornado-5", ctx({ todayCount: 6 })],
    ["blitz-5", withSummary({ bestStreakUnder3s: 5 })],
    ["no-mistakes", withSummary({ correct: 1, wrong: 0 })],
    ["deja-wort", withSummary({ forgotThenLearned: true })],
    ["hoppla", withSummary({ wrongDistinct: 6 })],
    ["thinker", withSummary({ ponderedCorrect: true })],
    ["avatar", ctx({ avatarMade: true })],
    ["first-test", ctx({ tests: 1 })],
    ["tests-50", ctx({ tests: 50 })],
    ["tests-100", ctx({ tests: 100 })],
    ["tests-1000", ctx({ tests: 1000 })],
    ["sticker-bronze", ctx({ percent: 25 })],
    ["sticker-silver", ctx({ percent: 50 })],
    ["sticker-gold", ctx({ percent: 75 })],
    ["sticker-platinum", ctx({ percent: 100 })],
  ];

  it.each(positives)("unlocks %s", (id, context) => {
    expect(evaluateAchievements(context)).toContain(id);
  });

  const negatives: [string, AchievementContext][] = [
    ["learned-10", ctx({ wordsLearned: 10 })],
    ["words-first-50", ctx({ firstWordsLearned: 49 })],
    ["early-bird", ctx({ hour: 8 })],
    ["night-owl", ctx({ hour: 19 })],
    ["streak-5", ctx({ dayStreak: 4 })],
    ["tornado-5", ctx({ todayCount: 5 })],
    ["blitz-5", withSummary({ bestStreakUnder3s: 4 })],
    ["no-mistakes", withSummary({ correct: 3, wrong: 1 })],
    ["hoppla", withSummary({ wrongDistinct: 5 })],
    ["tests-50", ctx({ tests: 49 })],
    ["sticker-bronze", ctx({ percent: 24 })],
  ];

  it.each(negatives)("does not unlock %s below threshold", (id, context) => {
    expect(evaluateAchievements(context)).not.toContain(id);
  });

  it("does not unlock performance achievements without a summary", () => {
    const ids = evaluateAchievements(ctx({ wordsLearned: 5 }));
    expect(ids).not.toContain("blitz-5");
    expect(ids).not.toContain("no-mistakes");
    expect(ids).not.toContain("hoppla");
  });

  it("returns results in catalog order", () => {
    const ids = evaluateAchievements(ctx({ percent: 100, tests: 1 }));
    const catalogOrder = ACHIEVEMENTS.map((achievement) => achievement.id).filter((id) =>
      ids.includes(id),
    );
    expect(ids).toEqual(catalogOrder);
  });

  it("unlocks every id that qualifies exactly once", () => {
    const ids = evaluateAchievements(
      ctx({
        wordsLearned: 101,
        firstWordsLearned: 1000,
        percent: 100,
        avatarMade: true,
        tests: 1000,
        dayStreak: 5,
        todayCount: 6,
        sawSat: true,
        sawSun: true,
        hour: 7,
        summary: {
          correct: 5,
          wrong: 0,
          wrongDistinct: 6,
          bestStreakUnder3s: 5,
          forgotThenLearned: true,
          ponderedCorrect: true,
        },
      }),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(25);
    expect(ids).not.toContain("night-owl");
  });
});

describe("buildContext", () => {
  function stored(frontier: number): StoredProgress {
    return {
      de2en: { frontier, knownAbove: [], unknownBelow: [] },
      en2de: { frontier, knownAbove: [], unknownBelow: [] },
    };
  }

  const ids = Array.from({ length: 10 }, (_, index) => `w${index}`);

  it("counts fully learned words and prefix", () => {
    const progress = new WordProgress(ids, stored(10));
    const user: StoredUser = { id: "u", username: "u", displayName: "U" };
    const context = buildContext(user, progress);
    expect(context.wordsLearned).toBe(10);
    expect(context.firstWordsLearned).toBe(10);
    expect(context.percent).toBe(100);
    expect(context.avatarMade).toBe(false);
    expect(context.tests).toBe(0);
    expect(context.hour).toBeNull();
    expect(context.summary).toBeNull();
  });

  it("stops the prefix at the first not-fully-learned word", () => {
    const partial: StoredProgress = {
      de2en: { frontier: 10, knownAbove: [], unknownBelow: [] },
      en2de: { frontier: 3, knownAbove: [], unknownBelow: [] },
    };
    const progress = new WordProgress(ids, partial);
    const user: StoredUser = { id: "u", username: "u", displayName: "U" };
    const context = buildContext(user, progress);
    expect(context.wordsLearned).toBe(3);
    expect(context.firstWordsLearned).toBe(3);
  });

  it("detects a photo avatar and passes stats/extras through", () => {
    const progress = new WordProgress(ids, stored(0));
    const user: StoredUser = {
      id: "u",
      username: "u",
      displayName: "U",
      avatarMode: "photo",
      avatarImage: "peci.png",
      stats: {
        tests: 4,
        lastDay: "2026-01-02",
        dayStreak: 2,
        todayCount: 2,
        sawSat: true,
        sawSun: false,
      },
    };
    const context = buildContext(user, progress, { hour: 6, summary: SUMMARY });
    expect(context.avatarMade).toBe(true);
    expect(context.tests).toBe(4);
    expect(context.dayStreak).toBe(2);
    expect(context.todayCount).toBe(2);
    expect(context.sawSat).toBe(true);
    expect(context.hour).toBe(6);
    expect(context.summary).toBe(SUMMARY);
  });
});

describe("mergeAchievements", () => {
  it("treats invalid stored values as empty", () => {
    expect(mergeAchievements(undefined, ["first-test"])).toEqual({
      earned: ["first-test"],
      newly: ["first-test"],
    });
    expect(mergeAchievements("nope", [])).toEqual({ earned: [], newly: [] });
  });

  it("keeps order, dedupes and reports only new ids", () => {
    const result = mergeAchievements(["a", "b"], ["b", "c", "d"]);
    expect(result.earned).toEqual(["a", "b", "c", "d"]);
    expect(result.newly).toEqual(["c", "d"]);
  });

  it("ignores non-string entries", () => {
    const result = mergeAchievements(["a", 5, null], ["a"]);
    expect(result.earned).toEqual(["a"]);
    expect(result.newly).toEqual([]);
  });
});
