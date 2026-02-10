"use client";

import { useState, useEffect, useCallback } from "react";
import type { Message } from "@/types/chat";

const MAX_MESSAGES = 100;
const LEGACY_KEY = "fugue-chat-history";

function storageKey(conversationId: string): string {
  return `fugue-chat-${conversationId}`;
}

function deserializeMessages(raw: string): readonly Message[] {
  const parsed = JSON.parse(raw) as readonly Message[];
  return parsed.map((msg) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));
}

function migrateLegacy(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const defaultKey = storageKey("default");
    if (!localStorage.getItem(defaultKey)) {
      localStorage.setItem(defaultKey, legacy);
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore migration errors
  }
}

interface UseChatHistoryReturn {
  readonly messages: readonly Message[];
  readonly addMessage: (msg: Message) => void;
  readonly updateMessage: (
    id: string,
    updates: Partial<Message>
  ) => void;
  readonly clearHistory: () => void;
}

export function useChatHistory(conversationId: string): UseChatHistoryReturn {
  const [messages, setMessages] = useState<readonly Message[]>([]);

  // Migrate legacy data once
  useEffect(() => {
    migrateLegacy();
  }, []);

  // Load messages for this conversation
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey(conversationId));
      if (saved) {
        setMessages(deserializeMessages(saved));
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  }, [conversationId]);

  // Persist on change
  useEffect(() => {
    if (!conversationId) return;
    const toSave = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(storageKey(conversationId), JSON.stringify(toSave));
  }, [messages, conversationId]);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateMessage = useCallback(
    (id: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
      );
    },
    []
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    if (conversationId) {
      localStorage.removeItem(storageKey(conversationId));
    }
  }, [conversationId]);

  return { messages, addMessage, updateMessage, clearHistory };
}
