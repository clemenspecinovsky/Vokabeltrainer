import { NextResponse } from "next/server";
import sharp from "sharp";
import { deleteAvatarImage, saveAvatarImage } from "@/lib/avatarImage";
import { getComicGenerator } from "@/lib/comic";
import { removeImageBackground } from "@/lib/cutout";
import { getSession } from "@/lib/session";
import { loadUsers, saveUsers } from "@/lib/vocabulary";

export const maxDuration = 180;

const DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/;
const MIN_SOURCE_BYTES = 1_000;
const MAX_BYTES = 8_000_000;
const OUTPUT_EDGE = 1024;

function parseImage(
  image: unknown,
  minBytes: number,
): { bytes: Buffer; subtype: string } | null {
  const match = DATA_URL_PATTERN.exec(String(image ?? ""));
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length < minBytes || bytes.length > MAX_BYTES) return null;
  return { bytes, subtype: match[1] };
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: { image?: unknown; mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const saving = body.mode === "save";
  const parsed = parseImage(body.image, saving ? 1 : MIN_SOURCE_BYTES);
  if (!parsed) {
    return NextResponse.json({ error: "Kein gültiges Foto." }, { status: 400 });
  }

  const users = await loadUsers();
  const user = users.find((entry) => entry.id === session.uid);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  if (saving) {
    try {
      const png = await sharp(parsed.bytes).png().toBuffer();
      const previous = user.avatarImage;
      const filename = await saveAvatarImage(user.id, png, "png");
      user.avatarImage = filename;
      user.avatarMode = "photo";
      await saveUsers(users);
      await deleteAvatarImage(previous);
      return NextResponse.json({ ok: true, avatarImage: filename });
    } catch (error) {
      console.error("avatar save failed", error);
      return NextResponse.json(
        { error: "Das Bild konnte nicht gespeichert werden. Bitte noch einmal." },
        { status: 502 },
      );
    }
  }

  try {
    const generator = await getComicGenerator();
    let mode: "comic" | "cutout" = "comic";
    let png: Buffer;

    if (!generator) {
      mode = "cutout";
      png = await removeImageBackground(parsed.bytes);
    } else {
      try {
        png = await removeImageBackground(await generator(parsed.bytes));
      } catch (error) {
        console.error("comic generator failed", error);
        mode = "cutout";
        png = await removeImageBackground(parsed.bytes);
      }
    }

    const capped = await sharp(png)
      .resize(OUTPUT_EDGE, OUTPUT_EDGE, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();

    return NextResponse.json({
      ok: true,
      image: `data:image/png;base64,${capped.toString("base64")}`,
      mode,
    });
  } catch (error) {
    console.error("avatar-photo failed", error);
    return NextResponse.json(
      { error: "Der Hintergrund wollte nicht weg. Bitte versuch es noch einmal." },
      { status: 502 },
    );
  }
}
