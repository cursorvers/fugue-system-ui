"use client";

import { useMemo, type ReactNode } from "react";
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

// --- Inline Markdown: **bold**, *italic*, `code`, [text](url) ---

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex =
    /(\*\*(.+?)\*\*|\*([^*\s](?:[^*]*[^*\s])?)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      nodes.push(
        <strong key={key++} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      nodes.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      nodes.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded bg-[var(--secondary)] text-[13px] font-secondary"
        >
          {match[4]}
        </code>
      );
    } else if (match[5] && match[6]) {
      nodes.push(
        <a
          key={key++}
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--primary)] underline underline-offset-2 hover:opacity-80"
        >
          {match[5]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

// --- Block-level Markdown: headings, lists, paragraphs ---

function MarkdownBlock({ content }: { readonly content: string }) {
  const elements = useMemo(() => {
    const result: ReactNode[] = [];
    const lines = content.split("\n");
    let listItems: ReactNode[] = [];
    let listType: "ul" | "ol" | null = null;
    let key = 0;

    const flushList = () => {
      if (listType && listItems.length > 0) {
        const cls =
          listType === "ul"
            ? "list-disc list-inside space-y-0.5 ml-1"
            : "list-decimal list-inside space-y-0.5 ml-1";
        result.push(
          listType === "ul" ? (
            <ul key={key++} className={cls}>
              {listItems}
            </ul>
          ) : (
            <ol key={key++} className={cls}>
              {listItems}
            </ol>
          )
        );
        listItems = [];
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (!trimmed) {
        flushList();
        continue;
      }

      // Heading
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        flushList();
        result.push(
          <p key={key++} className="font-semibold">
            {renderInline(headingMatch[2])}
          </p>
        );
        continue;
      }

      // Unordered list
      const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
      if (ulMatch) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        listItems.push(<li key={key++}>{renderInline(ulMatch[1])}</li>);
        continue;
      }

      // Ordered list
      const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
      if (olMatch) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        listItems.push(<li key={key++}>{renderInline(olMatch[1])}</li>);
        continue;
      }

      // Regular text line
      flushList();
      result.push(<p key={key++}>{renderInline(trimmed)}</p>);
    }

    flushList();
    return result;
  }, [content]);

  return (
    <div className="space-y-1 text-[14px] font-primary leading-relaxed">
      {elements}
    </div>
  );
}

// --- Code Block Detection ---

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

// --- Typing Indicator ---

export function TypingIndicator() {
  return (
    <div className="flex gap-2 py-1.5 justify-start">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-l)] px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--muted-foreground)] animate-bounce"
              style={{
                animationDelay: `${i * 150}ms`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Message Bubble ---

export function MessageBubble({ message }: MessageBubbleProps) {
  const { type, content, timestamp, status, routing } = message;

  // System messages — centered, minimal
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
          "max-w-[85%] lg:max-w-[70%] rounded-[var(--radius-l)] px-3.5 py-2.5 transition-opacity",
          isUser
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--card)] border border-[var(--border)]",
          isUser && status === "pending" && "opacity-70"
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
            ) : isUser ? (
              <p
                key={i}
                className="text-[14px] font-primary leading-relaxed whitespace-pre-wrap break-words"
              >
                {part.content}
              </p>
            ) : (
              <MarkdownBlock key={i} content={part.content} />
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
                ? "text-[var(--primary-foreground)]/80"
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
              詳細
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
