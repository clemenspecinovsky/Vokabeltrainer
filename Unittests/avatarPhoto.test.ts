import sharp from "sharp";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getSession: async () => ({ uid: "ronja", name: "Ronja", exp: Date.now() + 60_000 }),
}));

vi.mock("@/lib/vocabulary", () => ({
  loadUsers: async () => [{ id: "ronja", displayName: "Ronja" }],
  saveUsers: async () => undefined,
}));

vi.mock("@/lib/avatarImage", () => ({
  saveAvatarImage: vi.fn(async () => "ronja-123.png"),
  deleteAvatarImage: vi.fn(async () => undefined),
}));

vi.mock("@/lib/cutout", () => ({
  removeImageBackground: vi.fn(async () => Buffer.from("png-bytes")),
}));

vi.mock("@/lib/comic", () => ({
  getComicGenerator: vi.fn(async () => null),
}));

import { POST } from "../src/app/api/settings/avatar-photo/route";
import { saveAvatarImage } from "@/lib/avatarImage";
import { getComicGenerator } from "@/lib/comic";
import { removeImageBackground } from "@/lib/cutout";

let transparentPng: Buffer;
let consoleError: ReturnType<typeof vi.spyOn>;

function request(mode: string, image: string): Request {
  return new Request("http://localhost/api/settings/avatar-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, mode }),
  });
}

function dataUrl(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

const source = dataUrl(Buffer.alloc(1500, 1));

describe("POST /api/settings/avatar-photo", () => {
  beforeAll(async () => {
    transparentPng = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();
  });

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(removeImageBackground).mockResolvedValue(transparentPng);
    vi.mocked(saveAvatarImage).mockClear();
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("returns a cut-out comic image when no generator is registered", async () => {
    const response = await POST(request("comic", source));

    expect(response.status).toBe(200);

    const data = (await response.json()) as { image?: string; mode?: string };
    expect(data.mode).toBe("cutout");
    expect(data.image?.startsWith("data:image/png;base64,")).toBe(true);

    const decoded = Buffer.from(String(data.image).split(",")[1], "base64");
    const metadata = await sharp(decoded).metadata();
    expect(metadata.hasAlpha).toBe(true);
    expect(metadata.channels).toBe(4);
  });

  it("uses the generator when one is registered", async () => {
    vi.mocked(getComicGenerator).mockResolvedValueOnce(async () => Buffer.from("styled"));

    const response = await POST(request("comic", source));

    expect(response.status).toBe(200);

    const data = (await response.json()) as { mode?: string };
    expect(data.mode).toBe("comic");
  });

  it("falls back to cutout when the generator fails", async () => {
    vi.mocked(getComicGenerator).mockResolvedValueOnce(async () => {
      throw new Error("boom");
    });

    const response = await POST(request("comic", source));

    expect(response.status).toBe(200);

    const data = (await response.json()) as { mode?: string };
    expect(data.mode).toBe("cutout");
  });

  it("saves the composed avatar with its alpha channel intact", async () => {
    const response = await POST(request("save", dataUrl(transparentPng)));

    expect(response.status).toBe(200);

    const data = (await response.json()) as { avatarImage?: string };
    expect(data.avatarImage).toBe("ronja-123.png");

    const saved = vi.mocked(saveAvatarImage).mock.calls.at(-1)?.[1];
    if (!saved) throw new Error("saveAvatarImage was not called with an image");

    const metadata = await sharp(saved).metadata();
    expect(metadata.hasAlpha).toBe(true);
    expect(metadata.channels).toBe(4);
  });
});
