import { redirect } from "next/navigation";
import { getSession, requireSession } from "./session";
import { findUserById } from "./vocabulary";
import type { StoredUser } from "./types";

export async function getSessionUser(): Promise<StoredUser | null> {
  const session = await getSession();
  if (!session) return null;
  return findUserById(session.uid);
}

export async function requireUser(): Promise<StoredUser> {
  const session = await requireSession();
  const user = await findUserById(session.uid);
  if (!user) redirect("/");
  return user;
}
