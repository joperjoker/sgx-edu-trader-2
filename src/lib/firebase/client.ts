import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export function isFirebaseBrowserConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      !firebaseConfig.apiKey.includes("your_firebase") &&
      !firebaseConfig.projectId.includes("your-project"),
  );
}

let cachedApp: FirebaseApp | null = null;

export function getFirebaseBrowserApp(): FirebaseApp | null {
  if (!isFirebaseBrowserConfigured()) return null;
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getFirebaseBrowserAuth(): Auth | null {
  const app = getFirebaseBrowserApp();
  if (!app) return null;
  return getAuth(app);
}

export function getFirebaseBrowserDb(): Firestore | null {
  const app = getFirebaseBrowserApp();
  if (!app) return null;
  return getFirestore(app);
}

export function createGoogleOAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({
    prompt: "select_account",
  });
  return provider;
}
