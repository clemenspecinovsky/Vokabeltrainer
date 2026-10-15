export type StickerId = "bronze" | "silver" | "gold" | "platinum";

export interface Sticker {
  id: StickerId;
  label: string;
  emoji: string;
  minPercent: number;
  description: string;
}

export const STICKERS: readonly Sticker[] = [
  {
    id: "platinum",
    label: "Platin",
    emoji: "🏆",
    minPercent: 100,
    description: "Alles gemeistert – beide Richtungen, jede Vokabel!",
  },
  {
    id: "gold",
    label: "Gold",
    emoji: "🥇",
    minPercent: 75,
    description: "Fast alles sitzt – weiter so!",
  },
  {
    id: "silver",
    label: "Silber",
    emoji: "🥈",
    minPercent: 50,
    description: "Die Hälfte ist geschafft!",
  },
  {
    id: "bronze",
    label: "Bronze",
    emoji: "🥉",
    minPercent: 25,
    description: "Der Anfang ist gemacht!",
  },
];

function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(100, percent));
}

export function stickerForPercent(percent: number): Sticker | null {
  const value = clampPercent(percent);
  return STICKERS.find((sticker) => value >= sticker.minPercent) ?? null;
}

export function nextSticker(percent: number): Sticker | null {
  const value = clampPercent(percent);
  const ascending = [...STICKERS].sort((a, b) => a.minPercent - b.minPercent);
  return ascending.find((sticker) => sticker.minPercent > value) ?? null;
}
