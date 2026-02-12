import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../route";

// Set up env vars for auth
beforeEach(() => {
  vi.resetModules();
  process.env.AUTH_SECRET = "test-secret-for-ci-32-characters-long";
  process.env.AUTH_USERS = JSON.stringify([
    { email: "admin@test.dev", password: "admin123", name: "Admin", role: "admin" },
  ]);
});

function createRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  const defaultHeaders: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost:3000",
    host: "localhost:3000",
    ...headers,
  };

  return {
    json: async () => body,
    headers: {
      get: (name: string) => defaultHeaders[name.toLowerCase()] ?? null,
    },
    cookies: {
      get: () => undefined,
    },
  } as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/auth/login", () => {
  it("returns 400 for missing credentials", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 for missing password", async () => {
    const res = await POST(createRequest({ email: "admin@test.dev" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 for wrong password", async () => {
    const res = await POST(createRequest({ email: "admin@test.dev", password: "wrong" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 401 for unknown email", async () => {
    const res = await POST(createRequest({ email: "unknown@test.dev", password: "admin123" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 with user data on valid login", async () => {
    const res = await POST(createRequest({ email: "admin@test.dev", password: "admin123" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.email).toBe("admin@test.dev");
    expect(data.data.role).toBe("admin");
  });

  it("sets auth cookie on successful login", async () => {
    const res = await POST(createRequest({ email: "admin@test.dev", password: "admin123" }));
    const cookies = res.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies[0]).toContain("fugue-auth=");
  });

  it("returns 403 for cross-origin request", async () => {
    const res = await POST(
      createRequest({ email: "admin@test.dev", password: "admin123" }, {
        origin: "https://evil.com",
        host: "localhost:3000",
      })
    );
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe("CSRF_VIOLATION");
  });

  it("returns 403 for missing Origin header", async () => {
    const req = {
      json: async () => ({ email: "admin@test.dev", password: "admin123" }),
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === "host") return "localhost:3000";
          return null;
        },
      },
      cookies: { get: () => undefined },
    } as unknown as Parameters<typeof POST>[0];
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
