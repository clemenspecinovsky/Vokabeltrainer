import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const AVATAR_DIR = path.join(process.cwd(), "data", "avatars");
export const AVATAR_SIZE = 512;

const NAME_PATTERN = /^[a-zA-Z0-9._-]+\.(png|jpe?g|webp)$/;

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function isAvatarImageName(name: unknown): name is string {
  return typeof name === "string" && NAME_PATTERN.test(name) && !name.includes("..");
}

export function avatarContentType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "png";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export async function resizeAvatar(input: Buffer, size = AVATAR_SIZE): Promise<Buffer> {
  return sharp(input)
    .ensureAlpha()
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

export async function saveAvatarImage(uid: string, data: Buffer, ext = "png"): Promise<string> {
  await fs.mkdir(AVATAR_DIR, { recursive: true });
  const safeUid = uid.replace(/[^a-zA-Z0-9._-]/g, "") || "user";
  const safeExt = CONTENT_TYPES[ext] ? ext : "png";
  const name = `${safeUid}-${Date.now()}.${safeExt}`;
  await fs.writeFile(path.join(AVATAR_DIR, name), data);
  return name;
}

export async function deleteAvatarImage(name: unknown): Promise<void> {
  if (!isAvatarImageName(name)) return;
  await fs.unlink(path.join(AVATAR_DIR, name)).catch(() => undefined);
}

export async function readAvatarImage(name: string): Promise<Buffer | null> {
  if (!isAvatarImageName(name)) return null;
  try {
    return await fs.readFile(path.join(AVATAR_DIR, name));
  } catch {
    return null;
  }
}
