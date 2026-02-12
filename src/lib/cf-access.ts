/**
 * Cloudflare Access JWT utilities.
 *
 * Two modes:
 *   1. Server-side (middleware): Full JWKS signature verification via jose
 *   2. Client-side: Decode-only (CF has already verified before reaching the app)
 *
 * Env vars:
 *   CF_ACCESS_AUD          — CF Access audience tag (required for server verification)
 *   NEXT_PUBLIC_CF_TEAM_NAME — CF Access team name (default: "fugue")
 *   NEXT_PUBLIC_ADMIN_EMAILS — Comma-separated admin email list
 */

import type { UserRole } from "@/contexts/AuthContext";

interface CfAccessPayload {
  readonly email: string;
  readonly sub: string;
  readonly iss: string;
  readonly aud: readonly string[];
  readonly exp: number;
  readonly iat: number;
  readonly type: string;
  readonly identity_nonce: string;
  readonly country?: string;
}

export interface CfAccessUser {
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly expiresAt: number;
}

// Admin emails from environment — comma-separated
const ADMIN_EMAILS: readonly string[] = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? ""
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Operator emails from environment — comma-separated
const OPERATOR_EMAILS: readonly string[] = (
  process.env.OPERATOR_EMAILS ?? ""
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function mapRole(email: string): UserRole {
  const lower = email.toLowerCase();
  if (ADMIN_EMAILS.includes(lower)) return "admin";
  if (OPERATOR_EMAILS.includes(lower)) return "operator";
  return "viewer";
}

function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "User";
  return local
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Decode a Cloudflare Access JWT payload (no signature verification).
 * Returns null if the token is malformed or expired.
 */
function decodeCfJwt(token: string): CfAccessPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url → Base64 → decode
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as CfAccessPayload;

    // Expiry check
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Read CF_Authorization cookie set by Cloudflare Access.
 */
function getCfAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith("CF_Authorization=")) {
      return trimmed.slice("CF_Authorization=".length);
    }
  }
  return null;
}

/**
 * Attempt to extract user from Cloudflare Access cookie.
 * Returns null if no valid CF Access session is found.
 */
export function getCfAccessUser(): CfAccessUser | null {
  const token = getCfAccessToken();
  if (!token) return null;

  const payload = decodeCfJwt(token);
  if (!payload?.email) return null;

  return {
    email: payload.email,
    name: deriveNameFromEmail(payload.email),
    role: mapRole(payload.email),
    expiresAt: payload.exp * 1000,
  };
}

/**
 * Extract email from a CF Access JWT token string (server-side).
 * Used by middleware after JWKS verification.
 */
export function extractEmailFromCfToken(token: string): string | null {
  const payload = decodeCfJwt(token);
  return payload?.email ?? null;
}

/**
 * Map an email to a user role (server-side).
 */
export function getRoleForEmail(email: string): UserRole {
  return mapRole(email);
}

/**
 * Whether the app is running behind Cloudflare Access.
 * Detected by the presence of CF_Authorization cookie.
 */
export function isCfAccessEnabled(): boolean {
  return getCfAccessToken() !== null;
}

/**
 * Cloudflare Access logout URL.
 * Redirects user to Cloudflare's logout endpoint which clears the session.
 */
export function getCfAccessLogoutUrl(): string {
  const teamName = process.env.NEXT_PUBLIC_CF_TEAM_NAME ?? "fugue";
  return `https://${teamName}.cloudflareaccess.com/cdn-cgi/access/logout`;
}
