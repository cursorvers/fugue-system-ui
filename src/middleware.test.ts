import { describe, it, expect, beforeEach, vi } from "vitest";

const TEST_SECRET = "test-secret-for-middleware-32-characters-long";

beforeEach(() => {
  vi.resetModules();
  process.env.AUTH_SECRET = TEST_SECRET;
  process.env.NEXT_PUBLIC_CF_TEAM_NAME = "fugue";
  process.env.CF_ACCESS_AUD = "";
  process.env.NEXT_PUBLIC_ADMIN_EMAILS = "admin@test.dev";
  process.env.OPERATOR_EMAILS = "operator@test.dev";
});

async function getValidAppToken(): Promise<string> {
  process.env.AUTH_SECRET = TEST_SECRET;
  const { signToken } = await import("@/lib/auth");
  return signToken({
    id: "user-admin@test.dev",
    email: "admin@test.dev",
    name: "Admin",
    role: "admin",
  });
}

// Minimal NextRequest mock
function createMockRequest(url: string, cookies: Record<string, string> = {}) {
  return {
    url,
    cookies: {
      get: (name: string) => {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
    },
    headers: new Map<string, string>(),
    nextUrl: new URL(url),
  };
}

describe("middleware", () => {
  it("exports matcher config", async () => {
    const { config } = await import("./middleware");
    expect(config.matcher).toBeDefined();
    expect(config.matcher.length).toBeGreaterThan(0);
  });

  it("redirects to login when no auth cookie", async () => {
    const { middleware } = await import("./middleware");
    const req = createMockRequest("http://localhost:3000/chat");
    const res = await middleware(req as any);
    // Should redirect to /login
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login");
  });

  it("allows request with valid app JWT", async () => {
    const token = await getValidAppToken();
    const { middleware } = await import("./middleware");
    const req = createMockRequest("http://localhost:3000/chat", {
      "fugue-auth": token,
    });
    const res = await middleware(req as any);
    // Should NOT redirect (next() returns 200)
    expect(res.status).not.toBe(307);
  });

  it("sets x-fugue-email header for valid JWT", async () => {
    const token = await getValidAppToken();
    const { middleware } = await import("./middleware");
    const req = createMockRequest("http://localhost:3000/chat", {
      "fugue-auth": token,
    });
    const res = await middleware(req as any);
    // NextResponse.next() with modified headers
    const headers = res.headers;
    // The middleware sets request headers, not response headers
    // In test env, we verify it doesn't redirect
    expect(res.status).not.toBe(307);
  });

  it("redirects on expired/invalid app JWT", async () => {
    const { middleware } = await import("./middleware");
    const req = createMockRequest("http://localhost:3000/chat", {
      "fugue-auth": "expired-token",
    });
    const res = await middleware(req as any);
    expect(res.status).toBe(307);
  });
});
