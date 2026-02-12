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
import { AmbientAgentBar } from "@/components/chat/AmbientAgentBar";
import { ExecutionPlanCard } from "@/components/chat/ExecutionPlanCard";
import { useProject } from "@/contexts/ProjectContext";
import { AgentsProvider } from "@/contexts/AgentsContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useExecutionPlan } from "@/hooks/useExecutionPlan";
import { useChatOrchestration } from "@/hooks/useChatOrchestration";
import { useWebSocket, type WebSocketMessage } from "@/hooks/useWebSocket";
import { BottomTabBar } from "@/components/BottomTabBar";
import { generateMockResponse } from "@/lib/mock-chat-responder";
import type { Message } from "@/types/chat";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <AgentsProvider>
        <ChatContent />
      </AgentsProvider>
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
  // Orchestration-first: panel open by default on desktop
  const [showStatusPanel, setShowStatusPanel] = useState(true);
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);

  // Execution plan approval flow
  const sendRef = useRef<((msg: WebSocketMessage) => void) | null>(null);
  const {
    plans,
    activePlan,
    addPlan,
    approvePlan,
    rejectPlan,
    updateStepStatus,
    dismissPlan,
  } = useExecutionPlan(
    (planId) => sendRef.current?.({ type: "approve-plan", planId }),
    (planId, reason) => sendRef.current?.({ type: "reject-plan", planId, reason }),
  );

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

  const { handleWebSocketMessage } = useChatOrchestration({
    addMessage,
    updateMessage,
    addPlan,
    updateStepStatus,
  });

  const { isConnected, isConnecting, error, send, sendChat } = useWebSocket({
    url: WS_URL,
    maxReconnectAttempts: 3,
    reconnectInterval: 5000,
    onMessage: handleWebSocketMessage,
  });

  // Keep send ref up to date for plan approval callbacks
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const handleSend = useCallback(
    (text: string) => {
      const userMsgId = `msg-${crypto.randomUUID()}`;

      addMessage({
        id: userMsgId,
        type: "user",
        content: text,
        timestamp: new Date(),
        status: "completed",
      });

      // Always send via WS if connected
      if (isConnected) {
        sendChat(text);
      }

      // Always generate mock response as fallback/demo
      setTimeout(() => {
        const response = generateMockResponse(text);
        addMessage({
          id: `mock-${crypto.randomUUID()}`,
          type: "orchestrator",
          content: response,
          timestamp: new Date(),
          status: "completed",
          routing: { suggestedAgent: "FUGUE", confidence: 1 },
        });
      }, 800);
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
    <div className="flex h-screen bg-[var(--background)] overflow-hidden pb-[var(--bottom-tab-offset)] md:pb-0">
      <div className="hidden md:block">
        <Sidebar activePage="chat" />
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <MobileNav activePage="chat" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-8 pt-4 md:pt-6 pb-2 md:pb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-primary font-semibold text-[var(--foreground)]">
              チャット
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
                  ? "接続中"
                  : isConnecting
                    ? "接続しています..."
                    : error || "未接続"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Agent status panel toggle */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setShowStatusPanel((prev) => !prev);
                } else {
                  setShowStatusDrawer(true);
                }
              }}
              className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-m)] border border-[var(--border)] transition-colors ${
                (showStatusPanel && window.innerWidth >= 1024) || showStatusDrawer
                  ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
              aria-label="エージェントステータス"
            >
              <span className="material-symbols-sharp text-[18px]">monitoring</span>
            </button>
            {/* Clear chat */}
            <button
              type="button"
              onClick={clearHistory}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-m)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              aria-label="チャットをクリア"
            >
              <span className="material-symbols-sharp text-[18px]">delete_sweep</span>
            </button>
          </div>
        </div>

        {/* Project tabs — one chat per project */}
        <ProjectTabs />

        {/* Chat area — single window per project, no conversation tabs */}
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-8 pb-4 md:pb-6 relative">
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
            aria-label="下にスクロール"
          >
            <span className="material-symbols-sharp text-[20px] text-[var(--foreground)]">
              keyboard_arrow_down
            </span>
          </button>

          {/* Execution Plan Cards */}
          {plans.length > 0 && (
            <div className="space-y-2 mb-2">
              {plans
                .filter((p) => {
                  if (p.status !== "completed") return true;
                  const ts = p.approvedAt ?? p.createdAt;
                  // Normalize: if numeric and < 1e12, treat as seconds epoch
                  const msValue = typeof ts === "number" ? (ts < 1e12 ? ts * 1000 : ts) : new Date(ts).getTime();
                  return Date.now() - msValue < 30000;
                })
                .slice(-3)
                .map((plan) => (
                  <ExecutionPlanCard
                    key={plan.id}
                    plan={plan}
                    onApprove={approvePlan}
                    onReject={rejectPlan}
                    onDismiss={dismissPlan}
                  />
                ))}
            </div>
          )}

          <AmbientAgentBar />
          <ChatInput isConnected={isConnected} onSend={handleSend} />
        </div>
      </main>

      {/* Desktop: side panel (lg+) */}
      <div className="hidden lg:block">
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

      <BottomTabBar />
    </div>
  );
}
