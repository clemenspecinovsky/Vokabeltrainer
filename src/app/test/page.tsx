import { requireUser } from "@/lib/user";
import { loadVocabulary } from "@/lib/vocabulary";
import TestScreen from "@/components/screens/TestScreen";

export default async function TestPage() {
  const [user, words] = await Promise.all([requireUser(), loadVocabulary()]);
  return (
    <TestScreen
      name={user.displayName}
      words={words}
      progress={user.progress ?? null}
      avatarId={user.avatar ?? null}
      avatarImage={user.avatarImage ?? null}
      avatarMode={user.avatarMode ?? null}
    />
  );
}
