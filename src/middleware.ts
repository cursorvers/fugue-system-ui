import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

/**
 * Edge-compatible middleware for Cloudflare Access authentication.
 *
 * Security tiers:
 *   Tier 2 (active when CF_ACCESS_AUD is set): jose JWKS signature verification
 *   Tier 1 (fallback): JWT structure + expiry check only
 *   Demo mode: all requests pass through
 */

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
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

/** Clock skew buffer — avoids rejecting valid tokens due to time drift */
const CLOCK_SKEW_MS = 30_000;

/**
 * Tier 1: Validate JWT structure and expiry without signature verification.
 * Uses atob() for Edge Runtime compatibility (no Node.js Buffer).
 */
function isValidJwtStructure(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as { exp?: unknown };

    if (typeof payload.exp !== "number" || Number.isNaN(payload.exp)) {
      return false;
    }

    return payload.exp * 1000 > Date.now() - CLOCK_SKEW_MS;
  } catch {
    return false;
  }
}

/**
 * Tier 2: Full JWKS signature verification via jose.
 * Returns true if the token is valid and signed by Cloudflare Access.
 */
async function verifyJwtSignature(token: string): Promise<boolean> {
  if (!JWKS) return false;

  try {
    await jwtVerify(token, JWKS, {
      issuer: `https://${CF_TEAM_NAME}.cloudflareaccess.com`,
      audience: CF_ACCESS_AUD,
      clockTolerance: CLOCK_SKEW_MS / 1000,
    });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Demo mode: skip authentication
  if (IS_DEMO) return NextResponse.next();

  const token = request.cookies.get("CF_Authorization")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Tier 2: JWKS signature verification (when CF_ACCESS_AUD is configured)
  if (JWKS) {
    const valid = await verifyJwtSignature(token);
    if (!valid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Tier 1 fallback: structure + expiry only
  if (!isValidJwtStructure(token)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon-.*\\.svg|manifest\\.json|login).*)",
  ],
};
