import { NextResponse, type NextRequest } from "next/server";
import {
  validateCredentials,
  signToken,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
} from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
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

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_INPUT", message: "Email and password required" },
        },
        { status: 400 }
      );
    }

    const user = await validateCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        },
        { status: 401 }
      );
    }

    const token = await signToken(user);
    const response = NextResponse.json({ success: true, data: user });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
