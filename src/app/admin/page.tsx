import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import {
  getAllReflections,
  getAllTradeHistory,
  getAllUsers,
  getAppSettings,
  getClassGroups,
  getMarketSnapshot,
  getWeeklyChallenges,
} from "@/lib/firebase/store";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "teacher" && user.role !== "superadmin") {
    redirect("/dashboard");
  }

  const [
    settings,
    users,
    classes,
    challenges,
    trades,
    reflections,
    snapshot,
  ] = await Promise.all([
    getAppSettings(),
    getAllUsers(),
    getClassGroups(),
    getWeeklyChallenges(),
    getAllTradeHistory(200),
    getAllReflections(),
    getMarketSnapshot(),
  ]);

  return (
    <AdminClient
      currentUser={user}
      settings={settings}
      users={users}
      classes={classes}
      challenges={challenges}
      trades={trades}
      reflections={reflections}
      marketUpdatedAt={snapshot.updatedAt}
    />
  );
}
