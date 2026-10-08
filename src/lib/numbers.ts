const EN_ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

const DE_ONES = [
  "null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn",
  "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn",
];
const DE_TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

const MAX_VALUE = 999999;

function enWords(value: number): string | null {
  if (!Number.isInteger(value) || value < 0 || value > MAX_VALUE) return null;
  if (value < 20) return EN_ONES[value];
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return ones ? `${EN_TENS[tens]} ${EN_ONES[ones]}` : EN_TENS[tens];
  }
  if (value < 1000) {
    const head = EN_ONES[Math.floor(value / 100)];
    const rest = value % 100;
    return rest ? `${head} hundred ${enWords(rest)}` : `${head} hundred`;
  }
  const head = enWords(Math.floor(value / 1000));
  if (!head) return null;
  const rest = value % 1000;
  return rest ? `${head} thousand ${enWords(rest)}` : `${head} thousand`;
}

function deWords(value: number): string | null {
  if (!Number.isInteger(value) || value < 0 || value > MAX_VALUE) return null;
  if (value < 20) return DE_ONES[value];
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    if (!ones) return DE_TENS[tens];
    return `${ones === 1 ? "ein" : DE_ONES[ones]}und${DE_TENS[tens]}`;
  }
  if (value < 1000) {
    const head = Math.floor(value / 100) === 1 ? "ein" : DE_ONES[Math.floor(value / 100)];
    const rest = value % 100;
    return rest ? `${head}hundert${deWords(rest)}` : `${head}hundert`;
  }
  const head = deWords(Math.floor(value / 1000));
  if (!head) return null;
  const rest = value % 1000;
  return rest ? `${head}tausend${deWords(rest)}` : `${head}tausend`;
}

function isLetter(character: string): boolean {
  return character !== "" && /\p{L}/u.test(character);
}

export function numbersToWords(text: string, lang: string): string {
  const source = String(text ?? "");
  const parts = source.split(/(\d+)/);
  if (parts.length === 1) return source;

  const toWords = String(lang ?? "").toLowerCase().startsWith("de") ? deWords : enWords;
  let out = "";

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!/^\d+$/.test(part)) {
      out += part;
      continue;
    }
    const before = i > 0 ? parts[i - 1].slice(-1) : "";
    const after = i + 1 < parts.length ? parts[i + 1].charAt(0) : "";
    const words = toWords(Number(part));
    out += words && !isLetter(before) && !isLetter(after) ? words : part;
  }

  return out;
}
