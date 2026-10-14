import { requireUser } from "@/lib/user";
import MenuScreen from "@/components/screens/MenuScreen";

export default async function MenuPage() {
  const user = await requireUser();
  return (
    <MenuScreen
      name={user.displayName}
      avatarId={user.avatar ?? null}
      avatarImage={user.avatarImage ?? null}
      avatarMode={user.avatarMode ?? null}
    />
  );
}
