import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { makeTransparent } from "../src/lib/transparent";

const CHANNELS = 3;

function buildImage(
  width: number,
  height: number,
  square: { x: number; y: number; size: number } | null,
): Promise<Buffer> {
  const data = Buffer.alloc(width * height * CHANNELS);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * CHANNELS;
      const inside =
        square !== null &&
        x >= square.x &&
        x < square.x + square.size &&
        y >= square.y &&
        y < square.y + square.size;
      if (inside) {
        data[i] = 220;
        data[i + 1] = 20;
        data[i + 2] = 20;
      } else {
        data[i] = 250;
        data[i + 1] = 250;
        data[i + 2] = 250;
      }
    }
  }
  return sharp(data, { raw: { width, height, channels: CHANNELS } }).png().toBuffer();
}

function alphaAt(data: Buffer, width: number, x: number, y: number): number {
  return data[(y * width + x) * 4 + 3];
}

describe("makeTransparent", () => {
  it("clears the background but keeps the subject", async () => {
    const png = await buildImage(48, 48, { x: 16, y: 16, size: 16 });

    const output = await makeTransparent(png);
    const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBe(4);
    expect(alphaAt(data, info.width, 0, 0)).toBe(0);
    expect(alphaAt(data, info.width, info.width - 1, info.height - 1)).toBe(0);
    expect(alphaAt(data, info.width, 24, 24)).toBe(255);
  });

  it("makes a uniform image fully transparent", async () => {
    const png = await buildImage(20, 20, null);

    const output = await makeTransparent(png);
    const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBe(4);
    for (let i = 3; i < data.length; i += 4) {
      expect(data[i]).toBe(0);
    }
  });
});
