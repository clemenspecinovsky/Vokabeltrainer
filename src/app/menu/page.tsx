import { WordProgress } from "@/lib/progress";
import { requireUser } from "@/lib/user";
import { loadVocabulary } from "@/lib/vocabulary";
import MenuScreen from "@/components/screens/MenuScreen";

export default async function MenuPage() {
  const [user, words] = await Promise.all([requireUser(), loadVocabulary()]);
  const progress = new WordProgress(
    words.map((word) => word.id),
    user.progress,
  );
  return (
    <MenuScreen
      name={user.displayName}
      avatarId={user.avatar ?? null}
      avatarImage={user.avatarImage ?? null}
      avatarMode={user.avatarMode ?? null}
      progressPercent={progress.percent()}
      learnedCount={progress.learnedCount()}
      wordCount={words.length}
    />
  );
}
