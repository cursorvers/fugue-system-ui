#!/usr/bin/env npx tsx
/**
 * Password hashing migration utility.
 *
 * Usage:
 *   npx tsx scripts/hash-passwords.ts
 *
 * Reads AUTH_USERS from .env.local, hashes all plaintext passwords,
 * and outputs the updated JSON for .env.local replacement.
 */

import { hashPassword } from "../src/lib/password";

interface StoredUser {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly role: string;
}

async function main() {
  const raw = process.env.AUTH_USERS;
  if (!raw) {
    console.error("AUTH_USERS environment variable is required.");
    console.error("Run: source .env.local && npx tsx scripts/hash-passwords.ts");
    process.exit(1);
  }

  const users: readonly StoredUser[] = JSON.parse(raw);
  const updated: StoredUser[] = [];

  for (const user of users) {
    if (user.password.startsWith("pbkdf2:")) {
      console.log(`[skip] ${user.email} — already hashed`);
      updated.push(user);
    } else {
      const hashed = await hashPassword(user.password);
      console.log(`[hash] ${user.email} — hashed successfully`);
      updated.push({ ...user, password: hashed });
    }
  }

  console.log("\n--- Updated AUTH_USERS value ---\n");
  console.log(`AUTH_USERS='${JSON.stringify(updated)}'`);
  console.log("\nCopy the line above into your .env.local file.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
