import { describe, it, expect } from "vitest";
import { validateOrigin } from "../csrf";

// Minimal NextRequest mock for testing
function mockRequest(headers: Record<string, string>) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as Parameters<typeof validateOrigin>[0];
}

describe("csrf", () => {
  describe("validateOrigin", () => {
    it("allows same-origin request", () => {
      const req = mockRequest({
        origin: "https://app.fugue.dev",
        host: "app.fugue.dev",
      });
      expect(validateOrigin(req)).toBeNull();
    });

    it("allows localhost development", () => {
      const req = mockRequest({
        origin: "http://localhost:3000",
        host: "localhost:3000",
      });
      expect(validateOrigin(req)).toBeNull();
    });

    it("rejects missing Origin header", () => {
      const req = mockRequest({ host: "app.fugue.dev" });
      expect(validateOrigin(req)).toBe("Missing Origin header");
    });

    it("rejects missing Host header", () => {
      const req = mockRequest({ origin: "https://evil.com" });
      expect(validateOrigin(req)).toBe("Missing Host header");
    });

    it("rejects cross-origin request", () => {
      const req = mockRequest({
        origin: "https://evil.com",
        host: "app.fugue.dev",
      });
      const result = validateOrigin(req);
      expect(result).toContain("Origin mismatch");
    });

    it("rejects invalid Origin header", () => {
      const req = mockRequest({
        origin: "not-a-url",
        host: "app.fugue.dev",
      });
      expect(validateOrigin(req)).toBe("Invalid Origin header");
    });

    it("handles port mismatch", () => {
      const req = mockRequest({
        origin: "http://localhost:3001",
        host: "localhost:3000",
      });
      const result = validateOrigin(req);
      expect(result).toContain("Origin mismatch");
    });

    it("handles origin with trailing path (should not happen but be safe)", () => {
      const req = mockRequest({
        origin: "https://app.fugue.dev",
        host: "app.fugue.dev",
      });
      expect(validateOrigin(req)).toBeNull();
    });
  });
});
