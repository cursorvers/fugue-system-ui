"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useConversation } from "@/contexts/ConversationContext";

export function ConversationTabs() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    deleteConversation,
    createConversation,
  } = useConversation();

  const handleNewChat = useCallback(() => {
    createConversation("New conversation");
  }, [createConversation]);

  return (
    <div className="flex items-center gap-1 px-4 lg:px-8 pb-2 overflow-hidden">
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0"
        role="tablist"
        aria-label="Conversations"
      >
        {conversations.map((conv) => {
          const isActive = conv.id === activeConversation?.id;
          return (
            <button
              key={conv.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveConversation(conv.id)}
              className={cn(
                "group flex items-center gap-1.5 px-3 rounded-[var(--radius-m)] text-[12px] font-primary whitespace-nowrap transition-colors flex-shrink-0 min-h-[44px]",
                isActive
                  ? "bg-[var(--secondary)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <span className="truncate max-w-[140px]">{conv.title}</span>
              <span
                role="button"
                aria-label={`Close ${conv.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className={cn(
                  "material-symbols-sharp text-[14px] rounded-[var(--radius-xs)] p-0.5 transition-colors",
                  isActive
                    ? "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)]"
                    : "opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                close
              </span>
            </button>
          );
        })}
      </div>

      {/* New conversation */}
      <button
        onClick={handleNewChat}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[var(--radius-m)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors flex-shrink-0"
        aria-label="New conversation"
      >
        <span className="material-symbols-sharp text-[16px]">add</span>
      </button>
    </div>
  );
}
