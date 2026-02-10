"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  readonly message: Message;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusIndicator({ status }: { status?: Message["status"] }) {
  if (!status) return null;

  switch (status) {
    case "pending":
      return (
        <span className="material-symbols-sharp text-[12px] text-[var(--muted-foreground)] animate-pulse">
          hourglass_empty
        </span>
      );
    case "delegating":
      return (
        <span className="material-symbols-sharp text-[12px] text-[var(--color-info-foreground)] animate-pulse">
          sync
        </span>
      );
    case "completed":
      return (
        <span className="material-symbols-sharp text-[12px] text-[var(--color-success-foreground)]">
          check
        </span>
      );
    case "error":
      return (
        <span className="material-symbols-sharp text-[12px] text-[var(--color-error-foreground)]">
          error
        </span>
      );
    default:
      return null;
  }
}

function detectCodeBlocks(
  content: string
): readonly { readonly type: "text" | "code"; readonly content: string }[] {
  const parts: { type: "text" | "code"; content: string }[] = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: "code", content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content }];
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { type, content, timestamp, status, routing } = message;

  // System messages - centered, minimal
  if (type === "system") {
    return (
      <div className="flex justify-center py-1">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-pill)] bg-[var(--secondary)]">
          <StatusIndicator status={status} />
          <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
            {content}
          </span>
        </div>
      </div>
    );
  }

  const isUser = type === "user";
  const parts = useMemo(() => detectCodeBlocks(content), [content]);

  return (
    <div
      className={cn(
        "flex gap-2 py-1.5",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] lg:max-w-[70%] rounded-[var(--radius-l)] px-3.5 py-2.5",
          isUser
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--card)] border border-[var(--border)]"
        )}
      >
        {/* Routing badge */}
        {!isUser && routing?.suggestedAgent && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="material-symbols-sharp text-[12px] text-[var(--color-info-foreground)]">
              route
            </span>
            <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">
              {routing.suggestedAgent}
              {routing.confidence != null && (
                <> ({Math.round(routing.confidence * 100)}%)</>
              )}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          {parts.map((part, i) =>
            part.type === "code" ? (
              <pre
                key={i}
                className="bg-[var(--background)] rounded-[var(--radius-s)] px-3 py-2 overflow-x-auto text-[12px] font-secondary leading-relaxed text-[var(--foreground)]"
              >
                <code>{part.content}</code>
              </pre>
            ) : (
              <p
                key={i}
                className={cn(
                  "text-[14px] font-primary leading-relaxed whitespace-pre-wrap break-words",
                  isUser ? "" : "text-[var(--foreground)]"
                )}
              >
                {part.content}
              </p>
            )
          )}
        </div>

        {/* Footer: timestamp + status */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1.5",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <span
            className={cn(
              "text-[11px] font-secondary",
              isUser
                ? "text-[var(--primary-foreground)]/60"
                : "text-[var(--muted-foreground)]"
            )}
          >
            {formatTime(
              timestamp instanceof Date ? timestamp : new Date(timestamp)
            )}
          </span>
          <StatusIndicator status={status} />
        </div>

        {/* Details (log output) */}
        {message.details && message.details.length > 0 && (
          <details className="mt-2">
            <summary className="text-[11px] font-secondary text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)]">
              Details
            </summary>
            <pre className="mt-1 bg-[var(--background)] rounded-[var(--radius-s)] px-3 py-2 overflow-x-auto text-[11px] font-secondary leading-relaxed text-[var(--muted-foreground)]">
              {message.details.join("\n")}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
