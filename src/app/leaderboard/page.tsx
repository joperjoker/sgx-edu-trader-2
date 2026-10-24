import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import { getAllUsers, getAppSettings } from "@/lib/firebase/store";
import LeaderboardClient, {
  type LeaderboardStudentRow,
} from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [settings, allUsers] = await Promise.all([
    getAppSettings(),
    getAllUsers(),
  ]);

  if (
    settings.maintenanceMode &&
    user.role !== "teacher" &&
    user.role !== "superadmin"
  ) {
    redirect("/maintenance");
  }

  const students: LeaderboardStudentRow[] = allUsers
    .filter((u) => u.role === "student")
    .map((u) => ({
      uid: u.uid,
      nickname: u.nickname || u.email.split("@")[0] || "Trader",
      netValue: u.netValue,
      startingCapital: u.startingCapital || 10000,
      totalFeesPaid: u.totalFeesPaid,
      hhi: u.hhi ?? 1,
      achievementCount: u.achievementCount ?? 0,
    }));

  return (
    <LeaderboardClient
      students={students}
      currentUserId={user.uid}
      mode={settings.leaderboardMode}
    />
  );
}
