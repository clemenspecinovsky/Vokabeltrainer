import { numbersToWords } from "./numbers";

export type AnswerLang = "de-DE" | "en-US";

const ARTICLES = new Set([
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "einer",
  "einem",
  "einen",
  "the",
  "a",
  "an",
]);

function base(raw: string, lang?: AnswerLang): string {
  let text = String(raw ?? "").toLowerCase().trim();
  text = text.replace(/[\u2018\u2019\u201c\u201d\u00ab\u00bb'"`´]/g, "");
  text = text.replace(/[.,!?;:()]/g, " ");
  text = text.replace(/[-/]/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  const parts = text.split(" ").filter(Boolean);
  const dropInfinitive = Boolean(lang) && String(lang).toLowerCase().startsWith("en");
  while (parts.length > 1) {
    const head = parts[0];
    if (ARTICLES.has(head) || (dropInfinitive && head === "to")) parts.shift();
    else break;
  }
  return parts.join(" ");
}

function forms(raw: string, lang?: AnswerLang): string[] {
  const value = base(raw, lang);
  if (!value) return [];

  const variants = [value];
  if (lang) {
    const asWords = numbersToWords(value, lang);
    if (asWords !== value) variants.push(asWords);
  }

  const out = new Set<string>();
  for (const variant of variants) {
    const stripped = variant
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\u00df/g, "ss");
    const expanded = variant
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/\u00df/g, "ss");
    out.add(stripped);
    if (expanded !== stripped) out.add(expanded);
  }
  return [...out];
}

function rawVariants(raw: string): string[] {
  const out = [raw];
  if (raw.includes("/")) {
    out.push(raw.replace(/\/[^/]*$/, ""));
    out.push(raw.replace(/\//g, ""));
    out.push(raw.replace(/\//g, " "));
    for (const piece of raw.split("/")) {
      if (piece.trim().length >= 3) out.push(piece);
    }
  }
  if (raw.includes("(")) out.push(raw.replace(/\([^)]*\)/g, " "));
  if (raw.includes("-")) out.push(raw.replace(/-/g, " "));
  return out;
}

export function canonicalize(value: string): string {
  return forms(value)[0] ?? "";
}

export function possibleAnswers(target: string, lang?: AnswerLang): string[] {
  const results = new Set<string>();
  for (const part of String(target ?? "").split(",")) {
    for (const variant of rawVariants(part)) {
      for (const form of forms(variant, lang)) {
        if (form) results.add(form);
      }
    }
  }
  return [...results];
}

export function isCorrect(answer: string, target: string, lang: AnswerLang = "en-US"): boolean {
  const given = new Set(forms(answer, lang));
  if (given.size === 0) return false;
  const answers = possibleAnswers(target, lang);
  return answers.some((candidate) => given.has(candidate));
}
