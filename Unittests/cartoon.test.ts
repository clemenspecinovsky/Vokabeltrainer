import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AVATAR_SIZE, resizeAvatar } from "../src/lib/avatarImage";
import { getCartoonResult } from "../src/lib/cartoon";
import { removeImageBackground } from "../src/lib/cutout";

const ENCRYPTION_KEY =
  "vH33r_2025_AES_GCM_S3cur3_K3y_9X7mP4qR8nT2wE5yU1oI6aS3dF7gH0jK9lZ";
const ENCRYPTION_SALT = "imagetocartoon-salt-2024";

function deriveKey(): Buffer {
  return pbkdf2Sync(
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    Buffer.from(ENCRYPTION_SALT, "utf8"),
    10_000,
    32,
    "sha256",
  );
}

function encrypt(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, ciphertext, cipher.getAuthTag()]).toString("base64");
}

function decrypt<T>(encoded: string): T {
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, 12);
  const ciphertext = raw.subarray(12, raw.length - 16);
  const authTag = raw.subarray(raw.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), iv);
  decipher.setAuthTag(authTag);
  return JSON.parse(
    Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"),
  ) as T;
}

type FetchInput = string | URL | Request;

function urlOf(input: FetchInput): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface Handlers {
  upload?: () => Response | Promise<Response>;
  status?: (index: number) => Response | Promise<Response>;
  download?: (url: string) => Response | Promise<Response>;
}

function setupFetch(handlers: Handlers): ReturnType<typeof vi.fn> {
  let statusIndex = 0;
  const fetchMock = vi.fn(
    async (input: FetchInput, init?: RequestInit): Promise<Response> => {
      void init;
      const url = urlOf(input);
      if (url.endsWith("/api/u2/upload")) {
        return handlers.upload ? handlers.upload() : jsonResponse({});
      }
      if (url.endsWith("/api/u2/status")) {
        return handlers.status ? handlers.status(statusIndex++) : jsonResponse({});
      }
      return handlers.download ? handlers.download(url) : jsonResponse({});
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

let samplePng: Buffer;

beforeAll(async () => {
  samplePng = await sharp({
    create: { width: 200, height: 100, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();
});

beforeEach(() => {
  vi.stubGlobal("setTimeout", (callback: (...args: unknown[]) => void) => {
    queueMicrotask(() => callback());
    return 0;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getCartoonResult input validation", () => {
  it("rejects empty or non-buffer input before calling the API", async () => {
    const fetchMock = setupFetch({});

    await expect(getCartoonResult(Buffer.alloc(0))).rejects.toThrow(TypeError);
    await expect(getCartoonResult("nope" as unknown as Buffer)).rejects.toThrow(TypeError);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getCartoonResult upload step", () => {
  it("sends an encrypted upload with the expected dimensions and prompt", async () => {
    const fetchMock = setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-1" }) }),
      status: (index) =>
        index === 0
          ? jsonResponse({ data_enc: encrypt({ status: "processing" }) })
          : jsonResponse({
              data_enc: encrypt({ status: "success", download_urls: ["https://cdn.example.com/out.png"] }),
            }),
      download: () => new Response(new Uint8Array(samplePng), { status: 200 }),
    });

    const promise = getCartoonResult(samplePng);
    await promise;

    const [uploadUrl, uploadInit] = fetchMock.mock.calls[0];
    expect(urlOf(uploadUrl as FetchInput)).toBe("https://imagetocartoon.com/api/u2/upload");
    expect(uploadInit?.method).toBe("POST");

    const form = uploadInit?.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("selected_model")).toBe("flux_klein/edit");

    const params = decrypt<Record<string, unknown>>(String(form.get("params")));
    expect(params.selected_model).toBe("flux_klein/edit");
    expect(params.width).toBe(1248);
    expect(params.height).toBe(624);
    expect(params.aspect_ratio).toBe("2:1");
    expect(String(params.positive_prompts)).toContain("comic style avatar");
  });

  it("fails when the upload response is not ok", async () => {
    setupFetch({ upload: () => new Response("{}", { status: 500 }) });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("API request failed (HTTP 500)");
  });

  it("fails when the body is not JSON", async () => {
    setupFetch({ upload: () => new Response("nope", { status: 200 }) });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("Expected JSON");
  });

  it("fails when data_enc is missing", async () => {
    setupFetch({ upload: () => jsonResponse({ code: "task-1" }) });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("missing data_enc");
  });

  it("fails when the task code is missing", async () => {
    setupFetch({ upload: () => jsonResponse({ data_enc: encrypt({}) }) });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("did not contain a task code");
  });

  it("fails on a malformed encrypted payload", async () => {
    setupFetch({
      upload: () => jsonResponse({ data_enc: Buffer.from("short").toString("base64") }),
    });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("Invalid encrypted API response");
  });
});

describe("getCartoonResult polling", () => {
  function successAfter(processingCount: number, urls: string[]): Handlers["status"] {
    return (index) =>
      index < processingCount
        ? jsonResponse({ data_enc: encrypt({ status: "processing" }) })
        : jsonResponse({ data_enc: encrypt({ status: "success", download_urls: urls }) });
  }

  it("polls until success and downloads the result", async () => {
    const fetchMock = setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-1" }) }),
      status: successAfter(1, ["https://cdn.example.com/out.png"]),
      download: () => new Response(new Uint8Array(samplePng), { status: 200 }),
    });

    const promise = getCartoonResult(samplePng);
    const result = await promise;

    expect(result.equals(samplePng)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(urlOf(fetchMock.mock.calls[3][0] as FetchInput)).toBe("https://cdn.example.com/out.png");
  });

  it("normalizes an internal result path to the public results URL", async () => {
    const fetchMock = setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-2" }) }),
      status: () =>
        jsonResponse({
          data_enc: encrypt({
            status: "completed",
            downloadUrls: [
              "https://access.imagetocartoon.com/root/code/server-vheer/results/abc123.png",
            ],
          }),
        }),
      download: () => new Response(new Uint8Array(samplePng), { status: 200 }),
    });

    const promise = getCartoonResult(samplePng);
    await promise;

    expect(urlOf(fetchMock.mock.calls[2][0] as FetchInput)).toBe(
      "https://access.imagetocartoon.com/results/abc123.png",
    );
  });

  it("turns a bare filename into a results URL", async () => {
    const fetchMock = setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-3" }) }),
      status: () =>
        jsonResponse({
          data_enc: encrypt({ status: "success", download_urls: ["nested/folder/pic.png"] }),
        }),
      download: () => new Response(new Uint8Array(samplePng), { status: 200 }),
    });

    const promise = getCartoonResult(samplePng);
    await promise;

    expect(urlOf(fetchMock.mock.calls[2][0] as FetchInput)).toBe(
      "https://access.imagetocartoon.com/results/pic.png",
    );
  });

  it("fails when the task reports a failed state", async () => {
    setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-4" }) }),
      status: () => jsonResponse({ data_enc: encrypt({ status: "failed" }) }),
    });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("Cartoon conversion failed");
  });

  it("fails when a completed task has no download URL", async () => {
    setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-5" }) }),
      status: () => jsonResponse({ data_enc: encrypt({ status: "success", download_urls: [] }) }),
    });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("completed without a download URL");
  });

  it("fails when the download URL is empty", async () => {
    setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-6" }) }),
      status: () => jsonResponse({ data_enc: encrypt({ status: "success", download_urls: ["   "] }) }),
    });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("empty result URL");
  });

  it("fails on an unusable result path", async () => {
    setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-11" }) }),
      status: () => jsonResponse({ data_enc: encrypt({ status: "success", download_urls: ["/"] }) }),
    });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("Unexpected result URL");
  });

  it("warns about an unknown status and keeps polling", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-7" }) }),
      status: (index) =>
        index === 0
          ? jsonResponse({ data_enc: encrypt({ status: "weird" }) })
          : jsonResponse({
              data_enc: encrypt({ status: "success", download_urls: ["https://cdn.example.com/out.png"] }),
            }),
      download: () => new Response(new Uint8Array(samplePng), { status: 200 }),
    });

    const promise = getCartoonResult(samplePng);
    await promise;

    expect(warn).toHaveBeenCalledWith("Unrecognized task status: weird");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("times out after the maximum number of attempts", async () => {
    const fetchMock = setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-8" }) }),
      status: () => jsonResponse({ data_enc: encrypt({ status: "processing" }) }),
    });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("Timed out waiting for the cartoon result");
    expect(fetchMock).toHaveBeenCalledTimes(41);
  });
});

