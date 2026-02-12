"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push("/");
    } else {
      setLocalError("メールアドレスまたはパスワードが正しくありません");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-8 pwa-safe-top">
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
              おかえりなさい
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Orchestratorにサインイン
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">
                メールアドレス
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
                パスワード
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

            {localError && (
              <p className="text-sm text-red-500 text-center">{localError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[var(--primary)] text-white font-primary font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? "サインイン中..." : "サインイン"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
