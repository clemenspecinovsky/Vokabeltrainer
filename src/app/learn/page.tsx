import { requireSession } from "@/lib/session";
import { loadVocabulary } from "@/lib/vocabulary";
import LearnScreen from "@/components/screens/LearnScreen";

export default async function LearnPage() {
  const [session, words] = await Promise.all([requireSession(), loadVocabulary()]);
  return <LearnScreen name={session.name} words={words} />;
}
