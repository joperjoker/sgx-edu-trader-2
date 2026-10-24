import { cookies } from "next/headers";
import type { UserProfileDoc, UserRole } from "@/types/firestore";
import { getEnvStatus } from "@/utils/env-check";
import { getAdminAuth, isLiveFirestoreReady } from "./admin";
import { SESSION_COOKIE_NAME } from "./constants";
import {
  getUserByEmail,
  getUserProfile,
  readLocalDb,
  upsertUserProfile,
} from "./store";

export { SESSION_COOKIE_NAME };

export interface SessionTokenPayload {
  uid: string;
  email: string;
  name?: string;
  picture?: string | null;
  role?: UserRole;
  mode: "firebase" | "google_classroom_demo";
}

function encodeDemoSession(payload: SessionTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeDemoSession(raw: string): SessionTokenPayload | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as SessionTokenPayload;
    if (parsed && typeof parsed.uid === "string" && typeof parsed.email === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveInitialRole(email: string): UserRole {
  const clean = email.trim().toLowerCase();
  const env = getEnvStatus();
  if (env.superadminEmails.includes(clean)) return "superadmin";
  if (env.teacherEmails.includes(clean)) return "teacher";

  const local = readLocalDb();
  const preauth = local.preauthorizedUsers[clean];
  if (preauth) return preauth.role;

  return "student";
}

export async function provisionOrLoadUser(params: {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<UserProfileDoc> {
  const cleanEmail = params.email.trim().toLowerCase();
  const existingByUid = await getUserProfile(params.uid);
  const now = new Date().toISOString();

  if (existingByUid) {
    const updated: UserProfileDoc = {
      ...existingByUid,
      email: cleanEmail,
      photoURL: params.photoURL ?? existingByUid.photoURL,
      lastLoginAt: now,
    };
    await upsertUserProfile(updated);
    return updated;
  }

  const existingByEmail = await getUserByEmail(cleanEmail);
  if (existingByEmail) {
    const updated: UserProfileDoc = {
      ...existingByEmail,
      photoURL: params.photoURL ?? existingByEmail.photoURL,
      lastLoginAt: now,
    };
    await upsertUserProfile(updated);
    return updated;
  }

  const local = readLocalDb();
  const preauth = local.preauthorizedUsers[cleanEmail];
  const role = resolveInitialRole(cleanEmail);
  const defaultNickname =
    preauth?.nickname ||
    params.displayName?.trim() ||
    cleanEmail.split("@")[0] ||
    "Trader";

  const initialClassGroups = preauth?.classGroupId
    ? [preauth.classGroupId]
    : ["class-sec4-express-a"];

  const newUser: UserProfileDoc = {
    uid: params.uid,
    email: cleanEmail,
    nickname: defaultNickname,
    photoURL: params.photoURL ?? null,
    role,
    classGroupIds: initialClassGroups,
    startingCapital: 10000,
    cashBalance: 10000,
    holdingsValue: 0,
    netValue: 10000,
    totalFeesPaid: 0,
    hhi: 1,
    tradingLocked: false,
    coolingOffUntil: null,
    hasCompletedTutorial: false,
    acceptedTermsAt: null,
    achievementCount: 0,
    achievements: {},
    createdAt: now,
    lastLoginAt: now,
  };

  await upsertUserProfile(newUser);
  return newUser;
}

export async function createSessionCookieValue(params: {
  idToken?: string;
  demoEmail?: string;
  demoName?: string;
  demoPicture?: string | null;
}): Promise<{ cookieValue: string; user: UserProfileDoc }> {
  if (params.idToken && isLiveFirestoreReady()) {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(params.idToken);
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(params.idToken, {
      expiresIn,
    });
    const user = await provisionOrLoadUser({
      uid: decoded.uid,
      email: decoded.email ?? `${decoded.uid}@gmail.com`,
      displayName: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
    });
    return { cookieValue: sessionCookie, user };
  }

  if (params.idToken) {
    // Decode Firebase JWT payload even when Admin service account JSON is not yet set
    const parts = params.idToken.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8"),
      ) as {
        user_id?: string;
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
      };
      const uid = payload.user_id ?? payload.sub ?? `gmail-${Date.now()}`;
      const email = payload.email ?? "student1@gmail.com";
      const user = await provisionOrLoadUser({
        uid,
        email,
        displayName: payload.name ?? null,
        photoURL: payload.picture ?? null,
      });
      const cookieValue = encodeDemoSession({
        uid: user.uid,
        email: user.email,
        name: user.nickname,
        picture: user.photoURL,
        role: user.role,
        mode: "google_classroom_demo",
      });
      return { cookieValue, user };
    }
  }

  const email = (params.demoEmail ?? "student1@gmail.com").trim().toLowerCase();
  const existing = await getUserByEmail(email);
  const uid =
    existing?.uid ??
    `gmail-${email.replace(/[^a-z0-9]/g, "-")}`;
  const user = await provisionOrLoadUser({
    uid,
    email,
    displayName: params.demoName ?? existing?.nickname ?? null,
    photoURL: params.demoPicture ?? existing?.photoURL ?? null,
  });

  const cookieValue = encodeDemoSession({
    uid: user.uid,
    email: user.email,
    name: user.nickname,
    picture: user.photoURL,
    role: user.role,
    mode: "google_classroom_demo",
  });

  return { cookieValue, user };
}

export async function getServerSessionUser(): Promise<UserProfileDoc | null> {
  const cookieStore = cookies();
  const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawCookie) return null;

  const demoDecoded = decodeDemoSession(rawCookie);
  if (demoDecoded) {
    const profile = await getUserProfile(demoDecoded.uid);
    if (profile) return profile;
    return provisionOrLoadUser({
      uid: demoDecoded.uid,
      email: demoDecoded.email,
      displayName: demoDecoded.name,
      photoURL: demoDecoded.picture,
    });
  }

  if (isLiveFirestoreReady()) {
    try {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifySessionCookie(rawCookie, true);
      return await provisionOrLoadUser({
        uid: decoded.uid,
        email: decoded.email ?? `${decoded.uid}@gmail.com`,
        displayName: decoded.name ?? null,
        photoURL: decoded.picture ?? null,
      });
    } catch {
      return null;
    }
  }

  return null;
}
