"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import { getClassGroups, upsertUserProfile } from "@/lib/firebase/store";

export interface OnboardingResult {
  success: boolean;
  error?: string;
  data?: {
    joinedClassName?: string;
  };
}

export async function completeOnboardingAction(args: {
  nickname: string;
  classJoinCode?: string;
}): Promise<OnboardingResult> {
  const user = await getServerSessionUser();
  if (!user) {
    return { success: false, error: "Not signed in." };
  }

  const cleanNickname = args.nickname.trim().slice(0, 32) || user.nickname;
  const joinCode = (args.classJoinCode ?? "").trim().toUpperCase();

  let updatedClassIds = [...user.classGroupIds];
  let joinedClassName: string | undefined;

  if (joinCode.length > 0) {
    const classes = await getClassGroups();
    const matched = classes.find(
      (c) => c.isActive && c.joinCode.toUpperCase() === joinCode,
    );
    if (!matched) {
      return {
        success: false,
        error: `Class Join Code "${joinCode}" was not found. Try "SGX4E1" or "SGXJC1", or leave blank.`,
      };
    }
    if (!updatedClassIds.includes(matched.id)) {
      updatedClassIds = [matched.id, ...updatedClassIds];
    }
    joinedClassName = matched.name;
  }

  const now = new Date().toISOString();
  await upsertUserProfile({
    ...user,
    nickname: cleanNickname,
    classGroupIds: updatedClassIds,
    acceptedTermsAt: user.acceptedTermsAt ?? now,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  revalidatePath("/leaderboard");

  return {
    success: true,
    data: { joinedClassName },
  };
}

export async function markTutorialCompleteAction(): Promise<{
  success: boolean;
}> {
  const user = await getServerSessionUser();
  if (!user) return { success: false };

  await upsertUserProfile({
    ...user,
    hasCompletedTutorial: true,
  });

  revalidatePath("/company/[ticker]", "page");
  return { success: true };
}
