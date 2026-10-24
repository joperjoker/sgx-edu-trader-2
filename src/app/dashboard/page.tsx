import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import {
  getAppSettings,
  getMarketSnapshot,
  getWeeklyChallenges,
} from "@/lib/firebase/store";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [settings, snapshot, challenges] = await Promise.all([
    getAppSettings(),
    getMarketSnapshot(),
    getWeeklyChallenges(),
  ]);

  if (
    settings.maintenanceMode &&
    user.role !== "teacher" &&
    user.role !== "superadmin"
  ) {
    redirect("/maintenance");
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const matchingChallenge =
    challenges.find(
      (c) =>
        user.classGroupIds.includes(c.classGroupId) &&
        c.weekStart <= todayIso &&
        todayIso <= c.weekEnd,
    ) ??
    challenges[0] ??
    null;

  return (
    <DashboardClient
      initialUser={user}
      initialSnapshot={snapshot}
      activeChallenge={matchingChallenge}
    />
  );
}
