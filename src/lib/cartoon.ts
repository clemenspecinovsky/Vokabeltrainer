import path from "node:path";
import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto";
import sharp from "sharp";

export const CARTOON_PROMPT =
    "Please make a cute minimalistic but still colored comic style avatar out " +
    "of it with a transparent background and no hearts or stars";

export const CARTOON_NOT_IMPLEMENTED = "CARTOON_NOT_IMPLEMENTED";

const BASE_URL = "https://imagetocartoon.com";
const RESULTS_BASE = "https://access.imagetocartoon.com/results";

const ENCRYPTION_KEY =
    "vH33r_2025_AES_GCM_S3cur3_K3y_9X7mP4qR8nT2wE5yU1oI6aS3dF7gH0jK9lZ";
const ENCRYPTION_SALT = "imagetocartoon-salt-2024";

const SELECTED_MODEL = "flux_klein/edit";
const MAX_DIMENSION = 1248;
const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 40;

interface UploadParams {
  positive_prompts: string;
  resolved_prompt: string;
  type: number;
  width: number;
  height: number;
  aspect_ratio: string;
  selected_model: string;
  model_name: string;
  user_id: string;
  email: string;
}

interface UploadResponse {
  code?: string | number;
  [key: string]: unknown;
}

interface StatusResponse {
  status?: string;
  downloadUrls?: string[];
  download_urls?: string[];
  [key: string]: unknown;
}

interface EncryptedResponse {
  data_enc?: string;
  [key: string]: unknown;
}

function deriveKey(): Buffer {
  return pbkdf2Sync(
      Buffer.from(ENCRYPTION_KEY, "utf8"),
      Buffer.from(ENCRYPTION_SALT, "utf8"),
      10_000,
      32,
      "sha256",
  );
}

function encryptParams(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);

  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);

  return Buffer.concat([iv, ciphertext, cipher.getAuthTag()]).toString(
      "base64",
  );
}

function decryptParams<T>(encoded: string): T {
  const raw = Buffer.from(encoded, "base64");

  if (raw.length < 28) {
    throw new Error("Invalid encrypted API response");
  }

  const iv = raw.subarray(0, 12);
  const ciphertext = raw.subarray(12, raw.length - 16);
  const authTag = raw.subarray(raw.length - 16);

  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString("utf8")) as T;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
        `Expected JSON from ${response.url} (HTTP ${response.status}): ` +
        text.slice(0, 500),
    );
  }
}

async function getEncryptedData<T>(response: Response): Promise<T> {
  const body = (await readJson(response)) as EncryptedResponse;

  if (!response.ok) {
    throw new Error(
        `API request failed (HTTP ${response.status}): ` +
        JSON.stringify(body).slice(0, 1000),
    );
  }

  if (typeof body.data_enc !== "string") {
    throw new Error(
        `API response is missing data_enc: ${JSON.stringify(body).slice(0, 1000)}`,
    );
  }

  return decryptParams<T>(body.data_enc);
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }

  return a;
}

async function getImageDimensions(
    imageBytes: Buffer,
): Promise<{ width: number; height: number; aspectRatio: string }> {
  const metadata = await sharp(imageBytes).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not determine input image dimensions");
  }

  const scale =
      MAX_DIMENSION / Math.max(metadata.width, metadata.height);

  const width = Math.round(metadata.width * scale);
  const height = Math.round(metadata.height * scale);
  const divisor = gcd(width, height);

  return {
    width,
    height,
    aspectRatio: `${width / divisor}:${height / divisor}`,
  };
}

