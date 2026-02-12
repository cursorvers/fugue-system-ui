"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Run, RunStatus } from "@/types";

interface SupabaseRun {
  readonly id: string;
  readonly task_id: string;
  readonly project_id: string | null;
  readonly agent_id: string;
  readonly status: string;
  readonly duration_ms: number | null;
  readonly summary: string | null;
  readonly created_at: string;
}

const STATUS_MAP: Record<string, RunStatus> = {
  completed: "completed",
  running: "running",
  failed: "failed",
  queued: "queued",
  cancelled: "cancelled",
};

function toRun(row: SupabaseRun): Run {
  const durationMs = row.duration_ms ?? 0;
  const durationStr = durationMs > 0 ? `${Math.round(durationMs / 1000)}s` : "\u2014";

  return {
    id: row.id.slice(0, 8),
    name: row.summary ?? "Untitled run",
    status: STATUS_MAP[row.status] ?? "queued",
    duration: durationStr,
    agent: row.agent_id,
    startedAt: new Date(row.created_at).toISOString(),
    completedAt: row.status === "completed" || row.status === "failed"
      ? new Date(row.created_at).toISOString()
      : undefined,
  };
}

const LIMIT = 10;

export function useSupabaseRuns() {
  const [runs, setRuns] = useState<readonly Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRuns = async () => {
      const { data, error } = await supabase
        .from("fugue_runs")
        .select("id, task_id, project_id, agent_id, status, duration_ms, summary, created_at")
        .order("created_at", { ascending: false })
        .limit(LIMIT);

      if (cancelled) return;

      if (error) {
        setLoading(false);
        return;
      }

      const parsed = (data as readonly SupabaseRun[]).map(toRun);
      setRuns(parsed);
      setLoading(false);
    };

    fetchRuns();

    // Realtime subscription for new runs
    const channel = supabase
      .channel("runs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "fugue_runs" },
        (payload) => {
          if (cancelled) return;
          const newRun = toRun(payload.new as SupabaseRun);
          setRuns((prev) => [newRun, ...prev].slice(0, LIMIT));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "fugue_runs" },
        (payload) => {
          if (cancelled) return;
          const updated = toRun(payload.new as SupabaseRun);
          setRuns((prev) => {
            const idx = prev.findIndex((r) => r.id === updated.id);
            if (idx === -1) return prev;
            return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { runs, loading } as const;
}
