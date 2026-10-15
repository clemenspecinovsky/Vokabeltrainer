import { NextResponse } from "next/server";
import {
  buildContext,
  berlinTime,
  evaluateAchievements,
  mergeAchievements,
  normalizeTestSummary,
  updateStats,
} from "@/lib/achievements";
import { appendActivity } from "@/lib/activity";
import { WordProgress } from "@/lib/progress";
import { getSession } from "@/lib/session";
import type { StoredProgress } from "@/lib/types";
import { loadUsers, loadVocabulary, saveUsers } from "@/lib/vocabulary";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: { progress?: StoredProgress; summary?: unknown } = {};
  try {
    body = (await request.json()) as { progress?: StoredProgress; summary?: unknown };
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const [users, words] = await Promise.all([loadUsers(), loadVocabulary()]);
  const index = users.findIndex((entry) => entry.id === session.uid);
  if (index < 0) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  const user = users[index];
  const progress = new WordProgress(
    words.map((word) => word.id),
    body.progress,
  );

  const now = Date.now();
  const berlin = berlinTime(now);
  const stats = updateStats(user.stats, berlin);
  const history = appendActivity(user.history, { type: "test", at: now });
  const summary = normalizeTestSummary(body.summary);

  const updated = {
    ...user,
    progress: progress.toJSON(),
    stats,
    history,
  };

  const context = buildContext(updated, progress, { hour: berlin.hour, summary });
  const { earned, newly } = mergeAchievements(user.achievements, evaluateAchievements(context));
  updated.achievements = earned;

  users[index] = updated;
  await saveUsers(users);

  return NextResponse.json({
    ok: true,
    progress: updated.progress,
    stats,
    history,
    achievements: earned,
    newly,
  });
}
