import { describe, expect, it } from "vitest";
import { hashPassword, isHashed, verifyPassword } from "../src/lib/password";

describe("isHashed", () => {
  it("detects scrypt hashes", () => {
    expect(isHashed("scrypt$16384$8$1$abc$def")).toBe(true);
    expect(isHashed("plain")).toBe(false);
    expect(isHashed(undefined)).toBe(false);
    expect(isHashed(null)).toBe(false);
  });
});

describe("hashPassword", () => {
  it("produces a well-formed scrypt hash", async () => {
    const hash = await hashPassword("geheim");
    expect(hash.startsWith("scrypt$")).toBe(true);
    const parts = hash.split("$");
    expect(parts).toHaveLength(6);
    expect(parts[0]).toBe("scrypt");
    expect(Number(parts[1])).toBe(16384);
    expect(Number(parts[2])).toBe(8);
    expect(Number(parts[3])).toBe(1);
    expect(parts[4].length).toBeGreaterThan(0);
    expect(parts[5].length).toBeGreaterThan(0);
  });

  it("uses a fresh salt every time", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });
});

describe("verifyPassword", () => {
  it("accepts the correct password", async () => {
    const hash = await hashPassword("1234");
    expect(await verifyPassword("1234", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("1234");
    expect(await verifyPassword("4321", hash)).toBe(false);
  });

  it("supports legacy plaintext passwords", async () => {
    expect(await verifyPassword("super", "super")).toBe(true);
    expect(await verifyPassword("wrong", "super")).toBe(false);
  });

  it("rejects when nothing is stored", async () => {
    expect(await verifyPassword("x", undefined)).toBe(false);
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
  });

  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("x", "scrypt$1$2$3$4")).toBe(false);
    expect(await verifyPassword("x", "scrypt$a$b$c$d$e")).toBe(false);
  });

  it("rejects unsafe scrypt parameters", async () => {
    expect(await verifyPassword("x", "scrypt$1$8$1$AAAA$AAAA")).toBe(false);
  });

  it("rejects a hash with an empty salt or key", async () => {
    expect(await verifyPassword("x", "scrypt$16384$8$1$$AAAA")).toBe(false);
    expect(await verifyPassword("x", "scrypt$16384$8$1$AAAA$")).toBe(false);
  });

  it("rejects a tampered key", async () => {
    const hash = await hashPassword("1234");
    const parts = hash.split("$");
    parts[5] = (parts[5].startsWith("A") ? "B" : "A") + parts[5].slice(1);
    expect(await verifyPassword("1234", parts.join("$"))).toBe(false);
  });
});
