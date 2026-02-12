import { describe, it, expect, beforeEach, vi } from "vitest";
import { hashPassword } from "../password";

// Mock env before importing auth module
const TEST_SECRET = "test-secret-key-for-jwt-signing-32chars";

describe("auth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function setupEnv(users: Array<{ email: string; password: string; name: string; role: string }>) {
    process.env.AUTH_SECRET = TEST_SECRET;
    process.env.AUTH_USERS = JSON.stringify(users);
    const auth = await import("../auth");
    return auth;
  }

  describe("validateCredentials", () => {
    it("validates correct plaintext credentials (migration mode)", async () => {
      const auth = await setupEnv([
        { email: "admin@test.dev", password: "plaintext123", name: "Admin", role: "admin" },
      ]);
      const user = await auth.validateCredentials("admin@test.dev", "plaintext123");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("admin@test.dev");
      expect(user?.role).toBe("admin");
    });

    it("validates correct hashed credentials", async () => {
      const hashed = await hashPassword("secure-pass");
      const auth = await setupEnv([
        { email: "user@test.dev", password: hashed, name: "User", role: "viewer" },
      ]);
      const user = await auth.validateCredentials("user@test.dev", "secure-pass");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("user@test.dev");
    });

    it("rejects wrong password", async () => {
      const hashed = await hashPassword("correct");
      const auth = await setupEnv([
        { email: "user@test.dev", password: hashed, name: "User", role: "viewer" },
      ]);
      const user = await auth.validateCredentials("user@test.dev", "wrong");
      expect(user).toBeNull();
    });

    it("rejects unknown email", async () => {
      const auth = await setupEnv([
        { email: "known@test.dev", password: "pass", name: "Known", role: "viewer" },
      ]);
      const user = await auth.validateCredentials("unknown@test.dev", "pass");
      expect(user).toBeNull();
    });

    it("email matching is case-insensitive", async () => {
      const auth = await setupEnv([
        { email: "Admin@Test.dev", password: "pass", name: "Admin", role: "admin" },
      ]);
      const user = await auth.validateCredentials("admin@test.dev", "pass");
      expect(user).not.toBeNull();
    });

    it("returns user with correct id format", async () => {
      const auth = await setupEnv([
        { email: "user@test.dev", password: "pass", name: "User", role: "operator" },
      ]);
      const user = await auth.validateCredentials("user@test.dev", "pass");
      expect(user?.id).toBe("user-user@test.dev");
    });
  });

  describe("signToken + verifyToken", () => {
    it("round-trips a user through JWT", async () => {
      const auth = await setupEnv([]);
      const original = { id: "user-test@dev", email: "test@dev", name: "Test", role: "admin" as const };
      const token = await auth.signToken(original);
      expect(typeof token).toBe("string");
      const verified = await auth.verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.email).toBe("test@dev");
      expect(verified?.role).toBe("admin");
    });

    it("rejects tampered token", async () => {
      const auth = await setupEnv([]);
      const original = { id: "user-test@dev", email: "test@dev", name: "Test", role: "admin" as const };
      const token = await auth.signToken(original);
      const tampered = token.slice(0, -5) + "XXXXX";
      const verified = await auth.verifyToken(tampered);
      expect(verified).toBeNull();
    });

    it("rejects empty token", async () => {
      const auth = await setupEnv([]);
      const verified = await auth.verifyToken("");
      expect(verified).toBeNull();
    });
  });

  describe("constants", () => {
    it("exports correct cookie config", async () => {
      const auth = await setupEnv([]);
      expect(auth.AUTH_COOKIE_NAME).toBe("fugue-auth");
      expect(auth.AUTH_COOKIE_MAX_AGE).toBe(86400);
    });
  });

  describe("error handling", () => {
    it("throws when AUTH_SECRET is missing", async () => {
      delete process.env.AUTH_SECRET;
      process.env.AUTH_USERS = "[]";
      vi.resetModules();
      const auth = await import("../auth");
      await expect(auth.signToken({ id: "x", email: "x", name: "x", role: "viewer" }))
        .rejects.toThrow("AUTH_SECRET");
    });

    it("throws when AUTH_USERS is missing", async () => {
      process.env.AUTH_SECRET = TEST_SECRET;
      delete process.env.AUTH_USERS;
      vi.resetModules();
      const auth = await import("../auth");
      await expect(auth.validateCredentials("x", "x")).rejects.toThrow("AUTH_USERS");
    });

    it("throws when AUTH_USERS is invalid JSON", async () => {
      process.env.AUTH_SECRET = TEST_SECRET;
      process.env.AUTH_USERS = "not-json";
      vi.resetModules();
      const auth = await import("../auth");
      await expect(auth.validateCredentials("x", "x")).rejects.toThrow("valid JSON");
    });
  });
});
