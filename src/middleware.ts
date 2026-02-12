import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

/**
 * Edge-compatible authentication middleware.
 *
 * Priority:
 *   1. App JWT (fugue-auth cookie) — HS256 signed by AUTH_SECRET
 *   2. Cloudflare Access JWT (CF_Authorization) — RS256 via JWKS
 *   3. Redirect to /login
 *
 * On CF Access auth, user email and role are passed via x-fugue-* headers
 * to downstream server components.
 */

const AUTH_SECRET = process.env.AUTH_SECRET ?? "";
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);

const CF_TEAM_NAME = process.env.NEXT_PUBLIC_CF_TEAM_NAME ?? "fugue";
const CF_ACCESS_AUD = process.env.CF_ACCESS_AUD ?? "";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const OPERATOR_EMAILS = (process.env.OPERATOR_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** JWKS endpoint — cached by jose internally */
const JWKS = CF_ACCESS_AUD
  ? createRemoteJWKSet(
      new URL(
        `https://${CF_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/certs`
      )
    )
  : null;

const CLOCK_SKEW_S = 30;

function resolveRole(email: string): "admin" | "operator" | "viewer" {
  const lower = email.toLowerCase();
  if (ADMIN_EMAILS.includes(lower)) return "admin";
  if (OPERATOR_EMAILS.includes(lower)) return "operator";
  return "viewer";
}

/** Verify app JWT (HS256, signed by AUTH_SECRET) */
async function verifyAppToken(token: string): Promise<{ email?: string; role?: string } | null> {
  if (!AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, { clockTolerance: CLOCK_SKEW_S });
    return {
      email: payload.email as string | undefined,
      role: payload.role as string | undefined,
    };
  } catch {
    return null;
  }
}

/** Verify Cloudflare Access JWT (RS256, JWKS) */
async function verifyCfToken(token: string): Promise<{ email?: string } | null> {
  if (!JWKS) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${CF_TEAM_NAME}.cloudflareaccess.com`,
      audience: CF_ACCESS_AUD,
      clockTolerance: CLOCK_SKEW_S,
    });
    return { email: payload.email as string | undefined };
  } catch {
    return null;
  }
}

/** Build a NextResponse that propagates user info as REQUEST headers (not response headers). */
function authenticatedResponse(request: NextRequest, email: string, role: string): NextResponse {
  // Clone request headers and strip any externally-injected x-fugue-* (spoofing prevention)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-fugue-email");
  requestHeaders.delete("x-fugue-role");

  // Set verified values as request headers (accessible in Server Components via headers())
  requestHeaders.set("x-fugue-email", email);
  requestHeaders.set("x-fugue-role", role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function middleware(request: NextRequest) {
  // 1. App JWT cookie
  const appToken = request.cookies.get("fugue-auth")?.value;
  if (appToken) {
    const result = await verifyAppToken(appToken);
    if (result?.email) {
      return authenticatedResponse(
        request,
        result.email,
        result.role ?? resolveRole(result.email),
      );
    }
  }

  // 2. Cloudflare Access cookie (optional layer)
  const cfToken = request.cookies.get("CF_Authorization")?.value;
  if (cfToken) {
    const result = await verifyCfToken(cfToken);
    if (result?.email) {
      return authenticatedResponse(request, result.email, resolveRole(result.email));
    }
  }

  // 3. No valid auth → redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon-.*\\.svg|manifest\\.json|login|api/auth).*)",
  ],
};
