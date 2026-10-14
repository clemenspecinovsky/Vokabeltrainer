import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesGet = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: cookiesGet })) }));

const redirectMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import {
  SESSION_COOKIE,
  createSessionToken,
  getSession,
  requireSession,
  sessionCookieOptions,
  verifySessionToken,
} from "../src/lib/session";

beforeEach(() => {
  cookiesGet.mockReset();
  redirectMock.mockReset();
});

describe("session tokens", () => {
  it("round-trips a payload", async () => {
    const token = await createSessionToken({ id: "u1", displayName: "Ronja" });
    const data = await verifySessionToken(token);
    expect(data?.uid).toBe("u1");
    expect(data?.name).toBe("Ronja");
    expect(typeof data?.exp).toBe("number");
  });

  it("rejects a tampered signature", async () => {
    const token = await createSessionToken({ id: "u1", displayName: "Ronja" });
    const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects missing or malformed tokens", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken(null)).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("garbage")).toBeNull();
    expect(await verifySessionToken("a.b.c")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await createSessionToken({ id: "u1", displayName: "Ronja" });
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000));
      expect(await verifySessionToken(token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("session cookie", () => {
  it("uses the expected name and options", () => {
    expect(SESSION_COOKIE).toBe("vokabel_session");
    expect(sessionCookieOptions.httpOnly).toBe(true);
    expect(sessionCookieOptions.path).toBe("/");
    expect(sessionCookieOptions.sameSite).toBe("lax");
    expect(sessionCookieOptions.maxAge).toBeGreaterThan(0);
  });
});

describe("getSession / requireSession", () => {
  it("reads a valid session from the cookie", async () => {
    const token = await createSessionToken({ id: "u1", displayName: "Ronja" });
    cookiesGet.mockReturnValue({ value: token });

    const session = await getSession();

    expect(session?.uid).toBe("u1");
    expect(cookiesGet).toHaveBeenCalledWith(SESSION_COOKIE);
  });

  it("returns null without a cookie", async () => {
    cookiesGet.mockReturnValue(undefined);

    expect(await getSession()).toBeNull();
  });

  it("returns the session when present", async () => {
    const token = await createSessionToken({ id: "u1", displayName: "Ronja" });
    cookiesGet.mockReturnValue({ value: token });

    expect((await requireSession()).uid).toBe("u1");
  });

  it("redirects when there is no session", async () => {
    cookiesGet.mockReturnValue(undefined);

    await requireSession();

    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
