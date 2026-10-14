import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";
import { loadUsers, saveUsers } from "@/lib/vocabulary";

export async function POST(request: Request): Promise<NextResponse> {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!username || !password) {
    return NextResponse.json({ error: "Bitte Benutzername und Passwort eingeben." }, { status: 400 });
  }

  const users = await loadUsers();
  const user = users.find((entry) => entry.username.trim().toLowerCase() === username);
  const ok = await verifyPassword(password, user?.passwordHash ?? user?.password);

  if (!user || !ok) {
    return NextResponse.json({ error: "Das hat nicht geklappt. Probier es noch einmal!" }, { status: 401 });
  }

  if (!user.passwordHash) {
    user.passwordHash = await hashPassword(password);
    delete user.password;
    await saveUsers(users).catch(() => undefined);
  }

  const token = await createSessionToken({ id: user.id, displayName: user.displayName });
  const response = NextResponse.json({
    user: { id: user.id, displayName: user.displayName, avatar: user.avatar ?? null },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
