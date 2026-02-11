"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AgentSchema, type Agent, type AgentStatus, type AgentRole } from "@/types";

interface SupabaseAgent {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly status: string;
  readonly tasks_count: number;
  readonly metadata: Record<string, unknown> | null;
  readonly created_at: string;
  readonly updated_at: string;
}

function toAgent(row: SupabaseAgent): Agent | null {
  const meta = row.metadata ?? {};
  const candidate = {
    id: row.id,
    name: row.name,
    role: row.role as AgentRole,
    status: row.status as AgentStatus,
    tasks: row.tasks_count,
    latency: typeof meta.latency === "string" ? meta.latency : "—",
    lastSeen: row.updated_at,
    provider: typeof meta.provider === "string"
      ? (meta.provider as Agent["provider"])
      : undefined,
  };
  const result = AgentSchema.safeParse(candidate);
  return result.success ? result.data : null;
}

interface UseSupabaseAgentsReturn {
  readonly agents: readonly Agent[];
  readonly loading: boolean;
  readonly error: string | null;
}

export function useSupabaseAgents(): UseSupabaseAgentsReturn {
  const [agents, setAgents] = useState<readonly Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAgents() {
      const { data, error: fetchError } = await supabase
        .from("fugue_agents")
        .select("*")
        .order("name");

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const parsed = (data as readonly SupabaseAgent[])
        .map(toAgent)
        .filter((a): a is Agent => a !== null);
      setAgents(parsed);
      setLoading(false);
    }

    fetchAgents();

    // Realtime subscription
    const channel = supabase
      .channel("fugue_agents_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fugue_agents" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newAgent = toAgent(payload.new as SupabaseAgent);
            if (newAgent) {
              setAgents((prev) => {
                if (prev.some((a) => a.id === newAgent.id)) return prev;
                return [...prev, newAgent];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = toAgent(payload.new as SupabaseAgent);
            if (updated) {
              setAgents((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a))
              );
            }
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setAgents((prev) => prev.filter((a) => a.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { agents, loading, error };
}
