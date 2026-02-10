"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg animate-pulse" />
          <span className="font-primary text-lg text-[var(--muted-foreground)]">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="material-symbols-sharp text-[48px] text-[var(--muted-foreground)]">
            lock
          </span>
          <h1 className="font-primary text-lg font-semibold text-[var(--foreground)]">
            Access Denied
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            You need <strong>{requiredRole}</strong> role to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
