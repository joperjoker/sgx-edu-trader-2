import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/constants";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/copilot",
  "/company",
  "/portfolio",
  "/leaderboard",
  "/admin",
];

function extractRoleFromCookie(rawCookie: string): string | null {
  try {
    const normalized = rawCookie.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json) as { role?: string };
    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    (pathname === "/admin" || pathname.startsWith("/admin/")) &&
    sessionCookie
  ) {
    const role = extractRoleFromCookie(sessionCookie);
    if (role === "student") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (pathname === "/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
