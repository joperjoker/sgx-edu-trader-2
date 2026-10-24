import type { Metadata } from "next";
import { getAppSettings, getClassGroups, getMarketSnapshot } from "@/lib/firebase/store";
import LaunchClient from "./LaunchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Google Sites & Cloud Run Launch Center · EduFinLit",
  description:
    "Deploy EduFinLit to Google Cloud Run / Firebase App Hosting and generate a full-page embed for Google Sites.",
};

export default async function LaunchPage() {
  const [settings, classes, snapshot] = await Promise.all([
    getAppSettings(),
    getClassGroups(),
    getMarketSnapshot(),
  ]);

  const activeClasses = classes
    .filter((c) => c.isActive)
    .map((c) => ({ name: c.name, code: c.joinCode }));

  return (
    <LaunchClient
      schoolName={settings.schoolName || "Singapore Academy of Finance"}
      semester={settings.currentSemester || "2026-S2"}
      tickersCount={Object.keys(snapshot.quotes).length || 20}
      classCodes={activeClasses}
    />
  );
}
