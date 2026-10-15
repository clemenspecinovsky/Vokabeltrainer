import { requireUser } from "@/lib/user";
import { loadVocabulary } from "@/lib/vocabulary";
import LearnScreen from "@/components/screens/LearnScreen";

export default async function LearnPage() {
  const [user, words] = await Promise.all([requireUser(), loadVocabulary()]);
  return (
    <LearnScreen
      name={user.displayName}
      words={words}
      progress={user.progress ?? null}
      avatarId={user.avatar ?? null}
      avatarImage={user.avatarImage ?? null}
      avatarMode={user.avatarMode ?? null}
    />
  );
}
