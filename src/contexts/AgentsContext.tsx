"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { AgentSchema, type Agent, type AgentStatus, type AgentRole } from "@/types";

// --- Connection state machine ---
type ConnectionState = "connecting" | "ready" | "stale" | "error";

interface SupabaseAgent {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly status: string;
  readonly tasks_count: number;
  readonly metadata: Record<string, unknown> | null;
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
    latency: typeof meta.latency === "string" ? meta.latency : "\u2014",
    lastSeen: row.updated_at,
    provider:
      typeof meta.provider === "string"
        ? (meta.provider as Agent["provider"])
        : undefined,
  };
  const result = AgentSchema.safeParse(candidate);
  return result.success ? result.data : null;
}

// --- Context value ---
interface AgentsContextValue {
  readonly agents: readonly Agent[];
  readonly activeAgents: readonly Agent[];
  readonly connectionState: ConnectionState;
  readonly error: string | null;
}

const AgentsContext = createContext<AgentsContextValue | null>(null);

// --- Provider ---
interface AgentsProviderProps {
  readonly children: ReactNode;
}

export function AgentsProvider({ children }: AgentsProviderProps) {
  const [agents, setAgents] = useState<readonly Agent[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Guarded snapshot fetch (checks cancelled before every setState)
    const fetchSnapshot = async () => {
      const { data, error: fetchError } = await supabase
        .from("fugue_agents")
        .select("id, name, role, status, tasks_count, metadata, updated_at")
        .order("name");

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setConnectionState("error");
        return;
      }

      const parsed = (data as readonly SupabaseAgent[])
        .map(toAgent)
        .filter((a): a is Agent => a !== null);
      setAgents(parsed);
      setConnectionState("ready");
      setError(null);
    };

    // Initial fetch
    setConnectionState("connecting");
    fetchSnapshot();

    // Single Realtime subscription (E7: dedup)
    const channel = supabase
      .channel("agents_provider_single")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fugue_agents" },
        (payload) => {
          if (cancelled) return;

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
              setAgents((prev) => {
                const idx = prev.findIndex((a) => a.id === updated.id);
                if (idx === -1) return prev;
                // Skip if content identical (avoid re-render)
                const existing = prev[idx];
                if (
                  existing.status === updated.status &&
                  existing.tasks === updated.tasks &&
                  existing.latency === updated.latency &&
                  existing.lastSeen === updated.lastSeen
                ) {
                  return prev;
                }
                return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
              });
            }
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setAgents((prev) => prev.filter((a) => a.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        if (cancelled) return;

        if (status === "SUBSCRIBED") {
          setConnectionState("ready");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionState("error");
          setError("Realtime subscription error");
        } else if (status === "TIMED_OUT") {
          // E6: reconnect with full snapshot refetch
          setConnectionState("stale");
          fetchSnapshot();
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const activeAgents = useMemo(
    () => agents.filter((a) => a.status === "active"),
    [agents]
  );

  const value = useMemo<AgentsContextValue>(
    () => ({
      agents,
      activeAgents,
      connectionState,
      error,
    }),
    [agents, activeAgents, connectionState, error]
  );

  return (
    <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
  );
}

// --- Hook ---
export function useAgents(): AgentsContextValue {
  const ctx = useContext(AgentsContext);
  if (!ctx) {
    throw new Error("useAgents must be used within <AgentsProvider>");
  }
  return ctx;
}
