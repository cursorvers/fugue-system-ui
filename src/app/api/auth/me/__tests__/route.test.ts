import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../route";

const TEST_SECRET = "test-secret-for-ci-32-characters-long";

beforeEach(() => {
  vi.resetModules();
  process.env.AUTH_SECRET = TEST_SECRET;
  process.env.AUTH_USERS = "[]";
});

async function getValidToken(): Promise<string> {
  const { signToken } = await import("@/lib/auth");
  return signToken({
    id: "user-test@dev",
    email: "test@dev",
    name: "Test User",
    role: "admin",
  });
}

function createRequest(cookieValue?: string) {
  return {
    cookies: {
      get: (name: string) => {
        if (name === "fugue-auth" && cookieValue) {
          return { value: cookieValue };
        }
        return undefined;
      },
    },
  } as unknown as Parameters<typeof GET>[0];
}

describe("GET /api/auth/me", () => {
  it("returns 401 when no cookie present", async () => {
    const res = await GET(createRequest());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 for invalid token", async () => {
    const res = await GET(createRequest("invalid-token"));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_TOKEN");
  });

  it("returns 200 with user data for valid token", async () => {
    const token = await getValidToken();
    const res = await GET(createRequest(token));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.email).toBe("test@dev");
    expect(data.data.role).toBe("admin");
  });

  it("returns 401 for tampered token", async () => {
    const token = await getValidToken();
    const tampered = token.slice(0, -5) + "XXXXX";
    const res = await GET(createRequest(tampered));
    expect(res.status).toBe(401);
  });
});
