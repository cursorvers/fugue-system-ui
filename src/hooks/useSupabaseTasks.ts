"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TaskStatus, TaskPriority } from "@/types";

interface SupabaseTask {
  readonly id: string;
  readonly project_id: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: string;
  readonly priority: string;
  readonly assignee_id: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

function toTask(row: SupabaseTask): Task {
  return {
    id: row.id,
    title: row.title,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    assignee: row.assignee_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    description: row.description ?? undefined,
  };
}

interface UseSupabaseTasksReturn {
  readonly tasks: readonly Task[];
  readonly loading: boolean;
  readonly error: string | null;
}

export function useSupabaseTasks(projectId?: string): UseSupabaseTasksReturn {
  const [tasks, setTasks] = useState<readonly Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      let query = supabase
        .from("fugue_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error: fetchError } = await query;

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setTasks((data as readonly SupabaseTask[]).map(toTask));
      setLoading(false);
    }

    fetchTasks();

    // Realtime subscription
    const channel = supabase
      .channel("fugue_tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fugue_tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = toTask(payload.new as SupabaseTask);
            if (!projectId || newTask.id.includes(projectId)) {
              setTasks((prev) => [newTask, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = toTask(payload.new as SupabaseTask);
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { tasks, loading, error };
}
