/**
 * CSRF protection via Origin header validation.
 *
 * Stateless approach: validates that the Origin header matches
 * the request's own host. Combined with sameSite: "lax" cookies,
 * this prevents cross-origin form submissions.
 */

import type { NextRequest } from "next/server";

/**
 * Validate that a mutating request (POST/PUT/DELETE/PATCH)
 * originates from the same site.
 *
 * Returns null if valid, or an error message string if invalid.
 */
export function validateOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Origin header is required for mutating requests
  if (!origin) {
    return "Missing Origin header";
  }

  if (!host) {
    return "Missing Host header";
  }

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host;

    if (originHost !== host) {
      return `Origin mismatch: ${originHost} !== ${host}`;
    }
  } catch {
    return "Invalid Origin header";
  }

  return null;
}
