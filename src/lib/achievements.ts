import { WordProgress } from "./progress";
import type { StoredUser, TestStats } from "./types";

export type AchievementGroup = "words" | "time" | "performance" | "quantity" | "sticker";

export interface Achievement {
  id: string;
  group: AchievementGroup;
  emoji: string;
  title: string;
  description: string;
}

export const ACHIEVEMENT_GROUPS: readonly { id: AchievementGroup; label: string }[] = [
  { id: "words", label: "🐣 Wort-Meilensteine" },
  { id: "time", label: "⏱️ Zeit & Beständigkeit" },
  { id: "performance", label: "🧠 Leistung & Marotten" },
  { id: "quantity", label: "📊 Test-Mengen" },
  { id: "sticker", label: "🏅 Sticker-Fortschritt" },
];

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "learned-10",
    group: "words",
    emoji: "🐣",
    title: "Wort-Küken",
    description: "Mehr als 10 Wörter gelernt – frisch geschlüpft in eine neue Sprache.",
  },
  {
    id: "learned-20",
    group: "words",
    emoji: "🗣️",
    title: "Plaudertasche",
    description: "Mehr als 20 Wörter gelernt – du redest gerne!",
  },
  {
    id: "learned-50",
    group: "words",
    emoji: "🤸",
    title: "Wort-Akrobat",
    description: "Mehr als 50 Wörter gelernt – du jonglierst wie im Zirkus.",
  },
  {
    id: "learned-100",
    group: "words",
    emoji: "💬",
    title: "Quasselstrippe",
    description: "Mehr als 100 Wörter gelernt – du kannst einfach nicht aufhören.",
  },
  {
    id: "words-first-50",
    group: "words",
    emoji: "🚩",
    title: "Halbzeit-Heldin",
    description: "Die ersten 50 Wörter gemeistert – der erste große Meilenstein.",
  },
  {
    id: "words-first-100",
    group: "words",
    emoji: "💯",
    title: "Hunderter-Heldin",
    description: "Die ersten 100 Wörter gemeistert – dreistellig!",
  },
  {
    id: "words-first-1000",
    group: "words",
    emoji: "💎",
    title: "Wort-Millionärin",
    description: "Die ersten 1000 Wörter gemeistert – fühlt sich an wie eine Million.",
  },
  {
    id: "early-bird",
    group: "time",
    emoji: "🐦",
    title: "Früher Vogel",
    description: "Einen Test vor 8:00 Uhr abgeschlossen – der frühe Vogel fängt den Wurm.",
  },
  {
    id: "night-owl",
    group: "time",
    emoji: "🦉",
    title: "Nachteule",
    description: "Einen Test nach 20:00 Uhr abgeschlossen – späte Gehirnleistung.",
  },
  {
    id: "streak-5",
    group: "time",
    emoji: "🐭",
    title: "Marathon-Maus",
    description: "An 5 Tagen in Folge getestet – große Ausdauer.",
  },
  {
    id: "weekend-wonder",
    group: "time",
    emoji: "🌞",
    title: "Wochenend-Wunder",
    description: "An einem Samstag UND einem Sonntag getestet – der Wochenend-Faulheit getrotzt.",
  },
  {
    id: "tornado-5",
    group: "time",
    emoji: "🌪️",
    title: "Test-Tornado",
    description: "Mehr als 5 Tests an einem Tag – wie im Sturm.",
  },
  {
    id: "blitz-5",
    group: "performance",
    emoji: "⚡",
    title: "Blitz-Birne",
    description: "5-mal hintereinander richtig in unter 3 Sekunden – Blitzbirne!",
  },
  {
    id: "no-mistakes",
    group: "performance",
    emoji: "👻",
    title: "Fehler-Phantom",
    description: "Einen Test ganz ohne Fehler abgeschlossen – als gäbe es keine Fehler.",
  },
  {
    id: "avatar",
    group: "performance",
    emoji: "📸",
    title: "Model-Modus",
    description: "Einen Avatar erstellt – bereit für den Laufsteg.",
  },
  {
    id: "deja-wort",
    group: "performance",
    emoji: "🔁",
    title: "Deja-Wort",
    description: "Ein Wort vergessen und dann doch noch gelernt – Déjà-vu!",
  },
  {
    id: "hoppla",
    group: "performance",
    emoji: "🙈",
    title: "Hoppla!",
    description: "Mehr als 5 Wörter in einem Test nicht gewusst – kurz, süß und verzeihend.",
  },
  {
    id: "thinker",
    group: "performance",
    emoji: "🤔",
    title: "Der Denker",
    description: "Über 60 Sekunden überlegt und dann richtig – wie die Statue.",
  },
  {
    id: "first-test",
    group: "quantity",
    emoji: "🧊",
    title: "Eisbrecher",
    description: "Den ersten Test abgeschlossen – das Eis ist gebrochen.",
  },
  {
    id: "tests-50",
    group: "quantity",
    emoji: "🐝",
    title: "Fleißbienchen",
    description: "50 Tests insgesamt – ein echtes Fleißbienchen.",
  },
  {
    id: "tests-100",
    group: "quantity",
    emoji: "🦸‍♀️",
    title: "Test-Titanin",
    description: "100 Tests insgesamt – ein wahrer Riese des Vokabellernens.",
  },
  {
    id: "tests-1000",
    group: "quantity",
    emoji: "🚀",
    title: "Unaufhaltbar",
    description: "1000 Tests insgesamt – legendärer Einsatz, nicht zu stoppen.",
  },
  {
    id: "sticker-bronze",
    group: "sticker",
    emoji: "🥉",
    title: "Treppchen-Stürmer",
    description: "Bronze-Sticker erhalten – der erste Schritt aufs Siegertreppchen.",
  },
  {
    id: "sticker-silver",
    group: "sticker",
    emoji: "🥈",
    title: "Glanzleistung",
    description: "Silber-Sticker erhalten – eine glänzende Leistung.",
  },
  {
    id: "sticker-gold",
    group: "sticker",
    emoji: "🥇",
    title: "Goldmädel",
    description: "Gold-Sticker erhalten – golden gemacht!",
  },
  {
    id: "sticker-platinum",
    group: "sticker",
    emoji: "👑",
    title: "Vokabel-Königin",
    description: "Platin-Sticker erhalten – die royale Krone der App.",
  },
];

