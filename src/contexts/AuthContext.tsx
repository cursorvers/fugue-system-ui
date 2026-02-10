"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "admin" | "viewer";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Demo credentials for FUGUE system (only available in demo mode)
const DEMO_USERS = [
  { id: "1", email: "admin@fugue.dev", password: "fugue2024", name: "Admin", role: "admin" as const },
  { id: "2", email: "joe@acmecorp.com", password: "demo", name: "Joe Doe", role: "viewer" as const },
];

const STORAGE_KEY = "fugue_user";

function extractUserFromCfToken(): User | null {
  if (typeof document === "undefined") return null;
  try {
    const cookies = document.cookie.split("; ");
    const cfAuth = cookies.find((c) => c.startsWith("CF_Authorization="));
    if (!cfAuth) return null;

    const token = cfAuth.split("=")[1];
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as {
      email?: string;
      sub?: string;
    };

    return {
      id: payload.sub ?? "cf-user",
      email: payload.email ?? "unknown@cf-access",
      name: payload.email?.split("@")[0] ?? "CF User",
      role: "admin",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try CF Access token first (production)
    const cfUser = extractUserFromCfToken();
    if (cfUser) {
      setUser(cfUser);
      setIsLoading(false);
      return;
    }

    // Fall back to localStorage (demo mode)
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  // Periodically refresh CF Access token (every 60s)
  useEffect(() => {
    if (IS_DEMO_MODE) return;
    const interval = setInterval(() => {
      const cfUser = extractUserFromCfToken();
      if (cfUser) {
        setUser(cfUser);
      } else if (user) {
        // Token expired
        setUser(null);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    if (!IS_DEMO_MODE) {
      // In production, login is handled by CF Access redirect
      setError("Login is handled by Cloudflare Access");
      setIsLoading(false);
      return false;
    }

    // Demo mode: simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundUser = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setIsLoading(false);
      return true;
    }

    setError("Invalid email or password");
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.role === role;
  };

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
