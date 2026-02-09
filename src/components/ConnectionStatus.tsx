"use client";

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
    label: "Connected",
    icon: "wifi",
    color: "text-[var(--color-success-foreground)]",
    bg: "bg-[var(--color-success)]",
  },
  connecting: {
    label: "Connecting...",
    icon: "sync",
    color: "text-[var(--color-info-foreground)]",
    bg: "bg-[var(--color-info)]",
  },
  disconnected: {
    label: "Disconnected",
    icon: "wifi_off",
    color: "text-[var(--color-warning-foreground)]",
    bg: "bg-[var(--color-warning)]",
  },
  error: {
    label: "Connection error",
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
  const config = stateConfig[state];

  // Don't show bar when connected (success is silent)
  if (state === "connected") return null;

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
          Reconnect
        </button>
      )}
    </div>
  );
}
