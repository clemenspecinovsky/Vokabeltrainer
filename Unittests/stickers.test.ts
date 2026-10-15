import { describe, expect, it } from "vitest";
import { STICKERS, nextSticker, stickerForPercent } from "../src/lib/stickers";

describe("stickerForPercent", () => {
  it("awards bronze from 25%", () => {
    expect(stickerForPercent(25)?.id).toBe("bronze");
    expect(stickerForPercent(49)?.id).toBe("bronze");
  });

  it("awards silver from 50%", () => {
    expect(stickerForPercent(50)?.id).toBe("silver");
    expect(stickerForPercent(74)?.id).toBe("silver");
  });

  it("awards gold from 75%", () => {
    expect(stickerForPercent(75)?.id).toBe("gold");
    expect(stickerForPercent(99)?.id).toBe("gold");
  });

  it("awards platinum only at 100%", () => {
    expect(stickerForPercent(100)?.id).toBe("platinum");
  });

  it("awards nothing below 25%", () => {
    expect(stickerForPercent(0)).toBeNull();
    expect(stickerForPercent(24)).toBeNull();
  });

  it("clamps and guards bad input", () => {
    expect(stickerForPercent(1000)?.id).toBe("platinum");
    expect(stickerForPercent(-50)).toBeNull();
    expect(stickerForPercent(Number.NaN)).toBeNull();
  });

  it("always returns a sticker defined in STICKERS", () => {
    for (const percent of [0, 25, 50, 75, 100]) {
      const sticker = stickerForPercent(percent);
      if (sticker) expect(STICKERS).toContain(sticker);
    }
  });
});

describe("nextSticker", () => {
  it("points at the next tier to reach", () => {
    expect(nextSticker(0)?.id).toBe("bronze");
    expect(nextSticker(25)?.id).toBe("silver");
    expect(nextSticker(60)?.id).toBe("gold");
    expect(nextSticker(90)?.id).toBe("platinum");
  });

  it("returns null once platinum is reached", () => {
    expect(nextSticker(100)).toBeNull();
  });

  it("handles bad input", () => {
    expect(nextSticker(Number.NaN)?.id).toBe("bronze");
  });
});
