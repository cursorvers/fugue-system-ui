/**
 * Server-side JWT authentication utilities.
 *
 * Uses jose (already installed) for HS256 JWT signing/verification.
 * Credentials are validated server-side only — never exposed to client.
 *
 * Env vars:
 *   AUTH_SECRET  — JWT signing key (required, generate: openssl rand -hex 32)
 *   AUTH_USERS   — JSON array of allowed users (optional, falls back to defaults)
 */

import { SignJWT, jwtVerify } from "jose";

export type UserRole = "admin" | "viewer";

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
}

interface StoredUser {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly role: UserRole;
}

const DEFAULT_USERS: readonly StoredUser[] = [
  { email: "admin@fugue.dev", password: "fugue2024", name: "Admin", role: "admin" },
];

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

function getStoredUsers(): readonly StoredUser[] {
  const raw = process.env.AUTH_USERS;
  if (!raw) return DEFAULT_USERS;
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return DEFAULT_USERS;
  }
}

export function validateCredentials(email: string, password: string): AuthUser | null {
  const users = getStoredUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!found) return null;

  return {
    id: `user-${found.email}`,
    email: found.email,
    name: found.name,
    role: found.role,
  };
}

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: (payload.sub as string) ?? "",
      email: (payload.email as string) ?? "",
      name: (payload.name as string) ?? "",
      role: (payload.role as UserRole) ?? "viewer",
    };
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_NAME = "fugue-auth";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours
