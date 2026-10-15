export type VocabPair = [string, string];

export interface VocabEntry {
  id: string;
  de: string;
  en: string;
}

export type Direction = "de2en" | "en2de" | "mixed";
export type SingleDirection = "de2en" | "en2de";

export interface StoredDirectionProgress {
  frontier: number;
  knownAbove: string[];
  unknownBelow: string[];
}

export interface StoredProgress {
  en2de: StoredDirectionProgress;
  de2en: StoredDirectionProgress;
}

export type ActivityType = "test" | "learn";

export interface ActivityEntry {
  type: ActivityType;
  at: number;
}

export interface TestStats {
  tests: number;
  lastDay: string;
  dayStreak: number;
  todayCount: number;
  sawSat: boolean;
  sawSun: boolean;
}

export interface StoredUser {
  id: string;
  username: string;
  password?: string;
  passwordHash?: string;
  displayName: string;
  avatar?: string;
  avatarImage?: string;
  avatarMode?: "preset" | "photo";
  progress?: StoredProgress;
  history?: ActivityEntry[];
  stats?: TestStats;
  achievements?: string[];
}

export interface SessionData {
  uid: string;
  name: string;
  exp: number;
}

export type Mood = "happy" | "sad" | "neutral" | "wow" | "love" | "angry";
