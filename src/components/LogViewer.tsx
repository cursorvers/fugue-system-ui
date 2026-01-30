"use client";

import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
}

export function LogViewer({ logs, className }: LogViewerProps) {
  const levelColors = {
    INFO: "var(--color-info-foreground)",
    WARN: "var(--color-warning-foreground)",
    ERROR: "var(--color-error-foreground)",
    DEBUG: "var(--muted-foreground)",
  };

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {logs.map((log, index) => (
        <div
          key={log.id}
          className={cn(
            "flex items-start gap-3 px-3 py-2 rounded",
            index % 2 === 1 ? "bg-[var(--secondary)]" : ""
          )}
        >
          <span className="w-[70px] text-xs font-primary text-[var(--muted-foreground)] shrink-0">
            {log.timestamp}
          </span>
          <span
            className="w-[50px] text-xs font-primary font-semibold shrink-0"
            style={{ color: levelColors[log.level] }}
          >
            {log.level}
          </span>
          <span className="flex-1 text-xs font-primary text-[var(--foreground)]">
            {log.message}
          </span>
        </div>
      ))}
    </div>
  );
}
