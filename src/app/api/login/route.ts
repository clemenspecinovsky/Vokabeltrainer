import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";
import { loadUsers } from "@/lib/vocabulary";

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
  const user = users.find(
    (entry) => entry.username.trim().toLowerCase() === username && entry.password === password,
  );

  if (!user) {
    return NextResponse.json({ error: "Das hat nicht geklappt. Probier es noch einmal!" }, { status: 401 });
  }

  const token = await createSessionToken({ id: user.id, displayName: user.displayName });
  const response = NextResponse.json({
    user: { id: user.id, displayName: user.displayName, avatar: user.avatar ?? null },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
