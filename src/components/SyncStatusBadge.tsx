"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { SyncConflict, SyncState } from "@/types/sync";

type ResolutionChoice = "local" | "remote";

export interface SyncStatusBadgeProps {
  syncState: SyncState;
  conflicts: readonly SyncConflict[];
  onResolve: (conflictId: string, resolution: ResolutionChoice) => void;
  compact?: boolean;
}

const STATUS_LABELS: Record<SyncState["status"], string> = {
  synced: "同期済み",
  syncing: "同期中",
  conflict: "競合",
  offline: "オフライン",
};

const DOT_COLORS: Record<SyncState["status"], string> = {
  synced: "#22c55e",
  syncing: "#eab308",
  conflict: "#ef4444",
  offline: "#6b7280",
};

export function SyncStatusBadge({
  syncState,
  conflicts,
  onResolve,
  compact = false,
}: SyncStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isConflict = syncState.status === "conflict";
  const conflictCount = Math.max(syncState.conflictCount, conflicts.length);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => isConflict && setOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-2 rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--background)] px-2 py-1 font-primary text-xs text-[var(--foreground)]",
          isConflict ? "cursor-pointer" : "cursor-default"
        )}
      >
        <span
          className={cn("inline-block rounded-full", compact ? "h-2 w-2" : "h-2.5 w-2.5", syncState.status === "syncing" && "animate-pulse")}
          style={{ backgroundColor: DOT_COLORS[syncState.status] }}
        />
        {!compact && <span>{STATUS_LABELS[syncState.status]}</span>}
        {isConflict && conflictCount > 0 && (
          <span className="rounded-full bg-[#ef4444] px-1.5 py-0.5 text-[10px] leading-none text-white">{conflictCount}</span>
        )}
        {!compact && (
          <span className="material-symbols-sharp text-sm text-[var(--muted-foreground)]">
            {isConflict ? "sync_problem" : "sync"}
          </span>
        )}
      </button>

      {isConflict && open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg">
          <p className="px-1 pb-1 font-primary text-xs text-[var(--muted-foreground)]">競合を解決</p>
          <div className="space-y-2">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="rounded-[var(--radius-s)] border border-[var(--border)] p-2">
                <p className="truncate font-primary text-xs text-[var(--foreground)]">
                  {conflict.entityType} / {conflict.entityId}
                </p>
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => onResolve(conflict.id, "local")}
                    className="rounded-[var(--radius-s)] border border-[var(--border)] px-2 py-1 font-primary text-[11px] text-[var(--foreground)]"
                  >
                    ローカル優先
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolve(conflict.id, "remote")}
                    className="rounded-[var(--radius-s)] border border-[var(--border)] px-2 py-1 font-primary text-[11px] text-[var(--foreground)]"
                  >
                    リモート優先
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
