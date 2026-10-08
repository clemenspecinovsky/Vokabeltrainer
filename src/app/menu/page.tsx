import { requireSession } from "@/lib/session";
import MenuScreen from "@/components/screens/MenuScreen";

export default async function MenuPage() {
  const session = await requireSession();
  return <MenuScreen name={session.name} />;
}
