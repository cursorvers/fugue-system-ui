import { describe, it, expect } from "vitest";
import { POST } from "../route";

function createRequest(headers: Record<string, string> = {}) {
  const defaultHeaders: Record<string, string> = {
    origin: "http://localhost:3000",
    host: "localhost:3000",
    ...headers,
  };

  return {
    headers: {
      get: (name: string) => defaultHeaders[name.toLowerCase()] ?? null,
    },
  } as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/auth/logout", () => {
  it("returns 200 with success", () => {
    const res = POST(createRequest());
    expect(res.status).toBe(200);
  });

  it("clears auth cookie", async () => {
    const res = POST(createRequest());
    const data = await res.json();
    expect(data.success).toBe(true);
    const cookies = res.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThan(0);
    // Cookie should have maxAge=0 (clearing)
    expect(cookies[0]).toContain("fugue-auth=");
    expect(cookies[0]).toContain("Max-Age=0");
  });

  it("returns 403 for cross-origin request", () => {
    const res = POST(createRequest({ origin: "https://evil.com", host: "localhost:3000" }));
    expect(res.status).toBe(403);
  });
});