describe("getCartoonResult download step", () => {
  it("fails when the download is not ok", async () => {
    setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-9" }) }),
      status: () =>
        jsonResponse({ data_enc: encrypt({ status: "success", download_urls: ["https://cdn.example.com/out.png"] }) }),
      download: () => new Response("nope", { status: 404 }),
    });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("Image download failed (HTTP 404)");
  });

  it("fails when the downloaded image is empty", async () => {
    setupFetch({
      upload: () => jsonResponse({ data_enc: encrypt({ code: "task-10" }) }),
      status: () =>
        jsonResponse({ data_enc: encrypt({ status: "success", download_urls: ["https://cdn.example.com/out.png"] }) }),
      download: () => new Response(null, { status: 200 }),
    });

    const promise = getCartoonResult(samplePng);

    await expect(promise).rejects.toThrow("Downloaded image is empty");
  });
});

const LIVE = process.env.CARTOON_LIVE === "1";
const inputPath = path.resolve(process.cwd(), "Unittests", "data", "peci.png");
const outputDir = path.join(tmpdir(), "opencode");
const outputPath = path.join(outputDir, "peci-cartoon.png");

describe("getCartoonResult (live)", () => {
  it.skipIf(!LIVE)(
    "replies with an image whose cut-out keeps an alpha channel",
    async () => {
      const photo = await readFile(inputPath);

      const reply = await getCartoonResult(photo);

      expect(reply.length).toBeGreaterThan(0);
      const replyMetadata = await sharp(reply).metadata();
      expect(replyMetadata.width).toBeGreaterThan(0);
      expect(replyMetadata.height).toBeGreaterThan(0);

      const cutout = await removeImageBackground(reply);
      const cutoutMetadata = await sharp(cutout).metadata();
      expect(cutoutMetadata.hasAlpha).toBe(true);
      expect(cutoutMetadata.channels).toBe(4);

      const avatar = await resizeAvatar(cutout);
      const avatarMetadata = await sharp(avatar).metadata();
      expect(avatarMetadata.width).toBe(AVATAR_SIZE);
      expect(avatarMetadata.height).toBe(AVATAR_SIZE);
      expect(avatarMetadata.hasAlpha).toBe(true);

      await mkdir(outputDir, { recursive: true });
      await writeFile(outputPath, avatar);
      console.log(
        `Wrote ${avatarMetadata.width}x${avatarMetadata.height} cartoon to ${outputPath}`,
      );
    },
    240_000,
  );
});
