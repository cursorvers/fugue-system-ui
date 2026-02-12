"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/error-reporter";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChatError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    reportError(error, { component: "ChatError", digest: error.digest });
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="flex justify-center">
          <span className="material-symbols-sharp text-[40px] text-[var(--color-warning-foreground)]">
            wifi_off
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-primary font-semibold text-[var(--foreground)]">
            Chat接続エラー
          </h2>
          <p className="text-[13px] font-secondary text-[var(--muted-foreground)]">
            WebSocket接続に問題が発生しました。再接続を試みてください。
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-[var(--radius-m)] bg-[var(--primary)] text-[var(--primary-foreground)] text-[13px] font-primary font-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-sharp text-[18px]">refresh</span>
            再接続
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-[var(--radius-m)] border border-[var(--border)] text-[var(--foreground)] text-[13px] font-primary font-medium hover:bg-[var(--secondary)] transition-colors"
          >
            <span className="material-symbols-sharp text-[18px]">dashboard</span>
            Overview
          </a>
        </div>
      </div>
    </div>
  );
}
