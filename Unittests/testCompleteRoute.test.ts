import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionMock = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/session", () => sessionMock);

const vocabMock = vi.hoisted(() => ({
  loadUsers: vi.fn(),
  loadVocabulary: vi.fn(),
  saveUsers: vi.fn(),
}));
vi.mock("@/lib/vocabulary", () => vocabMock);

import { POST } from "../src/app/api/test-complete/route";

const WORDS = [
  { id: "w0", de: "Haus", en: "house" },
  { id: "w1", de: "Baum", en: "tree" },
];

function makeRequest(body: unknown): Request {
  return new Request("http://test/api/test-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  sessionMock.getSession.mockReset();
  vocabMock.loadUsers.mockReset();
  vocabMock.loadVocabulary.mockReset();
  vocabMock.saveUsers.mockReset();
  sessionMock.getSession.mockResolvedValue({ uid: "ronja", name: "Ronja", exp: Date.now() + 60_000 });
  vocabMock.loadVocabulary.mockResolvedValue(WORDS);
  vocabMock.saveUsers.mockResolvedValue(undefined);
});

describe("POST /api/test-complete", () => {
  it("rejects unauthenticated requests", async () => {
    sessionMock.getSession.mockResolvedValue(null);

    const response = await POST(makeRequest({}));

    expect(response.status).toBe(401);
    expect(vocabMock.saveUsers).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON", async () => {
    const request = new Request("http://test/api/test-complete", { method: "POST", body: "not json" });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(vocabMock.saveUsers).not.toHaveBeenCalled();
  });

  it("returns 404 for unknown users", async () => {
    vocabMock.loadUsers.mockResolvedValue([]);

    const response = await POST(makeRequest({}));

    expect(response.status).toBe(404);
    expect(vocabMock.saveUsers).not.toHaveBeenCalled();
  });

  it("records the test, progress and new achievements", async () => {
    vocabMock.loadUsers.mockResolvedValue([
      { id: "ronja", username: "ronja", displayName: "Ronja" },
    ]);

    const response = await POST(
      makeRequest({
        summary: {
          correct: 2,
          wrong: 0,
          wrongDistinct: 0,
          bestStreakUnder3s: 5,
          forgotThenLearned: false,
          ponderedCorrect: false,
        },
      }),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as { newly: string[]; achievements: string[]; stats: { tests: number } };
    expect(data.stats.tests).toBe(1);
    expect(data.newly).toContain("first-test");
    expect(data.newly).toContain("no-mistakes");
    expect(data.newly).toContain("blitz-5");
    expect(data.achievements).toContain("first-test");

    const saved = vocabMock.saveUsers.mock.calls[0][0];
    expect(saved[0].stats.tests).toBe(1);
    expect(saved[0].history).toHaveLength(1);
    expect(saved[0].history[0].type).toBe("test");
    expect(saved[0].achievements).toContain("first-test");
  });

  it("keeps previously earned achievements", async () => {
    vocabMock.loadUsers.mockResolvedValue([
      {
        id: "ronja",
        username: "ronja",
        displayName: "Ronja",
        achievements: ["first-test"],
        stats: { tests: 1, lastDay: "", dayStreak: 1, todayCount: 1, sawSat: false, sawSun: false },
      },
    ]);

    const response = await POST(makeRequest({ summary: { correct: 1, wrong: 0 } }));

    const data = (await response.json()) as { newly: string[]; achievements: string[]; stats: { tests: number } };
    expect(data.stats.tests).toBe(2);
    expect(data.newly).not.toContain("first-test");
    expect(data.achievements).toContain("first-test");
  });
});
