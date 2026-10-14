import { NextResponse } from "next/server";
import { isValidAvatar } from "@/lib/avatars";
import { getSession } from "@/lib/session";
import { loadUsers, saveUsers } from "@/lib/vocabulary";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: { avatar?: unknown; mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const users = await loadUsers();
  const user = users.find((entry) => entry.id === session.uid);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  if (body.mode === "photo") {
    if (!user.avatarImage) {
      return NextResponse.json({ error: "Es gibt noch kein Foto." }, { status: 400 });
    }
    user.avatarMode = "photo";
  } else {
    const avatar = String(body.avatar ?? "");
    if (!isValidAvatar(avatar)) {
      return NextResponse.json({ error: "Diesen Avatar gibt es nicht." }, { status: 400 });
    }
    user.avatar = avatar;
    user.avatarMode = "preset";
  }

  await saveUsers(users);
  return NextResponse.json({ ok: true, avatar: user.avatar ?? null, avatarMode: user.avatarMode });
}
