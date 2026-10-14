import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionMock = vi.hoisted(() => ({ getSession: vi.fn(), requireSession: vi.fn() }));
vi.mock("@/lib/session", () => sessionMock);

const vocabMock = vi.hoisted(() => ({ findUserById: vi.fn() }));
vi.mock("@/lib/vocabulary", () => vocabMock);

const redirectMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { getSession } from "@/lib/session";
import type { StoredUser } from "@/lib/types";
import { findUserById } from "@/lib/vocabulary";
import { getSessionUser, requireUser } from "../src/lib/user";

const ronja: StoredUser = { id: "ronja", username: "ronja", displayName: "Ronja" };

beforeEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(findUserById).mockReset();
  redirectMock.mockReset();
});

describe("getSessionUser", () => {
  it("returns null without a session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    expect(await getSessionUser()).toBeNull();
    expect(findUserById).not.toHaveBeenCalled();
  });

  it("returns the user for a session", async () => {
    vi.mocked(getSession).mockResolvedValue({ uid: "ronja", name: "Ronja", exp: 1 });
    vi.mocked(findUserById).mockResolvedValue(ronja);

    expect(await getSessionUser()).toEqual(ronja);
    expect(findUserById).toHaveBeenCalledWith("ronja");
  });

  it("returns null when the user no longer exists", async () => {
    vi.mocked(getSession).mockResolvedValue({ uid: "ghost", name: "Geist", exp: 1 });
    vi.mocked(findUserById).mockResolvedValue(null);

    expect(await getSessionUser()).toBeNull();
  });
});

describe("requireUser", () => {
  it("returns the user", async () => {
    vi.mocked(sessionMock.requireSession).mockResolvedValue({ uid: "ronja", name: "Ronja", exp: 1 });
    vi.mocked(findUserById).mockResolvedValue(ronja);

    expect(await requireUser()).toEqual(ronja);
  });

  it("redirects home when the user is missing", async () => {
    vi.mocked(sessionMock.requireSession).mockResolvedValue({ uid: "ghost", name: "Geist", exp: 1 });
    vi.mocked(findUserById).mockResolvedValue(null);

    await requireUser();

    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