async function uploadImage(imageBytes: Buffer): Promise<string> {
  const { width, height, aspectRatio } =
      await getImageDimensions(imageBytes);

  const metadata = await sharp(imageBytes).metadata();
  const format = metadata.format;

  const extensionByFormat: Record<string, string> = {
    jpeg: "jpg",
    png: "png",
    webp: "webp",
    gif: "gif",
    avif: "avif",
    tiff: "tif",
  };

  const extension = format
      ? extensionByFormat[format] ?? "img"
      : "img";

  const mimeType = format
      ? `image/${format === "jpeg" ? "jpeg" : format}`
      : "application/octet-stream";

  const params: UploadParams = {
    positive_prompts: CARTOON_PROMPT,
    resolved_prompt: CARTOON_PROMPT,
    type: 7,
    width,
    height,
    aspect_ratio: aspectRatio,
    selected_model: SELECTED_MODEL,
    model_name: "Flux Klein Edit",
    user_id: "anonymous",
    email: "",
  };

  const form = new FormData();

  form.append(
      "file",
      new Blob([new Uint8Array(imageBytes)], { type: mimeType }),
      `input.${extension}`,
  );
  form.append("params", encryptParams(params));
  form.append("selected_model", SELECTED_MODEL);

  const response = await fetch(`${BASE_URL}/api/u2/upload`, {
    method: "POST",
    body: form,
  });

  const result = await getEncryptedData<UploadResponse>(response);
  const code = String(result.code ?? "");

  if (!code) {
    throw new Error(
        `Upload response did not contain a task code: ${JSON.stringify(result)}`,
    );
  }

  return code;
}

function normalizeResultUrl(rawUrl: string): string {
  const value = rawUrl.trim();

  if (!value) {
    throw new Error("The API returned an empty result URL");
  }

  if (/^https?:\/\//i.test(value)) {
    const parsed = new URL(value);

    if (
        parsed.hostname === "access.imagetocartoon.com" &&
        parsed.pathname.includes("/root/code/server-vheer/results/")
    ) {
      const filename = path.posix.basename(parsed.pathname);
      return `${RESULTS_BASE}/${encodeURIComponent(filename)}`;
    }

    return value;
  }

  const cleanPath = value.split("?")[0].replaceAll("\\", "/");
  const filename = path.posix.basename(cleanPath);

  if (!filename || filename === "." || filename === "/") {
    throw new Error(`Unexpected result URL: ${rawUrl}`);
  }

  return `${RESULTS_BASE}/${encodeURIComponent(filename)}`;
}

async function pollForResult(code: string): Promise<string> {
  // Generate fresh encrypted parameters for this task.
  const params = encryptParams({
    type: 7,
    code,
    user_id: "anonymous",
  });

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(`${BASE_URL}/api/u2/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params }),
    });

    const status = await getEncryptedData<StatusResponse>(response);
    const state = String(status.status ?? "processing").toLowerCase();

    const urls = Array.isArray(status.downloadUrls)
        ? status.downloadUrls
        : Array.isArray(status.download_urls)
            ? status.download_urls
            : [];

    if (state === "success" || state === "completed") {
      if (urls.length === 0) {
        throw new Error(
            `Task completed without a download URL: ${JSON.stringify(status)}`,
        );
      }

      return normalizeResultUrl(urls[0]);
    }

    if (["failed", "error", "cancelled"].includes(state)) {
      throw new Error(`Cartoon conversion failed: ${JSON.stringify(status)}`);
    }

    if (
        ![
          "waiting",
          "queued",
          "pending",
          "processing",
          "running",
          "in_progress",
        ].includes(state)
    ) {
      console.warn(`Unrecognized task status: ${state}`);
    }

    if (attempt < MAX_POLL_ATTEMPTS) {
      await new Promise((resolve) =>
          setTimeout(resolve, POLL_INTERVAL_MS),
      );
    }
  }

  throw new Error("Timed out waiting for the cartoon result");
}

async function downloadResult(resultUrl: string): Promise<Buffer> {
  const response = await fetch(resultUrl, { signal: AbortSignal.timeout(120_000) });

  if (!response.ok) {
    throw new Error(
        `Image download failed (HTTP ${response.status}): ${resultUrl}`,
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());

  if (bytes.length === 0) {
    throw new Error("Downloaded image is empty");
  }

  return bytes;
}

export async function getCartoonResult(
    imageBytes: Buffer,
): Promise<Buffer> {
  if (!Buffer.isBuffer(imageBytes) || imageBytes.length === 0) {
    throw new TypeError("imageBytes must be a non-empty Buffer");
  }

  const code = await uploadImage(imageBytes);
  const resultUrl = await pollForResult(code);

  return downloadResult(resultUrl);
}