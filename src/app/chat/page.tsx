"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useWebSocket, type WebSocketMessage } from "@/hooks/useWebSocket";

interface Message {
  readonly id: string;
  readonly type: "user" | "orchestrator" | "system";
  readonly content: string;
  readonly timestamp: Date;
  readonly status?: "pending" | "delegating" | "completed" | "error";
  readonly details?: readonly string[];
  readonly routing?: {
    readonly suggestedAgent?: string;
    readonly confidence?: number;
  };
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://cockpit-public-ws.masa-stage1.workers.dev/ws";

const quickCommands = [
  { cmd: "/work", label: "Work", icon: "folder_open", description: "Execute pending tasks" },
  { cmd: "/review", label: "Review", icon: "rate_review", description: "Run code review" },
  { cmd: "/sync", label: "Sync", icon: "sync", description: "Check progress" },
  { cmd: "/plan", label: "Plan", icon: "architecture", description: "Create implementation plan" },
] as const;

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}

function ChatContent() {
  const [messages, setMessages] = useState<readonly Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("fugue-chat-history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.slice(-50);
      localStorage.setItem("fugue-chat-history", JSON.stringify(toSave));
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const messageCount = messages.length;
  useEffect(() => {
    if (messageCount > 0) scrollToBottom();
  }, [messageCount, scrollToBottom]);

  const handleWebSocketMessage = useCallback((wsMessage: WebSocketMessage) => {
    switch (wsMessage.type) {
      case "ack": {
        const taskId = wsMessage.taskId as string | undefined;
        const routing = wsMessage.routing as {
          suggestedAgent?: string;
          confidence?: number;
        } | undefined;
        if (taskId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === taskId
                ? {
                    ...msg,
                    status: "delegating" as const,
                    routing: routing
                      ? { suggestedAgent: routing.suggestedAgent, confidence: routing.confidence }
                      : msg.routing,
                  }
                : msg
            )
          );
        }
        break;
      }

      case "chat-response": {
        const payload = wsMessage.payload as {
          taskId?: string;
          role?: string;
          content?: string;
          message?: string;
          timestamp?: number;
          done?: boolean;
          streaming?: boolean;
        };
        if (payload) {
          const content = payload.content || payload.message || "";
          if (!content) break;

          setMessages((prev) => [...prev, {
            id: `resp-${Date.now()}`,
            type: payload.role === "system" ? "system" : "orchestrator",
            content,
            timestamp: payload.timestamp
              ? new Date(payload.timestamp * 1000)
              : new Date(),
            status: payload.done === false ? "delegating" : "completed",
          }]);
        }
        break;
      }

      case "task_created": {
        const payload = wsMessage.payload as {
          id: string;
          title: string;
          status: string;
          executor?: string;
        };
        if (payload) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.id
                ? {
                    ...msg,
                    status: "delegating" as const,
                    routing: { suggestedAgent: payload.executor },
                  }
                : msg
            )
          );
        }
        break;
      }

      case "task-result": {
        const taskId = wsMessage.taskId as string | undefined;
        const status = wsMessage.status as string | undefined;
        const logs = wsMessage.logs as string | undefined;
        if (taskId) {
          setMessages((prev) => [...prev, {
            id: `result-${Date.now()}`,
            type: "orchestrator",
            content: status === "completed" ? "Task completed successfully." : "Task failed.",
            timestamp: new Date(),
            status: status === "completed" ? "completed" : "error",
            details: logs ? [logs] : undefined,
          }]);
        }
        break;
      }

      case "error": {
        const errorMsg =
          (wsMessage.message as string) ||
          (wsMessage.payload as { message?: string })?.message ||
          "An error occurred";
        setMessages((prev) => [...prev, {
          id: `error-${Date.now()}`,
          type: "system",
          content: errorMsg,
          timestamp: new Date(),
          status: "error",
        }]);
        break;
      }

      default:
        break;
    }
  }, []);

  const { isConnected, isConnecting, error, sendChat, sendCommand } = useWebSocket({
    url: WS_URL,
    maxReconnectAttempts: 3,
    reconnectInterval: 5000,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      setMessages((prev) => [...prev, {
        id: `sys-connected-${Date.now()}`,
        type: "system",
        content: "Connected to FUGUE Orchestrator",
        timestamp: new Date(),
      }]);
    },
  });

  const handleSend = useCallback((text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;
    if (!isConnected) {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        type: "system",
        content: "Not connected to server. Please wait...",
        timestamp: new Date(),
        status: "error",
      }]);
      return;
    }

    const msgId = `msg-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: msgId,
      type: "user",
      content: trimmed,
      timestamp: new Date(),
      status: "pending",
    }]);

    if (trimmed.startsWith("/")) {
      const parts = trimmed.slice(1).split(" ");
      sendCommand(parts[0], parts.length > 1 ? parts.slice(1) : undefined);
    } else {
      sendChat(trimmed);
    }

    setInput("");
    inputRef.current?.focus();
  }, [input, isConnected, sendChat, sendCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem("fugue-chat-history");
  }, []);

  const hasUserMessages = messages.some((m) => m.type !== "system");

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar activePage="chat" />
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <MobileNav activePage="chat" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-8 pt-4 lg:pt-8 pb-2 lg:pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-primary font-semibold text-[var(--foreground)]">
                Chat
              </h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-[var(--color-success-foreground)]" :
                  isConnecting ? "bg-[var(--color-warning-foreground)] pulse-live" :
                  "bg-[var(--color-error-foreground)]"
                }`} />
                <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                  {isConnected ? "Connected" : isConnecting ? "Connecting..." : error || "Disconnected"}
                </span>
              </div>
            </div>
            <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5 hidden lg:block">
              Send commands to FUGUE Orchestrator
            </p>
          </div>
          {hasUserMessages && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-m)] border border-[var(--border)] text-[12px] font-primary text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <span className="material-symbols-sharp text-[14px]">add</span>
              New Chat
            </button>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0 px-4 lg:px-8 pb-4 lg:pb-6">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {!hasUserMessages ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-4">
                  <span className="material-symbols-sharp text-[32px] text-[var(--muted-foreground)]">smart_toy</span>
                </div>
                <h2 className="text-[15px] font-primary font-semibold text-[var(--foreground)] mb-1">
                  FUGUE Orchestrator
                </h2>
                <p className="text-[12px] font-secondary text-[var(--muted-foreground)] max-w-sm mb-6">
                  Route tasks to agents, run reviews, execute plans, or ask anything about your system.
                </p>

                {/* Quick commands */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {quickCommands.map((qc) => (
                    <button
                      key={qc.cmd}
                      onClick={() => handleSend(qc.cmd)}
                      disabled={!isConnected}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-sharp text-[18px] text-[var(--primary)]">{qc.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-primary font-medium text-[var(--foreground)]">{qc.label}</p>
                        <p className="text-[10px] font-secondary text-[var(--muted-foreground)]">{qc.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Suggestions */}
                <div className="mt-6 space-y-1.5">
                  <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">Or try asking</p>
                  {[
                    "Review the latest changes in auth.ts",
                    "What is the current system status?",
                    "Run security analysis on payments module",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      disabled={!isConnected}
                      className="block text-[12px] font-secondary text-[var(--primary)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      &ldquo;{suggestion}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message list */
              <div className="space-y-1 py-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="pt-3">
            {/* Quick command chips (when there are messages) */}
            {hasUserMessages && (
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto">
                {quickCommands.map((qc) => (
                  <button
                    key={qc.cmd}
                    onClick={() => handleSend(qc.cmd)}
                    disabled={!isConnected}
                    className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-pill)] border border-[var(--border)] text-[10px] font-secondary text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    <span className="material-symbols-sharp text-[12px]">{qc.icon}</span>
                    {qc.cmd}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-l)] px-4 py-2.5 shadow-[var(--shadow-xs)] focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:border-transparent transition-all">
              <span className="material-symbols-sharp text-[18px] text-[var(--muted-foreground)] flex-shrink-0">
                {input.startsWith("/") ? "terminal" : "chat_bubble"}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isConnected ? "Message or /command..." : "Connecting..."}
                disabled={!isConnected}
                className="flex-1 bg-transparent text-[13px] font-primary text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none disabled:opacity-50"
              />
              {input.startsWith("/") && (
                <span className="text-[10px] font-secondary text-[var(--primary)] flex-shrink-0">command</span>
              )}
              <button
                onClick={() => handleSend()}
                disabled={!isConnected || !input.trim()}
                className="w-8 h-8 rounded-[var(--radius-m)] bg-[var(--primary)] flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                <span className="material-symbols-sharp text-[var(--primary-foreground)] text-[16px]">arrow_upward</span>
              </button>
            </div>

            <p className="text-[10px] font-secondary text-[var(--muted-foreground)] text-center mt-2">
              Press <span className="kbd">Enter</span> to send · <span className="kbd">/</span> for commands
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { readonly message: Message }) {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="h-px bg-[var(--border)] flex-1" />
        <div className="flex items-center gap-1.5 px-3">
          <span className={`material-symbols-sharp text-[12px] ${
            message.status === "error" ? "text-[var(--color-error-foreground)]" : "text-[var(--muted-foreground)]"
          }`}>
            {message.status === "error" ? "error" : "info"}
          </span>
          <span className={`text-[11px] font-secondary ${
            message.status === "error" ? "text-[var(--color-error-foreground)]" : "text-[var(--muted-foreground)]"
          }`}>
            {message.content}
          </span>
          <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="h-px bg-[var(--border)] flex-1" />
      </div>
    );
  }

  return (
    <div className={`flex gap-3 py-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-[var(--radius-m)] flex items-center justify-center flex-shrink-0 ${
        isUser ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
      }`}>
        <span className={`material-symbols-sharp text-[14px] ${
          isUser ? "text-[var(--primary-foreground)]" : "text-[var(--foreground)]"
        }`}>
          {isUser ? "person" : "smart_toy"}
        </span>
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] min-w-0 ${isUser ? "items-end" : ""}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-primary font-medium text-[var(--foreground)]">
            {isUser ? "You" : "Orchestrator"}
          </span>
          <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">
            {formatTime(message.timestamp)}
          </span>
          {message.status === "delegating" && message.routing?.suggestedAgent && (
            <Badge variant="info" className="text-[9px]">
              → {message.routing.suggestedAgent}
            </Badge>
          )}
          {message.status === "delegating" && !message.routing?.suggestedAgent && (
            <span className="text-[10px] font-secondary text-[var(--primary)] pulse-live">routing...</span>
          )}
        </div>

        <div className={`rounded-[var(--radius-l)] px-3.5 py-2.5 ${
          isUser
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--card)] border border-[var(--border)]"
        }`}>
          <p className={`text-[13px] font-primary leading-relaxed break-words ${
            isUser ? "" : "text-[var(--foreground)]"
          }`}>
            {message.content}
          </p>

          {message.status === "completed" && message.type === "orchestrator" && (
            <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-[var(--border)]">
              <span className="material-symbols-sharp text-[12px] text-[var(--color-success-foreground)]">check_circle</span>
              <span className="text-[10px] font-secondary text-[var(--color-success-foreground)]">Completed</span>
            </div>
          )}
          {message.status === "error" && message.type !== "user" && (
            <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-[var(--border)]">
              <span className="material-symbols-sharp text-[12px] text-[var(--color-error-foreground)]">error</span>
              <span className="text-[10px] font-secondary text-[var(--color-error-foreground)]">Failed</span>
            </div>
          )}
        </div>

        {message.details && (
          <div className="mt-1.5 bg-[var(--muted)] rounded-[var(--radius-m)] px-3 py-2 space-y-0.5">
            {message.details.map((detail, i) => (
              <p key={i} className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                {detail}
              </p>
            ))}
          </div>
        )}

        {message.status === "pending" && isUser && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">Sending</span>
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)] animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)] animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)] animate-pulse" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
