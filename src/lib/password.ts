/**
 * PBKDF2 password hashing using Web Crypto API.
 *
 * Edge Runtime compatible (no native dependencies).
 * Format: "pbkdf2:iterations:salt_hex:hash_hex"
 *
 * NIST SP 800-132 compliant: PBKDF2-HMAC-SHA256, 600k iterations.
 */

const ALGORITHM = "PBKDF2";
const HASH_FUNCTION = "SHA-256";
const DEFAULT_ITERATIONS = 600_000;
const TEST_ITERATIONS = 1_000;
const SALT_LENGTH = 16; // 128-bit salt
const KEY_LENGTH = 32; // 256-bit derived key
const PREFIX = "pbkdf2";

function getIterations(): number {
  return process.env.NODE_ENV === "test" ? TEST_ITERATIONS : DEFAULT_ITERATIONS;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hash a plaintext password.
 * Returns: "pbkdf2:600000:salt_hex:hash_hex"
 */
export async function hashPassword(password: string): Promise<string> {
  const iterations = getIterations();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    ALGORITHM,
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt,
      iterations,
      hash: HASH_FUNCTION,
    },
    keyMaterial,
    KEY_LENGTH * 8,
  );

  return `${PREFIX}:${iterations}:${toHex(salt.buffer)}:${toHex(derivedBits)}`;
}

/**
 * Verify a password against a stored hash.
 * Supports both hashed format and plaintext fallback for migration.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  // Plaintext fallback: if stored value doesn't match hash format, compare directly
  if (!stored.startsWith(`${PREFIX}:`)) {
    return password === stored;
  }

  const parts = stored.split(":");
  if (parts.length !== 4) return false;

  const iterations = parseInt(parts[1], 10);
  const salt = fromHex(parts[2]);
  const expectedHash = parts[3];

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    ALGORITHM,
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: HASH_FUNCTION,
    },
    keyMaterial,
    KEY_LENGTH * 8,
  );

  const actualHash = toHex(derivedBits);
  // Constant-time comparison to prevent timing attacks
  if (actualHash.length !== expectedHash.length) return false;
  let result = 0;
  for (let i = 0; i < actualHash.length; i++) {
    result |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
}
