import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/firebase/auth-session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getServerSessionUser();
  if (user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
