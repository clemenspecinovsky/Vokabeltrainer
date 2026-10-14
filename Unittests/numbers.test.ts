import { describe, expect, it } from "vitest";
import { numbersToWords } from "../src/lib/numbers";

describe("numbersToWords – English", () => {
  it("spells small numbers", () => {
    expect(numbersToWords("0", "en-US")).toBe("zero");
    expect(numbersToWords("7", "en-US")).toBe("seven");
    expect(numbersToWords("13", "en-US")).toBe("thirteen");
    expect(numbersToWords("20", "en-US")).toBe("twenty");
    expect(numbersToWords("21", "en-US")).toBe("twenty one");
    expect(numbersToWords("99", "en-US")).toBe("ninety nine");
  });

  it("spells hundreds and thousands", () => {
    expect(numbersToWords("100", "en-US")).toBe("one hundred");
    expect(numbersToWords("123", "en-US")).toBe("one hundred twenty three");
    expect(numbersToWords("1000", "en-US")).toBe("one thousand");
    expect(numbersToWords("1234", "en-US")).toBe("one thousand two hundred thirty four");
    expect(numbersToWords("999999", "en-US")).toBe(
      "nine hundred ninety nine thousand nine hundred ninety nine",
    );
  });

  it("keeps numbers glued to letters", () => {
    expect(numbersToWords("abc123", "en-US")).toBe("abc123");
    expect(numbersToWords("123abc", "en-US")).toBe("123abc");
  });

  it("replaces numbers inside a sentence", () => {
    expect(numbersToWords("I have 2 cats", "en-US")).toBe("I have two cats");
  });

  it("glues numbers to letters on either side", () => {
    expect(numbersToWords("1a2", "en-US")).toBe("1a2");
    expect(numbersToWords("2x", "en-US")).toBe("2x");
    expect(numbersToWords("y3", "en-US")).toBe("y3");
  });

  it("keeps out-of-range numbers untouched", () => {
    expect(numbersToWords("1000000", "en-US")).toBe("1000000");
  });

  it("returns text unchanged when there is no digit", () => {
    expect(numbersToWords("hello", "en-US")).toBe("hello");
  });
});

describe("numbersToWords – German", () => {
  it("spells numbers the German way", () => {
    expect(numbersToWords("0", "de-DE")).toBe("null");
    expect(numbersToWords("21", "de-DE")).toBe("einundzwanzig");
    expect(numbersToWords("42", "de-DE")).toBe("zweiundvierzig");
    expect(numbersToWords("100", "de-DE")).toBe("einhundert");
    expect(numbersToWords("1000", "de-DE")).toBe("einstausend");
    expect(numbersToWords("1234", "de-DE")).toBe("einstausendzweihundertvierunddreißig");
  });

  it("uses 'ein' in the tens and hundreds", () => {
    expect(numbersToWords("31", "de-DE")).toBe("einunddreißig");
    expect(numbersToWords("101", "de-DE")).toBe("einhunderteins");
  });

  it("keeps out-of-range numbers untouched", () => {
    expect(numbersToWords("1000000", "de-DE")).toBe("1000000");
  });
});
