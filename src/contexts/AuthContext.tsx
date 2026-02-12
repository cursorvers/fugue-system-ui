"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useCrossTabSync } from "@/hooks/useCrossTabSync";

export type UserRole = "admin" | "operator" | "viewer";

interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
}

interface AuthContextType {
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly login: (email: string, password: string) => Promise<boolean>;
  readonly logout: () => void;
  readonly isAuthenticated: boolean;
  readonly hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check session on mount via server-side JWT validation
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = (await res.json()) as { data: User };
          setUser(data.data);
        }
      } catch {
        // Not authenticated — OK
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setError(null);
      setIsLoading(true);

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = (await res.json()) as {
          success: boolean;
          data?: User;
          error?: { message: string };
        };

        if (data.success && data.data) {
          setUser(data.data);
          setIsLoading(false);
          return true;
        }

        setError(data.error?.message ?? "Login failed");
        setIsLoading(false);
        return false;
      } catch {
        setError("Network error");
        setIsLoading(false);
        return false;
      }
    },
    []
  );

  // Cross-tab: sync logout across tabs
  const handleCrossTabAuth = useCallback((action: string) => {
    if (action === "logout") {
      setUser(null);
      setError(null);
    }
  }, []);
  const { broadcast: broadcastAuth } = useCrossTabSync("auth", handleCrossTabAuth);

  const logout = useCallback(() => {
    // Fire-and-forget: clear server cookie
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setError(null);
    broadcastAuth("logout");
  }, [broadcastAuth]);

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (!user) return false;
      const hierarchy: Record<UserRole, number> = { admin: 3, operator: 2, viewer: 1 };
      return hierarchy[user.role] >= hierarchy[role];
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
