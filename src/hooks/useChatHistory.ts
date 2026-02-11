"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Message } from "@/types/chat";

const MAX_MESSAGES = 100;

interface SupabaseMessage {
  readonly id: string;
  readonly project_id: string;
  readonly type: string;
  readonly content: Record<string, unknown>;
  readonly status: string;
  readonly routing: Record<string, unknown> | null;
  readonly created_at: string;
  readonly updated_at: string;
}

function toMessage(row: SupabaseMessage): Message {
  const content = row.content;
  return {
    id: row.id,
    type: row.type as Message["type"],
    content: typeof content.text === "string" ? content.text : JSON.stringify(content),
    timestamp: new Date(row.created_at),
    status: row.status as Message["status"],
    details: Array.isArray(content.details)
      ? (content.details as readonly string[])
      : undefined,
    routing: row.routing
      ? {
          suggestedAgent: typeof row.routing.suggestedAgent === "string"
            ? row.routing.suggestedAgent
            : undefined,
          confidence: typeof row.routing.confidence === "number"
            ? row.routing.confidence
            : undefined,
        }
      : undefined,
    projectId: row.project_id,
  };
}

function toSupabaseInsert(msg: Message, projectId: string) {
  return {
    id: msg.id,
    project_id: projectId,
    type: msg.type,
    content: {
      text: msg.content,
      ...(msg.details ? { details: msg.details } : {}),
    },
    status: msg.status ?? "completed",
    routing: msg.routing ?? null,
  };
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load messages from Supabase
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function fetchMessages() {
      const { data, error } = await supabase
        .from("fugue_messages")
        .select("*")
        .eq("project_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(MAX_MESSAGES);

      if (cancelled) return;

      if (error) {
        // Fallback to localStorage if Supabase fails
        try {
          const saved = localStorage.getItem(`fugue-chat-${conversationId}`);
          if (saved) {
            const parsed = JSON.parse(saved) as readonly Message[];
            setMessages(
              parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
            );
          } else {
            setMessages([]);
          }
        } catch {
          setMessages([]);
        }
        return;
      }

      setMessages((data as readonly SupabaseMessage[]).map(toMessage));
    }

    fetchMessages();

    // Realtime subscription for this project's messages
    const channel = supabase
      .channel(`fugue_messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fugue_messages",
          filter: `project_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = toMessage(payload.new as SupabaseMessage);
          setMessages((prev) => {
            // Avoid duplicates (we may have optimistically added it)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "fugue_messages",
          filter: `project_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = toMessage(payload.new as SupabaseMessage);
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  const addMessage = useCallback(
    (msg: Message) => {
      // Optimistic update
      setMessages((prev) => [...prev, msg]);

      // Persist to Supabase
      const projectId = conversationId || "default";
      supabase
        .from("fugue_messages")
        .insert(toSupabaseInsert(msg, projectId))
        .then(({ error }) => {
          if (error) {
            // Fallback: save to localStorage
            try {
              const key = `fugue-chat-${projectId}`;
              const existing = localStorage.getItem(key);
              const arr = existing ? JSON.parse(existing) : [];
              localStorage.setItem(
                key,
                JSON.stringify([...arr, msg].slice(-MAX_MESSAGES))
              );
            } catch {
              // ignore
            }
          }
        });
    },
    [conversationId]
  );

  const updateMessage = useCallback(
    (id: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
      );

      // Update in Supabase
      const supabaseUpdates: Record<string, unknown> = {};
      if (updates.status) {
        supabaseUpdates.status = updates.status;
      }
      if (updates.content !== undefined) {
        supabaseUpdates.content = { text: updates.content };
      }
      if (updates.routing !== undefined) {
        supabaseUpdates.routing = updates.routing;
      }

      if (Object.keys(supabaseUpdates).length > 0) {
        supabase.from("fugue_messages").update(supabaseUpdates).eq("id", id).then();
      }
    },
    []
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    if (conversationId) {
      localStorage.removeItem(`fugue-chat-${conversationId}`);
      // Delete from Supabase
      supabase
        .from("fugue_messages")
        .delete()
        .eq("project_id", conversationId)
        .then();
    }
  }, [conversationId]);

  return { messages, addMessage, updateMessage, clearHistory };
}
