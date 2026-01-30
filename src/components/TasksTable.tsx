"use client";

import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

interface Task {
  id: string;
  name: string;
  agent: string;
  agentColor: string;
  status: "Completed" | "In Progress" | "Queued" | "Failed";
  duration: string;
  started: string;
}

interface TasksTableProps {
  tasks: Task[];
  className?: string;
}

export function TasksTable({ tasks, className }: TasksTableProps) {
  const statusVariant = {
    Completed: "success" as const,
    "In Progress": "secondary" as const,
    Queued: "secondary" as const,
    Failed: "error" as const,
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-0 py-3 border-b border-[var(--border)]">
        <span className="w-[200px] text-xs font-secondary font-medium text-[var(--muted-foreground)]">
          Task
        </span>
        <span className="w-[100px] text-xs font-secondary font-medium text-[var(--muted-foreground)]">
          Agent
        </span>
        <span className="w-[100px] text-xs font-secondary font-medium text-[var(--muted-foreground)]">
          Status
        </span>
        <span className="w-[80px] text-xs font-secondary font-medium text-[var(--muted-foreground)]">
          Duration
        </span>
        <span className="flex-1 text-xs font-secondary font-medium text-[var(--muted-foreground)]">
          Started
        </span>
      </div>

      {/* Rows */}
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 px-0 py-4 border-b border-[var(--border)]"
        >
          <span className="w-[200px] text-sm font-secondary text-[var(--foreground)] truncate">
            {task.name}
          </span>
          <span
            className="w-[100px] text-[13px] font-primary"
            style={{ color: task.agentColor }}
          >
            {task.agent}
          </span>
          <div className="w-[100px]">
            <Badge variant={statusVariant[task.status]}>{task.status}</Badge>
          </div>
          <span className="w-[80px] text-[13px] font-primary text-[var(--muted-foreground)]">
            {task.duration}
          </span>
          <span className="flex-1 text-[13px] font-secondary text-[var(--muted-foreground)]">
            {task.started}
          </span>
        </div>
      ))}
    </div>
  );
}
