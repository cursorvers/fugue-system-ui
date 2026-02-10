"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConversationTabs } from "@/components/chat/ConversationTabs";
import { MessageBubble, TypingIndicator } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { useConversation } from "@/contexts/ConversationContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useWebSocket, type WebSocketMessage } from "@/hooks/useWebSocket";
import type { Message } from "@/types/chat";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}

function ChatContent() {
  const {
    activeConversation,
    createConversation,
    startNewConversation,
  } = useConversation();

  const conversationId = activeConversation?.id ?? "";
  const { messages, addMessage, updateMessage } =
    useChatHistory(conversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const messageCount = messages.length;
  useEffect(() => {
    if (messageCount > 0) scrollToBottom();
  }, [messageCount, scrollToBottom]);

  const handleWebSocketMessage = useCallback(
    (wsMessage: WebSocketMessage) => {
      switch (wsMessage.type) {
        case "ack": {
          const taskId = wsMessage.taskId as string | undefined;
          const routing = wsMessage.routing as {
            suggestedAgent?: string;
            confidence?: number;
          } | undefined;
          if (taskId) {
            updateMessage(taskId, {
              status: "delegating" as const,
              routing: routing
                ? {
                    suggestedAgent: routing.suggestedAgent,
                    confidence: routing.confidence,
                  }
                : undefined,
            });
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
          };
          if (payload) {
            const content = payload.content || payload.message || "";
            if (!content) break;
            addMessage({
              id: `resp-${Date.now()}`,
              type: payload.role === "system" ? "system" : "orchestrator",
              content,
              timestamp: payload.timestamp
                ? new Date(payload.timestamp * 1000)
                : new Date(),
              status: payload.done === false ? "delegating" : "completed",
            });
          }
          break;
        }

        case "task_created": {
          const payload = wsMessage.payload as {
            id: string;
            executor?: string;
          };
          if (payload) {
            updateMessage(payload.id, {
              status: "delegating" as const,
              routing: { suggestedAgent: payload.executor },
            });
          }
          break;
        }

        case "task-result": {
          const taskId = wsMessage.taskId as string | undefined;
          const status = wsMessage.status as string | undefined;
          const logs = wsMessage.logs as string | undefined;
          if (taskId) {
            addMessage({
              id: `result-${Date.now()}`,
              type: "orchestrator",
              content:
                status === "completed"
                  ? "Task completed successfully."
                  : "Task failed.",
              timestamp: new Date(),
              status: status === "completed" ? "completed" : "error",
              details: logs ? [logs] : undefined,
            });
          }
          break;
        }

        case "error": {
          const errorMsg =
            (wsMessage.message as string) ||
            (wsMessage.payload as { message?: string })?.message ||
            "An error occurred";
          addMessage({
            id: `error-${Date.now()}`,
            type: "system",
            content: errorMsg,
            timestamp: new Date(),
            status: "error",
          });
          break;
        }

        default:
          break;
      }
    },
    [addMessage, updateMessage]
  );

  const { isConnected, isConnecting, error, sendChat } = useWebSocket({
    url: WS_URL,
    maxReconnectAttempts: 3,
    reconnectInterval: 5000,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      addMessage({
        id: `sys-connected-${Date.now()}`,
        type: "system",
        content: "Connected to FUGUE Orchestrator",
        timestamp: new Date(),
      });
    },
  });

  const handleSend = useCallback(
    (text: string) => {
      if (!isConnected) {
        addMessage({
          id: `error-${Date.now()}`,
          type: "system",
          content: "Not connected to server. Please wait...",
          timestamp: new Date(),
          status: "error",
        });
        return;
      }

      const msg: Message = {
        id: `msg-${Date.now()}`,
        type: "user",
        content: text,
        timestamp: new Date(),
        status: "pending",
      };

      if (!activeConversation) {
        // Create conversation + pre-seed localStorage so the message
        // survives the React re-render with new conversationId
        const newConv = createConversation(text);
        try {
          localStorage.setItem(
            `fugue-chat-${newConv.id}`,
            JSON.stringify([msg])
          );
        } catch {
          // ignore storage errors
        }
      } else {
        addMessage(msg);
      }

      sendChat(text);
    },
    [isConnected, activeConversation, createConversation, addMessage, sendChat]
  );

  const hasUserMessages = messages.some((m: Message) => m.type !== "system");

  // Show typing indicator when the last user message is pending/delegating
  const isWaitingForResponse = useMemo(() => {
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.type === "user");
    if (!lastUserMsg) return false;
    return (
      lastUserMsg.status === "pending" || lastUserMsg.status === "delegating"
    );
  }, [messages]);

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
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected
                      ? "bg-[var(--color-success-foreground)]"
                      : isConnecting
                        ? "bg-[var(--color-warning-foreground)] pulse-live"
                        : "bg-[var(--color-error-foreground)]"
                  }`}
                />
                <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                  {isConnected
                    ? "Connected"
                    : isConnecting
                      ? "Connecting..."
                      : error || "Disconnected"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={startNewConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-[var(--radius-m)] border border-[var(--border)] text-[12px] font-primary text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          >
            <span className="material-symbols-sharp text-[14px]">add</span>
            New Chat
          </button>
        </div>

        {/* Conversation tabs */}
        <ConversationTabs />

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0 px-4 lg:px-8 pb-4 lg:pb-6">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {!hasUserMessages ? (
              <WelcomeScreen
                isConnected={isConnected}
                onSendSuggestion={handleSend}
              />
            ) : (
              <div className="space-y-1 py-4">
                {messages.map((message: Message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isWaitingForResponse && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <ChatInput isConnected={isConnected} onSend={handleSend} />
        </div>
      </main>
    </div>
  );
}
