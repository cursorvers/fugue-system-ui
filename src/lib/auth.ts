/**
 * Server-side JWT authentication utilities.
 *
 * Uses jose (already installed) for HS256 JWT signing/verification.
 * Credentials are validated server-side only — never exposed to client.
 *
 * Env vars:
 *   AUTH_SECRET  — JWT signing key (required, generate: openssl rand -hex 32)
 *   AUTH_USERS   — JSON array of allowed users (required, no defaults)
 */

import { SignJWT, jwtVerify } from "jose";
import { verifyPassword } from "./password";

export type UserRole = "admin" | "operator" | "viewer";

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

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

function getStoredUsers(): readonly StoredUser[] {
  const raw = process.env.AUTH_USERS;
  if (!raw) {
    throw new Error(
      "AUTH_USERS environment variable is required. " +
      'Format: [{"email":"...","password":"...","name":"...","role":"admin|operator|viewer"}]'
    );
  }
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    throw new Error("AUTH_USERS must be valid JSON array");
  }
}

export async function validateCredentials(email: string, password: string): Promise<AuthUser | null> {
  const users = getStoredUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (!found) return null;

  const isValid = await verifyPassword(password, found.password);
  if (!isValid) return null;

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
