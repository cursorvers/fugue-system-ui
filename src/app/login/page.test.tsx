import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthContext";
import LoginPage from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({ push: pushMock }),
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("shows an error message on invalid credentials", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/auth/me")) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ success: false }),
        } as unknown as Response;
      }
      if (url.endsWith("/api/auth/login")) {
        return {
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
          }),
        } as unknown as Response;
      }
      throw new Error(`[TEST] unexpected fetch: ${url}`);
    });

    // @ts-expect-error - override fetch for test
    global.fetch = fetchMock;

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "admin@test.dev" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrong" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "サインイン" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "メールアドレスまたはパスワードが正しくありません"
      );
    });
  });
});

