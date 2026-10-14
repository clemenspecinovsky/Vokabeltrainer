import { describe, expect, it } from "vitest";
import { canonicalize, isCorrect, possibleAnswers } from "../src/lib/answers";

describe("isCorrect", () => {
  it("accepts an exact match", () => {
    expect(isCorrect("house", "house")).toBe(true);
  });

  it("ignores case and surrounding punctuation", () => {
    expect(isCorrect("House", "house")).toBe(true);
    expect(isCorrect("hello!", "hello")).toBe(true);
  });

  it("ignores leading articles both ways", () => {
    expect(isCorrect("the house", "house", "en-US")).toBe(true);
    expect(isCorrect("house", "the house", "en-US")).toBe(true);
    expect(isCorrect("das Haus", "Haus", "de-DE")).toBe(true);
  });

  it("ignores the English infinitive 'to'", () => {
    expect(isCorrect("run", "to run", "en-US")).toBe(true);
    expect(isCorrect("to run", "run", "en-US")).toBe(true);
  });

  it("accepts umlaut spellings without diacritics", () => {
    expect(isCorrect("schon", "schön", "de-DE")).toBe(true);
    expect(isCorrect("schoen", "schön", "de-DE")).toBe(true);
    expect(isCorrect("gruen", "grün", "de-DE")).toBe(true);
  });

  it("treats ss and ß as equal", () => {
    expect(isCorrect("strasse", "Straße", "de-DE")).toBe(true);
    expect(isCorrect("straße", "strasse", "de-DE")).toBe(true);
  });

  it("accepts comma-separated alternatives", () => {
    expect(isCorrect("hi", "hello, hi", "en-US")).toBe(true);
    expect(isCorrect("hello", "hello, hi", "en-US")).toBe(true);
  });

  it("accepts slash-separated alternatives", () => {
    expect(isCorrect("colour", "color/colour", "en-US")).toBe(true);
    expect(isCorrect("color", "color/colour", "en-US")).toBe(true);
  });

  it("accepts a number written as words", () => {
    expect(isCorrect("three", "3", "en-US")).toBe(true);
    expect(isCorrect("3", "3", "en-US")).toBe(true);
    expect(isCorrect("twenty one", "21", "en-US")).toBe(true);
  });

  it("rejects a wrong answer", () => {
    expect(isCorrect("cat", "dog")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isCorrect("", "house")).toBe(false);
    expect(isCorrect("   ", "house")).toBe(false);
  });

  it("ignores parenthetical notes", () => {
    expect(isCorrect("house", "house (building)", "en-US")).toBe(true);
  });

  it("treats hyphenated and spaced forms as equal", () => {
    expect(isCorrect("well known", "well-known", "en-US")).toBe(true);
  });

  it("accepts a number as words or digits in both directions", () => {
    expect(isCorrect("3", "three", "en-US")).toBe(true);
    expect(isCorrect("three", "3", "en-US")).toBe(true);
  });
});

describe("canonicalize", () => {
  it("normalizes case and articles", () => {
    expect(canonicalize("The House")).toBe("house");
  });
});

describe("possibleAnswers", () => {
  it("expands alternatives into a set of accepted forms", () => {
    const answers = possibleAnswers("hello, hi", "en-US");
    expect(answers).toContain("hello");
    expect(answers).toContain("hi");
  });
});
