"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push("/");
    } else {
      setError("Invalid email or password");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-[var(--primary)] rounded-xl" />
            <span className="font-primary text-3xl font-bold text-[var(--primary)]">
              FUGUE
            </span>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="font-primary text-xl font-semibold text-[var(--foreground)]">
              Welcome Back
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Sign in to your orchestrator
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-3 bg-[var(--background)] border border-[var(--input)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3 bg-[var(--background)] border border-[var(--input)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[var(--primary)] text-white font-primary font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="text-center text-xs text-[var(--muted-foreground)] space-y-1">
            <p>Demo credentials:</p>
            <p className="font-mono">admin@fugue.dev / fugue2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}
