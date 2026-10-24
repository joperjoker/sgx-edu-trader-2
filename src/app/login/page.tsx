import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getServerSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sgx-canvas flex items-center justify-center text-sm text-slate-500">
          Loading EduFinLit…
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
