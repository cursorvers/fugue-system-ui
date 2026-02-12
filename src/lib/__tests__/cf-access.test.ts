import { describe, it, expect, beforeEach, vi } from "vitest";

describe("cf-access", () => {
  beforeEach(() => {
    vi.resetModules();
    // Set env vars before importing
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "admin@test.dev";
    process.env.OPERATOR_EMAILS = "operator@test.dev";
    process.env.NEXT_PUBLIC_CF_TEAM_NAME = "test-team";
  });

  async function importModule() {
    return await import("../cf-access");
  }

  // Helper to create a valid-looking JWT with given payload
  function createFakeJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    const sig = btoa("fake-signature");
    return `${header}.${body}.${sig}`;
  }

  describe("extractEmailFromCfToken", () => {
    it("extracts email from valid token", async () => {
      const { extractEmailFromCfToken } = await importModule();
      const token = createFakeJwt({
        email: "user@test.dev",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      expect(extractEmailFromCfToken(token)).toBe("user@test.dev");
    });

    it("returns null for expired token", async () => {
      const { extractEmailFromCfToken } = await importModule();
      const token = createFakeJwt({
        email: "user@test.dev",
        exp: Math.floor(Date.now() / 1000) - 3600,
      });
      expect(extractEmailFromCfToken(token)).toBeNull();
    });

    it("returns null for malformed token", async () => {
      const { extractEmailFromCfToken } = await importModule();
      expect(extractEmailFromCfToken("not.a.jwt")).toBeNull();
    });

    it("returns null for token with only 2 parts", async () => {
      const { extractEmailFromCfToken } = await importModule();
      expect(extractEmailFromCfToken("only.two")).toBeNull();
    });

    it("returns null for token without email", async () => {
      const { extractEmailFromCfToken } = await importModule();
      const token = createFakeJwt({
        sub: "some-subject",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      expect(extractEmailFromCfToken(token)).toBeNull();
    });
  });

  describe("getRoleForEmail", () => {
    it("returns admin for admin email", async () => {
      const { getRoleForEmail } = await importModule();
      expect(getRoleForEmail("admin@test.dev")).toBe("admin");
    });

    it("returns operator for operator email", async () => {
      const { getRoleForEmail } = await importModule();
      expect(getRoleForEmail("operator@test.dev")).toBe("operator");
    });

    it("returns viewer for unknown email", async () => {
      const { getRoleForEmail } = await importModule();
      expect(getRoleForEmail("random@test.dev")).toBe("viewer");
    });

    it("is case-insensitive", async () => {
      const { getRoleForEmail } = await importModule();
      expect(getRoleForEmail("ADMIN@TEST.DEV")).toBe("admin");
    });
  });

  describe("getCfAccessLogoutUrl", () => {
    it("returns correct logout URL", async () => {
      const { getCfAccessLogoutUrl } = await importModule();
      expect(getCfAccessLogoutUrl()).toBe(
        "https://test-team.cloudflareaccess.com/cdn-cgi/access/logout"
      );
    });
  });
});
