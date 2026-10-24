import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookieValue,
  getServerSessionUser,
  SESSION_COOKIE_NAME,
} from "@/lib/firebase/auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getServerSessionUser();
  return NextResponse.json({
    authenticated: Boolean(user),
    user,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      idToken?: string;
      demoEmail?: string;
      demoName?: string;
      demoPicture?: string | null;
    };

    const { cookieValue, user } = await createSessionCookieValue({
      idToken: body.idToken,
      demoEmail: body.demoEmail,
      demoName: body.demoName,
      demoPicture: body.demoPicture,
    });

    const response = NextResponse.json({
      success: true,
      user,
    });

    const isHttps =
      req.nextUrl.protocol === "https:" ||
      req.headers.get("x-forwarded-proto") === "https";

    response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 5, // 5 days
    });

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create Google session.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const isHttps =
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
