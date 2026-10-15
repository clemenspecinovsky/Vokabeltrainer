import { sortActivityDesc } from "@/lib/activity";
import { WordProgress } from "@/lib/progress";
import { requireUser } from "@/lib/user";
import { loadVocabulary } from "@/lib/vocabulary";
import SettingsScreen from "@/components/screens/SettingsScreen";

export default async function SettingsPage() {
  const [user, words] = await Promise.all([requireUser(), loadVocabulary()]);
  const progress = new WordProgress(
    words.map((word) => word.id),
    user.progress,
  );
  return (
    <SettingsScreen
      name={user.displayName}
      username={user.username}
      avatarId={user.avatar ?? null}
      avatarImage={user.avatarImage ?? null}
      avatarMode={user.avatarMode ?? null}
      history={sortActivityDesc(user.history ?? [])}
      progressPercent={progress.percent()}
      achievements={user.achievements ?? []}
    />
  );
}
