import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionMock = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/session", () => sessionMock);

const vocabMock = vi.hoisted(() => ({ loadUsers: vi.fn(), saveUsers: vi.fn() }));
vi.mock("@/lib/vocabulary", () => vocabMock);

const avatarMock = vi.hoisted(() => ({
  saveAvatarImage: vi.fn(),
  deleteAvatarImage: vi.fn(),
}));
vi.mock("@/lib/avatarImage", () => avatarMock);

const cutoutMock = vi.hoisted(() => ({ removeImageBackground: vi.fn() }));
vi.mock("@/lib/cutout", () => cutoutMock);

const comicMock = vi.hoisted(() => ({ getComicGenerator: vi.fn() }));
vi.mock("@/lib/comic", () => comicMock);

import { POST } from "../src/app/api/settings/avatar-photo/route";

const source = `data:image/png;base64,${Buffer.alloc(2000, 3).toString("base64")}`;

let errorSpy: ReturnType<typeof vi.spyOn>;

function request(body: unknown, raw?: string): Request {
  return new Request("http://localhost/api/settings/avatar-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  sessionMock.getSession.mockReset();
  vocabMock.loadUsers.mockReset();
  vocabMock.saveUsers.mockReset();
  avatarMock.saveAvatarImage.mockReset();
  avatarMock.deleteAvatarImage.mockReset();
  cutoutMock.removeImageBackground.mockReset();
  comicMock.getComicGenerator.mockReset();

  sessionMock.getSession.mockResolvedValue({ uid: "ronja", name: "Ronja", exp: Date.now() + 60_000 });
  vocabMock.loadUsers.mockResolvedValue([{ id: "ronja", displayName: "Ronja" }]);
  comicMock.getComicGenerator.mockResolvedValue(null);
});

afterEach(() => errorSpy.mockRestore());

describe("POST /api/settings/avatar-photo error handling", () => {
  it("rejects unauthenticated requests", async () => {
    sessionMock.getSession.mockResolvedValue(null);

    const response = await POST(request({ mode: "comic", image: source }));

    expect(response.status).toBe(401);
  });

  it("rejects unknown users", async () => {
    vocabMock.loadUsers.mockResolvedValue([]);

    const response = await POST(request({ mode: "comic", image: source }));

    expect(response.status).toBe(401);
  });

  it("rejects malformed json", async () => {
    const response = await POST(request(null, "{not json"));

    expect(response.status).toBe(400);
  });

  it("rejects an invalid image payload", async () => {
    const response = await POST(request({ mode: "comic", image: "not-a-data-url" }));

    expect(response.status).toBe(400);
  });

  it("rejects source images that are too small", async () => {
    const tiny = `data:image/png;base64,${Buffer.alloc(10).toString("base64")}`;

    const response = await POST(request({ mode: "comic", image: tiny }));

    expect(response.status).toBe(400);
  });

  it("returns 502 when the cut-out fails", async () => {
    cutoutMock.removeImageBackground.mockRejectedValue(new Error("boom"));

    const response = await POST(request({ mode: "comic", image: source }));

    expect(response.status).toBe(502);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns 502 when saving fails", async () => {
    const png = await sharp({
      create: { width: 4, height: 4, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();
    avatarMock.saveAvatarImage.mockRejectedValue(new Error("disk full"));

    const response = await POST(
      request({ mode: "save", image: `data:image/png;base64,${png.toString("base64")}` }),
    );

    expect(response.status).toBe(502);
    expect(errorSpy).toHaveBeenCalled();
  });
});
