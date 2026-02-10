import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      },
      { status: 401 }
    );
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, data: user });
}
