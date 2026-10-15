import { NextResponse } from "next/server";
import { appendActivity } from "@/lib/activity";
import { getSession } from "@/lib/session";
import type { ActivityType } from "@/lib/types";
import { loadUsers, saveUsers } from "@/lib/vocabulary";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: { type?: ActivityType } = {};
  try {
    body = (await request.json()) as { type?: ActivityType };
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (body.type !== "test" && body.type !== "learn") {
    return NextResponse.json({ error: "Unbekannter Typ." }, { status: 400 });
  }

  const users = await loadUsers();
  const index = users.findIndex((entry) => entry.id === session.uid);
  if (index < 0) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  const history = appendActivity(users[index].history, { type: body.type, at: Date.now() });
  users[index] = { ...users[index], history };
  await saveUsers(users);

  return NextResponse.json({ ok: true, history });
}
