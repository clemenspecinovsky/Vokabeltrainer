import path from "node:path";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fsMock = vi.hoisted(() => ({
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async () => undefined),
  readFile: vi.fn(async () => Buffer.from("file-bytes")),
  unlink: vi.fn(async () => undefined),
}));

vi.mock("node:fs", () => ({ promises: fsMock }));

import {
  AVATAR_DIR,
  AVATAR_SIZE,
  avatarContentType,
  deleteAvatarImage,
  isAvatarImageName,
  readAvatarImage,
  resizeAvatar,
  saveAvatarImage,
} from "../src/lib/avatarImage";

describe("isAvatarImageName", () => {
  it("accepts safe image names", () => {
    for (const name of ["peci-123.png", "ronja.jpeg", "a.jpg", "avatar_1.webp", "dot.name.png"]) {
      expect(isAvatarImageName(name)).toBe(true);
    }
  });

  it("rejects traversal and unsafe names", () => {
    for (const name of [
      "..png",
      "evil/../x.png",
      "../x.png",
      "sub/x.png",
      "x.gif",
      "x.svg",
      "noext",
      "x.png ",
      "UP.PNG",
    ]) {
      expect(isAvatarImageName(name)).toBe(false);
    }
  });

  it("rejects non-strings", () => {
    expect(isAvatarImageName(null)).toBe(false);
    expect(isAvatarImageName(undefined)).toBe(false);
    expect(isAvatarImageName(5)).toBe(false);
    expect(isAvatarImageName({})).toBe(false);
  });
});

describe("avatarContentType", () => {
  it("maps known extensions", () => {
    expect(avatarContentType("a.png")).toBe("image/png");
    expect(avatarContentType("a.jpg")).toBe("image/jpeg");
    expect(avatarContentType("a.jpeg")).toBe("image/jpeg");
    expect(avatarContentType("a.webp")).toBe("image/webp");
  });

  it("is case-insensitive and defaults to octet-stream", () => {
    expect(avatarContentType("a.PNG")).toBe("image/png");
    expect(avatarContentType("a.gif")).toBe("application/octet-stream");
    expect(avatarContentType("noext")).toBe("application/octet-stream");
  });
});

describe("resizeAvatar", () => {
  it("produces a square RGBA PNG at the requested size", async () => {
    const input = await sharp({
      create: { width: 200, height: 100, channels: 3, background: { r: 200, g: 100, b: 50 } },
    })
      .jpeg()
      .toBuffer();

    const output = await resizeAvatar(input, 96);
    const meta = await sharp(output).metadata();

    expect(meta.format).toBe("png");
    expect(meta.width).toBe(96);
    expect(meta.height).toBe(96);
    expect(meta.hasAlpha).toBe(true);
    expect(meta.channels).toBe(4);
  });

  it("defaults to AVATAR_SIZE", async () => {
    const input = await sharp({
      create: { width: 20, height: 20, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    const meta = await sharp(await resizeAvatar(input)).metadata();
    expect(meta.width).toBe(AVATAR_SIZE);
    expect(meta.height).toBe(AVATAR_SIZE);
  });
});

describe("saveAvatarImage", () => {
  beforeEach(() => {
    fsMock.mkdir.mockClear();
    fsMock.writeFile.mockClear();
  });

  it("writes the buffer into AVATAR_DIR and returns a safe name", async () => {
    const data = Buffer.from("image-bytes");
    const name = await saveAvatarImage("ronja", data, "png");

    expect(name).toMatch(/^ronja-\d+\.png$/);
    expect(fsMock.mkdir).toHaveBeenCalledWith(AVATAR_DIR, { recursive: true });
    expect(fsMock.writeFile).toHaveBeenCalledWith(path.join(AVATAR_DIR, name), data);
  });

  it("sanitizes the user id", async () => {
    const name = await saveAvatarImage("ro/nja *", Buffer.from("x"), "png");
    expect(name.startsWith("ronja-")).toBe(true);
  });

  it("falls back to 'user' and 'png' for unusable inputs", async () => {
    const name = await saveAvatarImage("@#$", Buffer.from("x"), "gif");
    expect(name.startsWith("user-")).toBe(true);
    expect(name.endsWith(".png")).toBe(true);
  });

  it("keeps a supported extension", async () => {
    expect(await saveAvatarImage("ronja", Buffer.from("x"), "jpeg")).toMatch(/\.jpeg$/);
  });
});

describe("deleteAvatarImage", () => {
  beforeEach(() => fsMock.unlink.mockClear());

  it("ignores invalid names", async () => {
    await deleteAvatarImage("..png");
    await deleteAvatarImage(null);
    expect(fsMock.unlink).not.toHaveBeenCalled();
  });

  it("deletes valid names", async () => {
    await deleteAvatarImage("ronja-1.png");
    expect(fsMock.unlink).toHaveBeenCalledWith(path.join(AVATAR_DIR, "ronja-1.png"));
  });

  it("swallows deletion errors", async () => {
    fsMock.unlink.mockRejectedValueOnce(new Error("nope"));
    await expect(deleteAvatarImage("ronja-2.png")).resolves.toBeUndefined();
  });
});

describe("readAvatarImage", () => {
  beforeEach(() => {
    fsMock.readFile.mockReset();
    fsMock.readFile.mockResolvedValue(Buffer.from("file-bytes"));
  });

  it("returns null for invalid names without touching disk", async () => {
    expect(await readAvatarImage("../x.png")).toBeNull();
    expect(fsMock.readFile).not.toHaveBeenCalled();
  });

  it("returns the file contents", async () => {
    const buffer = await readAvatarImage("ronja-1.png");
    expect(buffer?.toString()).toBe("file-bytes");
    expect(fsMock.readFile).toHaveBeenCalledWith(path.join(AVATAR_DIR, "ronja-1.png"));
  });

  it("returns null when the file is missing", async () => {
    fsMock.readFile.mockRejectedValueOnce(new Error("ENOENT"));
    expect(await readAvatarImage("ronja-1.png")).toBeNull();
  });
});
