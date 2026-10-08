import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { loadVocabulary } from "@/lib/vocabulary";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const vocabulary = await loadVocabulary();
  return NextResponse.json({ count: vocabulary.length, vocabulary });
}
