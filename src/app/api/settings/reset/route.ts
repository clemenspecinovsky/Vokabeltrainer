import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { loadUsers, saveUsers } from "@/lib/vocabulary";

export async function POST(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const users = await loadUsers();
  const index = users.findIndex((entry) => entry.id === session.uid);
  if (index < 0) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  users[index] = {
    ...users[index],
    progress: undefined,
    history: undefined,
    stats: undefined,
    achievements: undefined,
  };
  await saveUsers(users);

  return NextResponse.json({ ok: true });
}
