import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const imglyMock = vi.hoisted(() => ({ removeBackground: vi.fn() }));
vi.mock("@imgly/background-removal-node", () => imglyMock);

const transparentMock = vi.hoisted(() => ({
  makeTransparent: vi.fn(async () => Buffer.from("fallback")),
}));
vi.mock("@/lib/transparent", () => transparentMock);

import { removeBackground } from "@imgly/background-removal-node";
import { makeTransparent } from "@/lib/transparent";
import { removeImageBackground } from "../src/lib/cutout";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP")]);
const jpeg = Buffer.from("not-a-real-image");

function blobOf(length: number): Blob {
  return {
    arrayBuffer: async () => new Uint8Array(length).buffer,
  } as unknown as Blob;
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.mocked(removeBackground).mockReset();
  vi.mocked(makeTransparent).mockReset();
  vi.mocked(makeTransparent).mockResolvedValue(Buffer.from("fallback"));
});

afterEach(() => errorSpy.mockRestore());

describe("removeImageBackground", () => {
  it("returns the cleaned png from the model", async () => {
    vi.mocked(removeBackground).mockResolvedValue(blobOf(2000));

    const output = await removeImageBackground(png);

    expect(output.length).toBe(2000);
    expect(makeTransparent).not.toHaveBeenCalled();
    expect(vi.mocked(removeBackground).mock.calls[0][1]).toEqual({
      model: "small",
      output: { format: "image/png" },
    });
  });

  it("passes the sniffed mime type to the model", async () => {
    vi.mocked(removeBackground).mockResolvedValue(blobOf(2000));

    await removeImageBackground(png);
    await removeImageBackground(webp);
    await removeImageBackground(jpeg);

    const calls = vi.mocked(removeBackground).mock.calls;
    expect((calls[0][0] as Blob).type).toBe("image/png");
    expect((calls[1][0] as Blob).type).toBe("image/webp");
    expect((calls[2][0] as Blob).type).toBe("image/jpeg");
  });

  it("falls back to keying when the model returns an empty image", async () => {
    vi.mocked(removeBackground).mockResolvedValue(blobOf(10));

    const output = await removeImageBackground(png);

    expect(output.toString()).toBe("fallback");
    expect(makeTransparent).toHaveBeenCalledWith(png);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("falls back to keying when the model throws", async () => {
    vi.mocked(removeBackground).mockRejectedValue(new Error("boom"));

    const output = await removeImageBackground(webp);

    expect(output.toString()).toBe("fallback");
    expect(makeTransparent).toHaveBeenCalledWith(webp);
    expect(errorSpy).toHaveBeenCalled();
  });
});
