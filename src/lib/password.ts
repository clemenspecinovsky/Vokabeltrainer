import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const DEFAULT_N = 16384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const DEFAULT_KEYLEN = 64;
const SALT_BYTES = 16;
const MAX_N = 1 << 20;
const MAX_MEM = 128 * 1024 * 1024;

interface ScryptParams {
  n: number;
  r: number;
  p: number;
  keylen: number;
}

function base64url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

function derive(password: string, salt: Buffer, params: ScryptParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      params.keylen,
      { N: params.n, r: params.r, p: params.p, maxmem: MAX_MEM },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

function equalBytes(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function equalStrings(a: string, b: string): boolean {
  return equalBytes(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, {
    n: DEFAULT_N,
    r: DEFAULT_R,
    p: DEFAULT_P,
    keylen: DEFAULT_KEYLEN,
  });
  return ["scrypt", DEFAULT_N, DEFAULT_R, DEFAULT_P, base64url(salt), base64url(key)].join("$");
}

export function isHashed(value: string | undefined | null): boolean {
  return typeof value === "string" && value.startsWith("scrypt$");
}

export async function verifyPassword(
  password: string,
  stored: string | undefined | null,
): Promise<boolean> {
  if (!stored) return false;

  if (!isHashed(stored)) {
    return equalStrings(password, stored);
  }

  const parts = stored.split("$");
  if (parts.length !== 6) return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (n < 2 || n > MAX_N || r < 1 || r > 32 || p < 1 || p > 16) return false;

  const salt = fromBase64Url(parts[4]);
  const expected = fromBase64Url(parts[5]);
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = await derive(password, salt, { n, r, p, keylen: expected.length });
  return equalBytes(actual, expected);
}
