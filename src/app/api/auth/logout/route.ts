import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";

export function POST(request: NextRequest) {
  // CSRF: Validate Origin header
  const originError = validateOrigin(request);
  if (originError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "CSRF_VIOLATION", message: "Cross-origin request blocked" },
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
