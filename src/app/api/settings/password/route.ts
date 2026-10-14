import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { loadUsers, saveUsers } from "@/lib/vocabulary";

const MIN_LENGTH = 4;
const MAX_LENGTH = 128;

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: { current?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const current = String(body.current ?? "");
  const next = String(body.next ?? "");

  if (next.length < MIN_LENGTH) {
    return NextResponse.json(
      { error: `Das neue Passwort muss mindestens ${MIN_LENGTH} Zeichen haben.` },
      { status: 400 },
    );
  }
  if (next.length > MAX_LENGTH) {
    return NextResponse.json({ error: "Das neue Passwort ist zu lang." }, { status: 400 });
  }

  const users = await loadUsers();
  const user = users.find((entry) => entry.id === session.uid);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const ok = await verifyPassword(current, user.passwordHash ?? user.password);
  if (!ok) {
    return NextResponse.json({ error: "Das aktuelle Passwort ist falsch." }, { status: 401 });
  }

  user.passwordHash = await hashPassword(next);
  delete user.password;
  await saveUsers(users);

  return NextResponse.json({ ok: true });
}
