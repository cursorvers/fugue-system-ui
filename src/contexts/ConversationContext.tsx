"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Conversation } from "@/types/project";
import { useProject } from "@/contexts/ProjectContext";

interface ConversationContextType {
  readonly conversations: readonly Conversation[];
  readonly activeConversation: Conversation | null;
  readonly createConversation: (firstMessage: string) => Conversation;
  readonly setActiveConversation: (id: string) => void;
  readonly deleteConversation: (id: string) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined
);

function storageKey(projectId: string): string {
  return `fugue-conversations-${projectId}`;
}

function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 30) return trimmed;
  return `${trimmed.slice(0, 30)}\u2026`;
}

function loadConversations(projectId: string): readonly Conversation[] {
  try {
    const saved = localStorage.getItem(storageKey(projectId));
    if (saved) {
      return JSON.parse(saved) as readonly Conversation[];
    }
  } catch {
    // ignore
  }
  return [];
}

export function ConversationProvider({ children }: { children: ReactNode }) {
  const { activeProject } = useProject();
  const projectId = activeProject?.id ?? "";

  const [conversations, setConversations] = useState<readonly Conversation[]>(
    []
  );
  const [activeConversationId, setActiveConversationId] = useState<string>("");

  // Reload conversations when project changes
  useEffect(() => {
    if (!projectId) {
      setConversations([]);
      setActiveConversationId("");
      return;
    }
    const loaded = loadConversations(projectId);
    setConversations(loaded);
    // Activate the most recent conversation, or none
    const sorted = [...loaded].sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );
    setActiveConversationId(sorted[0]?.id ?? "");
  }, [projectId]);

  // Persist conversations
  useEffect(() => {
    if (!projectId) return;
    localStorage.setItem(storageKey(projectId), JSON.stringify(conversations));
  }, [conversations, projectId]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  const createConversation = useCallback(
    (firstMessage: string): Conversation => {
      const now = new Date().toISOString();
      const conversation: Conversation = {
        id: `conv-${Date.now()}`,
        projectId,
        title: generateTitle(firstMessage),
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
      };
      setConversations((prev) => [...prev, conversation]);
      setActiveConversationId(conversation.id);
      return conversation;
    },
    [projectId]
  );

  const setActiveConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId((prev) => {
          const remaining = conversations.filter((c) => c.id !== id);
          return remaining[0]?.id ?? "";
        });
      }
    },
    [activeConversationId, conversations]
  );

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        activeConversation,
        createConversation,
        setActiveConversation,
        deleteConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error(
      "useConversation must be used within a ConversationProvider"
    );
  }
  return context;
}
