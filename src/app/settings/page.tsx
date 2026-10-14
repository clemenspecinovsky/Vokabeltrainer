import { requireUser } from "@/lib/user";
import SettingsScreen from "@/components/screens/SettingsScreen";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <SettingsScreen
      name={user.displayName}
      username={user.username}
      avatarId={user.avatar ?? null}
      avatarImage={user.avatarImage ?? null}
      avatarMode={user.avatarMode ?? null}
    />
  );
}
