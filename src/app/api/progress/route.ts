import { NextResponse } from "next/server";
import { buildContext, evaluateAchievements, mergeAchievements } from "@/lib/achievements";
import { WordProgress } from "@/lib/progress";
import { getSession } from "@/lib/session";
import type { StoredProgress } from "@/lib/types";
import { loadUsers, loadVocabulary, saveUsers } from "@/lib/vocabulary";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: { progress?: StoredProgress } = {};
  try {
    body = (await request.json()) as { progress?: StoredProgress };
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const [users, words] = await Promise.all([loadUsers(), loadVocabulary()]);
  const index = users.findIndex((entry) => entry.id === session.uid);
  if (index < 0) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  const progress = new WordProgress(
    words.map((word) => word.id),
    body.progress,
  );
  const stored = progress.toJSON();

  const updated = { ...users[index], progress: stored };
  const { earned, newly } = mergeAchievements(
    users[index].achievements,
    evaluateAchievements(buildContext(updated, progress)),
  );
  updated.achievements = earned;

  users[index] = updated;
  await saveUsers(users);

  return NextResponse.json({ ok: true, progress: stored, achievements: earned, newly });
}
