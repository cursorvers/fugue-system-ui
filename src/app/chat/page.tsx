"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProjectTabs } from "@/components/chat/ProjectTabs";
import { MessageBubble, TypingIndicator } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { AgentStatusPanel, AgentStatusDrawer } from "@/components/chat/AgentStatusPanel";
import { useProject } from "@/contexts/ProjectContext";
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
  const { activeProject } = useProject();
  // Each project has one chat — project ID is the conversation key
  const conversationId = activeProject?.id ?? "default";
  const { messages, addMessage, updateMessage, clearHistory } =
    useChatHistory(conversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollHeight, scrollTop, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollButton(distanceFromBottom > 100);
  }, []);

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
                  ? "タスクが完了しました"
                  : "タスクが失敗しました",
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
            "エラーが発生しました";
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
  });

  const handleSend = useCallback(
    (text: string) => {
      if (!isConnected) {
        addMessage({
          id: `error-${Date.now()}`,
          type: "system",
          content: "サーバーに未接続です。お待ちください...",
          timestamp: new Date(),
          status: "error",
        });
        return;
      }

      addMessage({
        id: `msg-${Date.now()}`,
        type: "user",
        content: text,
        timestamp: new Date(),
        status: "pending",
      });

      sendChat(text);
    },
    [isConnected, addMessage, sendChat]
  );

  // Filter out connection spam from old localStorage data
  const visibleMessages = useMemo(
    () =>
      messages.filter((m: Message) => {
        if (m.type !== "system") return true;
        if (
          m.content.includes("接続しました") ||
          m.content.includes("Connected to FUGUE")
        )
          return false;
        return true;
      }),
    [messages]
  );

  const visibleCount = visibleMessages.length;
  useEffect(() => {
    if (visibleCount > 0) scrollToBottom();
  }, [visibleCount, scrollToBottom]);

  const hasUserMessages = visibleMessages.some(
    (m: Message) => m.type !== "system"
  );

  const isWaitingForResponse = useMemo(() => {
    const lastUserMsg = [...visibleMessages]
      .reverse()
      .find((m) => m.type === "user");
    if (!lastUserMsg) return false;
    return (
      lastUserMsg.status === "pending" || lastUserMsg.status === "delegating"
    );
  }, [visibleMessages]);

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar activePage="chat" />
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <MobileNav activePage="chat" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-8 pt-4 lg:pt-6 pb-2 lg:pb-3">
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
          <div className="flex items-center gap-2">
            {/* Agent status panel toggle */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth >= 1280) {
                  setShowStatusPanel((prev) => !prev);
                } else {
                  setShowStatusDrawer(true);
                }
              }}
              className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-m)] border border-[var(--border)] transition-colors ${
                showStatusPanel
                  ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
              aria-label="Agent status"
            >
              <span className="material-symbols-sharp text-[18px]">monitoring</span>
            </button>
            {/* Clear chat */}
            <button
              type="button"
              onClick={clearHistory}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-m)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              aria-label="Clear chat"
            >
              <span className="material-symbols-sharp text-[18px]">delete_sweep</span>
            </button>
          </div>
        </div>

        {/* Project tabs — one chat per project */}
        <ProjectTabs />

        {/* Chat area — single window per project, no conversation tabs */}
        <div className="flex-1 flex flex-col min-h-0 px-4 lg:px-8 pb-4 lg:pb-6 relative">
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overscroll-contain"
          >
            {!hasUserMessages ? (
              <WelcomeScreen
                isConnected={isConnected}
                onSendSuggestion={handleSend}
              />
            ) : (
              <div className="space-y-1 py-4">
                {visibleMessages.map((message: Message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isWaitingForResponse && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Scroll to bottom */}
          <button
            onClick={scrollToBottom}
            className={`absolute bottom-20 right-6 flex items-center justify-center min-w-[44px] min-h-[44px] w-[44px] h-[44px] rounded-full bg-[var(--card)] border border-[var(--border)] shadow-md transition-opacity ${
              showScrollButton ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll to bottom"
          >
            <span className="material-symbols-sharp text-[20px] text-[var(--foreground)]">
              keyboard_arrow_down
            </span>
          </button>

          <ChatInput isConnected={isConnected} onSend={handleSend} />
        </div>
      </main>

      {/* Desktop: side panel (xl+) */}
      <div className="hidden xl:block">
        <AgentStatusPanel
          isOpen={showStatusPanel}
          onClose={() => setShowStatusPanel(false)}
        />
      </div>

      {/* Mobile/tablet: drawer overlay */}
      <AgentStatusDrawer
        isOpen={showStatusDrawer}
        onClose={() => setShowStatusDrawer(false)}
      />
    </div>
  );
}
