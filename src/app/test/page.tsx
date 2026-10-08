import { requireSession } from "@/lib/session";
import { loadVocabulary } from "@/lib/vocabulary";
import TestScreen from "@/components/screens/TestScreen";

export default async function TestPage() {
  const [session, words] = await Promise.all([requireSession(), loadVocabulary()]);
  return <TestScreen name={session.name} words={words} />;
}
