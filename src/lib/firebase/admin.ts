import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App as AdminApp,
} from "firebase-admin/app";
import { getAuth as getAdminAuthSdk, type Auth as AdminAuth } from "firebase-admin/auth";
import {
  getFirestore as getAdminFirestoreSdk,
  type Firestore as AdminFirestore,
} from "firebase-admin/firestore";
import { getEnvStatus } from "@/utils/env-check";

// NEVER log FIREBASE_SERVICE_ACCOUNT_JSON anywhere.
let adminAppInstance: AdminApp | null = null;

export function isLiveFirestoreReady(): boolean {
  return getEnvStatus().isFirebaseAdminConfigured;
}

export function getFirebaseAdminApp(): AdminApp {
  if (adminAppInstance) return adminAppInstance;
  if (getApps().length > 0) {
    adminAppInstance = getApp();
    return adminAppInstance;
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "";
  if (rawServiceAccount.trim().startsWith("{")) {
    const parsed = JSON.parse(rawServiceAccount) as Record<string, string>;
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    adminAppInstance = initializeApp({
      credential: cert(parsed),
      projectId:
        parsed.project_id ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    return adminAppInstance;
  }

  adminAppInstance = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sgx-edu-trader-2",
  });
  return adminAppInstance;
}

export function getAdminDb(): AdminFirestore {
  return getAdminFirestoreSdk(getFirebaseAdminApp());
}

export function getAdminAuth(): AdminAuth {
  return getAdminAuthSdk(getFirebaseAdminApp());
}
