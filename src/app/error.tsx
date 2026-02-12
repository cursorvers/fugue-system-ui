"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/error-reporter";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    reportError(error, { component: "GlobalError", digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <span className="material-symbols-sharp text-[48px] text-[var(--color-error-foreground)]">
            error
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-primary font-semibold text-[var(--foreground)]">
            予期しないエラーが発生しました
          </h1>
          <p className="text-[13px] font-secondary text-[var(--muted-foreground)]">
            問題が解決しない場合は、ページを再読み込みしてください。
          </p>
          {error.digest && (
            <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-[var(--radius-m)] bg-[var(--primary)] text-[var(--primary-foreground)] text-[13px] font-primary font-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-sharp text-[18px]">refresh</span>
            再試行
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-[var(--radius-m)] border border-[var(--border)] text-[var(--foreground)] text-[13px] font-primary font-medium hover:bg-[var(--secondary)] transition-colors"
          >
            <span className="material-symbols-sharp text-[18px]">home</span>
            ホームへ
          </a>
        </div>
      </div>
    </div>
  );
}
