import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionMock = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/session", () => sessionMock);

const vocabMock = vi.hoisted(() => ({ loadUsers: vi.fn(), saveUsers: vi.fn() }));
vi.mock("@/lib/vocabulary", () => vocabMock);

import { POST } from "../src/app/api/settings/reset/route";

beforeEach(() => {
  sessionMock.getSession.mockReset();
  vocabMock.loadUsers.mockReset();
  vocabMock.saveUsers.mockReset();
  sessionMock.getSession.mockResolvedValue({ uid: "ronja", name: "Ronja", exp: Date.now() + 60_000 });
});

describe("POST /api/settings/reset", () => {
  it("rejects unauthenticated requests", async () => {
    sessionMock.getSession.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(vocabMock.saveUsers).not.toHaveBeenCalled();
  });

  it("returns 404 for unknown users", async () => {
    vocabMock.loadUsers.mockResolvedValue([]);

    const response = await POST();

    expect(response.status).toBe(404);
    expect(vocabMock.saveUsers).not.toHaveBeenCalled();
  });

  it("removes progress and history but keeps the rest", async () => {
    vocabMock.loadUsers.mockResolvedValue([
      {
        id: "ronja",
        username: "ronja",
        displayName: "Ronja",
        avatar: "manga-1",
        progress: {
          de2en: { frontier: 1, knownAbove: [], unknownBelow: [] },
          en2de: { frontier: 0, knownAbove: [], unknownBelow: [] },
        },
        history: [{ type: "test", at: 1 }],
      },
    ]);
    vocabMock.saveUsers.mockResolvedValue(undefined);

    const response = await POST();

    expect(response.status).toBe(200);
    const saved = vocabMock.saveUsers.mock.calls[0][0];
    expect(saved[0].progress).toBeUndefined();
    expect(saved[0].history).toBeUndefined();
    expect(saved[0].displayName).toBe("Ronja");
    expect(saved[0].avatar).toBe("manga-1");
  });
});