export function getAchievement(id: string): Achievement | null {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id) ?? null;
}

const TZ = "Europe/Berlin";

export interface BerlinTime {
  dayKey: string;
  weekday: string;
  hour: number;
}

const berlinFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  hour12: false,
});

export function berlinTime(at: number): BerlinTime {
  const parts: Record<string, string> = {};
  for (const part of berlinFormat.formatToParts(new Date(at))) {
    parts[part.type] = part.value;
  }
  return {
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: parts.weekday,
    hour: Number(parts.hour) % 24,
  };
}

function dayNumber(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Math.floor(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

const EMPTY_STATS: TestStats = {
  tests: 0,
  lastDay: "",
  dayStreak: 0,
  todayCount: 0,
  sawSat: false,
  sawSun: false,
};

function nonNegInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function normalizeStats(value: unknown): TestStats {
  if (!value || typeof value !== "object") return { ...EMPTY_STATS };
  const stats = value as Partial<TestStats>;
  return {
    tests: nonNegInt(stats.tests),
    lastDay: typeof stats.lastDay === "string" ? stats.lastDay : "",
    dayStreak: nonNegInt(stats.dayStreak),
    todayCount: nonNegInt(stats.todayCount),
    sawSat: stats.sawSat === true,
    sawSun: stats.sawSun === true,
  };
}

export function updateStats(existing: unknown, day: BerlinTime): TestStats {
  const stats = normalizeStats(existing);
  stats.tests += 1;

  if (stats.lastDay !== "" && day.dayKey === stats.lastDay) {
    stats.todayCount += 1;
  } else {
    const consecutive =
      stats.lastDay !== "" && dayNumber(day.dayKey) === dayNumber(stats.lastDay) + 1;
    stats.dayStreak = consecutive ? stats.dayStreak + 1 : 1;
    stats.todayCount = 1;
    stats.lastDay = day.dayKey;
  }

  if (day.weekday === "Sat") stats.sawSat = true;
  if (day.weekday === "Sun") stats.sawSun = true;

  return stats;
}

export interface TestSummary {
  correct: number;
  wrong: number;
  wrongDistinct: number;
  bestStreakUnder3s: number;
  forgotThenLearned: boolean;
  ponderedCorrect: boolean;
}

export function normalizeTestSummary(value: unknown): TestSummary | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<TestSummary>;
  return {
    correct: nonNegInt(raw.correct),
    wrong: nonNegInt(raw.wrong),
    wrongDistinct: nonNegInt(raw.wrongDistinct),
    bestStreakUnder3s: nonNegInt(raw.bestStreakUnder3s),
    forgotThenLearned: raw.forgotThenLearned === true,
    ponderedCorrect: raw.ponderedCorrect === true,
  };
}

export interface AchievementContext {
  wordsLearned: number;
  firstWordsLearned: number;
  percent: number;
  avatarMade: boolean;
  tests: number;
  dayStreak: number;
  todayCount: number;
  sawSat: boolean;
  sawSun: boolean;
  hour: number | null;
  summary: TestSummary | null;
}

export function evaluateAchievements(ctx: AchievementContext): string[] {
  const earned = new Set<string>();
  const check = (id: string, ok: boolean) => {
    if (ok) earned.add(id);
  };

  check("learned-10", ctx.wordsLearned > 10);
  check("learned-20", ctx.wordsLearned > 20);
  check("learned-50", ctx.wordsLearned > 50);
  check("learned-100", ctx.wordsLearned > 100);
  check("words-first-50", ctx.firstWordsLearned >= 50);
  check("words-first-100", ctx.firstWordsLearned >= 100);
  check("words-first-1000", ctx.firstWordsLearned >= 1000);

  check("early-bird", ctx.hour !== null && ctx.hour < 8);
  check("night-owl", ctx.hour !== null && ctx.hour >= 20);
  check("streak-5", ctx.dayStreak >= 5);
  check("weekend-wonder", ctx.sawSat && ctx.sawSun);
  check("tornado-5", ctx.todayCount > 5);

  if (ctx.summary) {
    check("blitz-5", ctx.summary.bestStreakUnder3s >= 5);
    check("no-mistakes", ctx.summary.correct > 0 && ctx.summary.wrong === 0);
    check("deja-wort", ctx.summary.forgotThenLearned);
    check("hoppla", ctx.summary.wrongDistinct > 5);
    check("thinker", ctx.summary.ponderedCorrect);
  }

  check("avatar", ctx.avatarMade);
  check("first-test", ctx.tests >= 1);
  check("tests-50", ctx.tests >= 50);
  check("tests-100", ctx.tests >= 100);
  check("tests-1000", ctx.tests >= 1000);

  check("sticker-bronze", ctx.percent >= 25);
  check("sticker-silver", ctx.percent >= 50);
  check("sticker-gold", ctx.percent >= 75);
  check("sticker-platinum", ctx.percent >= 100);

  return ACHIEVEMENTS.filter((achievement) => earned.has(achievement.id)).map(
    (achievement) => achievement.id,
  );
}

export interface BuildContextExtras {
  hour?: number | null;
  summary?: TestSummary | null;
}

export function buildContext(
  user: StoredUser,
  progress: WordProgress,
  extras: BuildContextExtras = {},
): AchievementContext {
  const ids = progress.idsInOrder();

  let firstWordsLearned = 0;
  for (const id of ids) {
    if (!progress.isLearned(id)) break;
    firstWordsLearned += 1;
  }

  let wordsLearned = 0;
  for (const id of ids) {
    if (progress.isLearned(id)) wordsLearned += 1;
  }

  const stats = normalizeStats(user.stats);

  return {
    wordsLearned,
    firstWordsLearned,
    percent: progress.percent(),
    avatarMade: user.avatarMode === "photo" && Boolean(user.avatarImage),
    tests: stats.tests,
    dayStreak: stats.dayStreak,
    todayCount: stats.todayCount,
    sawSat: stats.sawSat,
    sawSun: stats.sawSun,
    hour: extras.hour ?? null,
    summary: extras.summary ?? null,
  };
}

export interface AchievementMerge {
  earned: string[];
  newly: string[];
}

export function mergeAchievements(existing: unknown, qualifying: readonly string[]): AchievementMerge {
  const known = new Set<string>();
  if (Array.isArray(existing)) {
    for (const entry of existing) {
      if (typeof entry === "string") known.add(entry);
    }
  }
  const newly = qualifying.filter((id) => !known.has(id));
  return { earned: [...known, ...newly], newly };
}
