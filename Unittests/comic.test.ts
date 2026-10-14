import { describe, expect, it, vi } from "vitest";

const providerMock = vi.hoisted(() => ({
  comicGenerator: null as null | ((input: Buffer) => Promise<Buffer>),
}));

vi.mock("../src/lib/comicProvider", () => providerMock);

import { getComicGenerator } from "../src/lib/comic";

describe("getComicGenerator", () => {
  it("returns the generator registered in the provider", async () => {
    const generator = async (input: Buffer) => input;
    providerMock.comicGenerator = generator;

    expect(await getComicGenerator()).toBe(generator);
  });

  it("returns null when none is registered", async () => {
    providerMock.comicGenerator = null;

    expect(await getComicGenerator()).toBeNull();
  });
});
