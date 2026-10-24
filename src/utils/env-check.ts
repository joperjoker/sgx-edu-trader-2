export interface EnvStatus {
  isFirebaseClientConfigured: boolean;
  isFirebaseAdminConfigured: boolean;
  isGeminiConfigured: boolean;
  cronSecret: string;
  superadminEmails: string[];
  teacherEmails: string[];
  schoolName: string;
  appName: string;
}

export function getEnvStatus(): EnvStatus {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";

  const isFirebaseClientConfigured = Boolean(
    apiKey &&
      projectId &&
      !apiKey.includes("your_firebase") &&
      !projectId.includes("your-project"),
  );

  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ??
    "";
  const isFirebaseAdminConfigured = Boolean(
    serviceAccountJson.trim().startsWith("{") && isFirebaseClientConfigured,
  );

  const geminiKey = process.env.GEMINI_API_KEY ?? "";
  const isGeminiConfigured = Boolean(
    geminiKey && !geminiKey.includes("your_gemini"),
  );

  const superadminEmails = (
    process.env.SUPERADMIN_EMAILS ??
    process.env.SUPERADMIN_EMAIL ??
    "medthilda.teo.qing.cong@gmail.com,admin@sgxedu.sg,eugene@sgxedu.sg"
  )
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const teacherEmails = (process.env.TEACHER_EMAILS ?? "teacher@sgxedu.sg")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return {
    isFirebaseClientConfigured,
    isFirebaseAdminConfigured,
    isGeminiConfigured,
    cronSecret:
      process.env.CRON_SECRET ??
      "e68924bc5f0802f810b48f0c03d25941baad0f5627f74b54acba08227fe27beb",
    superadminEmails,
    teacherEmails,
    schoolName:
      process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "Singapore Academy of Finance",
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "EFL · EduFinLit",
  };
}

export function validateEnv(): EnvStatus {
  return getEnvStatus();
}
