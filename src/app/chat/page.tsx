"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/Card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useWebSocket, type WebSocketMessage } from "@/hooks/useWebSocket";

interface Message {
  id: string;
  type: "user" | "orchestrator" | "system";
  content: string;
  timestamp: Date;
  status?: "pending" | "delegating" | "completed" | "error";
  details?: string[];
  routing?: {
    suggestedAgent?: string;
    confidence?: number;
  };
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://cockpit-public-ws.masa-stage1.workers.dev/ws";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fugue-chat-history");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Restore Date objects
          return parsed.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Keep only last 50 messages to avoid storage bloat
      const toSave = messages.slice(-50);
      localStorage.setItem("fugue-chat-history", JSON.stringify(toSave));
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Only scroll when message count changes (not on every update)
  const messageCount = messages.length;
  useEffect(() => {
    if (messageCount > 0) {
      scrollToBottom();
    }
  }, [messageCount]);

  const handleWebSocketMessage = (wsMessage: WebSocketMessage) => {
    console.log("[Chat] WebSocket message:", wsMessage);

    switch (wsMessage.type) {
      case "ack":
        // Acknowledgment from server
        if (wsMessage.taskId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === wsMessage.taskId
                ? { ...msg, status: "delegating" as const }
                : msg
            )
          );
        }
        break;

      case "chat-response":
        // Response from orchestrator
        const payload = wsMessage.payload as {
          taskId: string;
          role: string;
          content: string;
          timestamp: number;
        };
        if (payload) {
          const newMessage: Message = {
            id: `resp-${Date.now()}`,
            type: payload.role === "system" ? "system" : "orchestrator",
            content: payload.content,
            timestamp: new Date(payload.timestamp * 1000),
            status: "completed",
          };
          setMessages((prev) => [...prev, newMessage]);
        }
        break;

