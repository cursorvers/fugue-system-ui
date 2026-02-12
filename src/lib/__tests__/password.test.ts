import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("password", () => {
  describe("hashPassword", () => {
    it("returns a string in pbkdf2 format", async () => {
      const hash = await hashPassword("test123");
      expect(hash).toMatch(/^pbkdf2:\d+:[a-f0-9]+:[a-f0-9]+$/);
    });

    it("produces different hashes for same password (random salt)", async () => {
      const hash1 = await hashPassword("same-password");
      const hash2 = await hashPassword("same-password");
      expect(hash1).not.toBe(hash2);
    });

    it("embeds iteration count in hash", async () => {
      const hash = await hashPassword("test");
      const iterations = parseInt(hash.split(":")[1], 10);
      // Test env uses reduced iterations; production uses 600k
      expect(iterations).toBeGreaterThan(0);
      expect(hash.split(":")).toHaveLength(4);
    });
  });

  describe("verifyPassword", () => {
    it("verifies correct password against hash", async () => {
      const hash = await hashPassword("correct-password");
      const result = await verifyPassword("correct-password", hash);
      expect(result).toBe(true);
    });

    it("rejects incorrect password against hash", async () => {
      const hash = await hashPassword("correct-password");
      const result = await verifyPassword("wrong-password", hash);
      expect(result).toBe(false);
    });

    it("supports plaintext fallback for migration", async () => {
      const result = await verifyPassword("plaintext", "plaintext");
      expect(result).toBe(true);
    });

    it("rejects wrong plaintext password", async () => {
      const result = await verifyPassword("wrong", "plaintext");
      expect(result).toBe(false);
    });

    it("rejects malformed hash string", async () => {
      const result = await verifyPassword("test", "pbkdf2:bad");
      expect(result).toBe(false);
    });

    it("handles empty password", async () => {
      const hash = await hashPassword("");
      const result = await verifyPassword("", hash);
      expect(result).toBe(true);
    });

    it("handles unicode passwords", async () => {
      const hash = await hashPassword("パスワード🔐");
      const result = await verifyPassword("パスワード🔐", hash);
      expect(result).toBe(true);
    });

    it("timing-safe comparison rejects length mismatch", async () => {
      // Manipulate hash to have wrong length
      const hash = await hashPassword("test");
      const parts = hash.split(":");
      const truncated = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3].slice(0, -2)}`;
      const result = await verifyPassword("test", truncated);
      expect(result).toBe(false);
    });
  });
});
