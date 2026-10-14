export type VocabPair = [string, string];

export interface VocabEntry {
  id: string;
  de: string;
  en: string;
}

export type Direction = "de2en" | "en2de" | "mixed";
export type SingleDirection = "de2en" | "en2de";

export interface StoredUser {
  id: string;
  username: string;
  password?: string;
  passwordHash?: string;
  displayName: string;
  avatar?: string;
  avatarImage?: string;
  avatarMode?: "preset" | "photo";
}

export interface SessionData {
  uid: string;
  name: string;
  exp: number;
}

export type Mood = "happy" | "sad" | "neutral" | "wow" | "love" | "angry";
