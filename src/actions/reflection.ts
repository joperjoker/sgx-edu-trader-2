"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import { getAppSettings, saveReflection } from "@/lib/firebase/store";

export async function submitWeeklyReflectionAction(args: {
  weekNumber: number;
  promptQuestion: string;
  responseText: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Not signed in." };

  const cleanText = args.responseText.trim();
  if (cleanText.length < 15) {
    return {
      success: false,
      error: "Please write at least 15 characters reflecting on your investment strategy.",
    };
  }

  const settings = await getAppSettings();
  const id = `refl-${user.uid}-w${args.weekNumber}`;

  await saveReflection({
    id,
    userId: user.uid,
    userEmail: user.email,
    userNickname: user.nickname,
    classGroupId: user.classGroupIds[0] ?? null,
    weekNumber: args.weekNumber,
    semester: settings.currentSemester || "2026-S2",
    promptQuestion: args.promptQuestion,
    responseText: cleanText,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/portfolio");
  revalidatePath("/admin");

  return { success: true };
}
