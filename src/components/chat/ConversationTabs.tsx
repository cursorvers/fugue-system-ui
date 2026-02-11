"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useConversation } from "@/contexts/ConversationContext";

export function ConversationTabs() {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    deleteConversation,
    startNewConversation,
  } = useConversation();

  const handleNewChat = useCallback(() => {
    startNewConversation();
  }, [startNewConversation]);

  // Hide tab bar when fewer than 2 conversations
  if (conversations.length < 2) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 px-4 lg:px-8 pb-2 overflow-hidden">
      <div
        className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0"
        role="tablist"
        aria-label="会話一覧"
      >
        {conversations.map((conv) => {
          const isActive = conv.id === activeConversation?.id;
          return (
            <div
              key={conv.id}
              role="presentation"
              className={cn(
                "group flex items-center rounded-[var(--radius-m)] text-[12px] font-primary whitespace-nowrap transition-colors flex-shrink-0 min-h-[44px]",
                isActive
                  ? "bg-[var(--secondary)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveConversation(conv.id)}
                className="truncate max-w-[140px] px-3 py-2 bg-transparent border-none text-inherit text-[12px] font-primary cursor-pointer min-h-[44px]"
              >
                {conv.title}
              </button>
              {isActive && (
                <button
                  type="button"
                  aria-label={`${conv.title}を閉じる`}
                  onClick={() => deleteConversation(conv.id)}
                  className="material-symbols-sharp text-[14px] rounded-[var(--radius-xs)] p-1 mr-1 transition-colors bg-transparent border-none cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)]"
                >
                  close
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* New conversation — only shown alongside existing tabs */}
      <button
        onClick={handleNewChat}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[var(--radius-m)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors flex-shrink-0"
        aria-label="新規会話"
      >
        <span className="material-symbols-sharp text-[16px]">add</span>
      </button>
    </div>
  );
}
