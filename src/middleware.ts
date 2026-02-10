import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

/**
 * Edge-compatible authentication middleware.
 *
 * Priority:
 *   1. App JWT (fugue-auth cookie) — HS256 signed by AUTH_SECRET
 *   2. Cloudflare Access JWT (CF_Authorization) — optional layer
 *   3. Redirect to /login
 */

const AUTH_SECRET = process.env.AUTH_SECRET ?? "";
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);

const CF_TEAM_NAME = process.env.NEXT_PUBLIC_CF_TEAM_NAME ?? "fugue";
const CF_ACCESS_AUD = process.env.CF_ACCESS_AUD ?? "";

/** JWKS endpoint — cached by jose internally */
const JWKS = CF_ACCESS_AUD
  ? createRemoteJWKSet(
      new URL(
        `https://${CF_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/certs`
      )
    )
  : null;

const CLOCK_SKEW_S = 30;

/** Verify app JWT (HS256, signed by AUTH_SECRET) */
async function verifyAppToken(token: string): Promise<boolean> {
  if (!AUTH_SECRET) return false;
  try {
    await jwtVerify(token, SECRET_KEY, { clockTolerance: CLOCK_SKEW_S });
    return true;
  } catch {
    return false;
  }
}

/** Verify Cloudflare Access JWT (RS256, JWKS) */
async function verifyCfToken(token: string): Promise<boolean> {
  if (!JWKS) return false;
  try {
    await jwtVerify(token, JWKS, {
      issuer: `https://${CF_TEAM_NAME}.cloudflareaccess.com`,
      audience: CF_ACCESS_AUD,
      clockTolerance: CLOCK_SKEW_S,
    });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // 1. App JWT cookie
  const appToken = request.cookies.get("fugue-auth")?.value;
  if (appToken && (await verifyAppToken(appToken))) {
    return NextResponse.next();
  }

  // 2. Cloudflare Access cookie (optional layer)
  const cfToken = request.cookies.get("CF_Authorization")?.value;
  if (cfToken && (await verifyCfToken(cfToken))) {
    return NextResponse.next();
  }

  // 3. No valid auth → redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon-.*\\.svg|manifest\\.json|login|api/auth).*)",
  ],
};