      case "task_created":
        // Task was created in the system
        const task = wsMessage.payload as {
          id: string;
          title: string;
          status: string;
          executor: string;
        };
        if (task) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === task.id
                ? {
                    ...msg,
                    status: "delegating" as const,
                    routing: { suggestedAgent: task.executor },
                  }
                : msg
            )
          );
        }
        break;

      case "task-result":
        // Task completed
        const result = wsMessage as unknown as {
          taskId: string;
          status: string;
          result: unknown;
          logs?: string;
        };
        if (result.taskId) {
          const resultMessage: Message = {
            id: `result-${Date.now()}`,
            type: "orchestrator",
            content:
              result.status === "completed"
                ? `Task completed successfully.`
                : `Task failed.`,
            timestamp: new Date(),
            status: result.status === "completed" ? "completed" : "error",
            details: result.logs ? [result.logs] : undefined,
          };
          setMessages((prev) => [...prev, resultMessage]);
        }
        break;

      case "error":
        // Error from server
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          type: "system",
          content: (wsMessage.message as string) || "An error occurred",
          timestamp: new Date(),
          status: "error",
        };
        setMessages((prev) => [...prev, errorMsg]);
        break;
    }
  };

  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);

  const { isConnected, isConnecting, error, sendChat, sendCommand } = useWebSocket({
    url: WS_URL,
    maxReconnectAttempts: 3,
    reconnectInterval: 5000,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      setHasConnectedOnce(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-connected-${Date.now()}`,
          type: "system",
          content: "Connected to FUGUE Orchestrator",
          timestamp: new Date(),
        },
      ]);
    },
    // Don't add messages on close to avoid spam during reconnect attempts
  });

  const handleSend = () => {
    if (!input.trim()) return;
    if (!isConnected) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: "system",
        content: "Not connected to server. Please wait...",
        timestamp: new Date(),
        status: "error",
      };
      setMessages((prev) => [...prev, errorMsg]);
      return;
    }

    const messageId = `msg-${Date.now()}`;
    const trimmedInput = input.trim();

    // Add user message to chat
    const newMessage: Message = {
      id: messageId,
      type: "user",
      content: trimmedInput,
      timestamp: new Date(),
      status: "pending",
    };
    setMessages((prev) => [...prev, newMessage]);

    // Check if it's a command (starts with /)
    if (trimmedInput.startsWith("/")) {
      const parts = trimmedInput.slice(1).split(" ");
      const command = parts[0];
      const args = parts.slice(1);
      sendCommand(command, args.length > 0 ? args : undefined);
    } else {
      sendChat(trimmedInput);
    }

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      {/* Sidebar hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar activePage="chat" />
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--sidebar)]">
          <a href="/" className="flex items-center gap-2 text-[var(--foreground)]">
            <span className="material-symbols-sharp text-xl">arrow_back</span>
            <span className="text-sm font-medium">Home</span>
          </a>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-green-500"
                  : isConnecting
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-xs text-[var(--muted-foreground)]">
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 lg:p-10 min-h-0 overflow-hidden">
          <div className="mb-4 lg:mb-6 hidden lg:block">
            <div className="flex items-center gap-3">
              <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                Chat with Orchestrator
              </h1>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? "bg-green-500"
                    : isConnecting
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
                }`}
                title={isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
              />
            </div>
            <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
            {isConnected
              ? "Send commands and receive responses from FUGUE"
              : error || "Connecting to server..."}
          </p>
        </div>

        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto overscroll-contain p-3 lg:p-5">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-[var(--muted-foreground)] py-8">
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs mt-2">
                    Try: <code className="bg-[var(--sidebar)] px-2 py-1 rounded">/work</code>,{" "}
                    <code className="bg-[var(--sidebar)] px-2 py-1 rounded">/review</code>, or ask a
                    question
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <div className="p-3 lg:p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 lg:gap-3 bg-[var(--sidebar)] rounded-xl px-3 lg:px-4 py-2 lg:py-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isConnected
                    ? "Type a message or command (e.g., /work, /review)..."
                    : "Connecting..."
                }
                disabled={!isConnected}
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!isConnected || !input.trim()}
                className="w-9 h-9 lg:w-10 lg:h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-sharp text-white text-lg lg:text-xl">send</span>
              </button>
            </div>
          </div>
        </Card>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";

  return (
    <div className={`flex gap-2 lg:gap-3 ${isUser ? "" : ""}`}>
      <div
        className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-[var(--primary)]"
            : isSystem
            ? "bg-[var(--muted-foreground)]"
            : "bg-[var(--color-success)]"
        }`}
      >
        <span className="material-symbols-sharp text-white text-xs lg:text-sm">
          {isUser ? "person" : isSystem ? "info" : "smart_toy"}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-primary text-xs lg:text-sm font-medium text-[var(--foreground)]">
            {isUser ? "You" : isSystem ? "System" : "FUGUE Orchestrator"}
          </span>
          <span className="text-[10px] lg:text-xs text-[var(--muted-foreground)]">
            {formatTime(message.timestamp)}
          </span>
          {message.status === "delegating" && (
            <span className="text-[10px] lg:text-xs text-[var(--primary)] animate-pulse">
              delegating...
            </span>
          )}
          {message.routing?.suggestedAgent && (
            <span className="text-[10px] lg:text-xs text-[var(--muted-foreground)]">
              → {message.routing.suggestedAgent}
            </span>
          )}
        </div>

        <div className="text-xs lg:text-sm text-[var(--foreground)] break-words">
          <p>{message.content}</p>
          {message.status === "completed" && message.type === "orchestrator" && (
            <p className="text-[var(--color-success-foreground)] mt-1">✓ Completed</p>
          )}
          {message.status === "error" && (
            <p className="text-red-500 mt-1">✗ Error</p>
          )}
          {message.details && (
            <div className="mt-2 text-[var(--muted-foreground)] text-[10px] lg:text-xs space-y-1 bg-[var(--sidebar)] p-2 rounded-lg">
              {message.details.map((detail, i) => (
                <p key={i} className="font-mono">
                  {detail}
                </p>
              ))}
            </div>
          )}
        </div>
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
