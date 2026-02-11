"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type ConnectionState = "connected" | "connecting" | "disconnected" | "error";

interface ConnectionStatusProps {
  state: ConnectionState;
  error?: string | null;
  onReconnect?: () => void;
  className?: string;
}

const stateConfig: Record<ConnectionState, { label: string; icon: string; color: string; bg: string }> = {
  connected: {
    label: "接続済み",
    icon: "wifi",
    color: "text-[var(--color-success-foreground)]",
    bg: "bg-[var(--color-success)]",
  },
  connecting: {
    label: "接続中...",
    icon: "sync",
    color: "text-[var(--color-info-foreground)]",
    bg: "bg-[var(--color-info)]",
  },
  disconnected: {
    label: "オフライン",
    icon: "cloud_off",
    color: "text-[var(--muted-foreground)]",
    bg: "bg-[var(--secondary)]",
  },
  error: {
    label: "接続エラー",
    icon: "error",
    color: "text-[var(--color-error-foreground)]",
    bg: "bg-[var(--color-error)]",
  },
};

export function ConnectionStatus({
  state,
  error,
  onReconnect,
  className,
}: ConnectionStatusProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = stateConfig[state];

  // Don't show bar when connected (success is silent) or dismissed
  if (state === "connected" || dismissed) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-xs font-primary",
        config.bg,
        config.color,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "material-symbols-sharp text-[16px]",
          state === "connecting" && "animate-spin"
        )}
        aria-hidden="true"
      >
        {config.icon}
      </span>
      <span className="flex-1">
        {config.label}
        {error && ` — ${error}`}
      </span>
      {(state === "disconnected" || state === "error") && onReconnect && (
        <button
          onClick={onReconnect}
          className="font-medium underline underline-offset-2 hover:no-underline"
        >
          再接続
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="flex items-center justify-center w-5 h-5 rounded hover:bg-black/10 transition-colors flex-shrink-0"
        aria-label="閉じる"
      >
        <span className="material-symbols-sharp text-[14px]">close</span>
      </button>
    </div>
  );
}
