"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { useSupabaseAgents } from "@/hooks/useSupabaseAgents";
import { useSupabaseTasks } from "@/hooks/useSupabaseTasks";
import type { AgentStatus } from "@/types";

const statusBadge: Record<AgentStatus, "success" | "warning" | "secondary" | "error"> = {
  active: "success",
  idle: "warning",
  offline: "secondary",
  error: "error",
};

const statusIcon: Record<AgentStatus, string> = {
  active: "radio_button_checked",
  idle: "schedule",
  offline: "radio_button_unchecked",
  error: "error",
};

interface AgentStatusPanelProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function AgentStatusPanel({ isOpen, onClose }: AgentStatusPanelProps) {
  const [section, setSection] = useState<"agents" | "tasks">("agents");
  const { agents, loading: agentsLoading } = useSupabaseAgents();
  const { tasks } = useSupabaseTasks();

  const activeTasks = tasks.filter(
    (t) => t.status === "in_progress" || t.status === "pending"
  );
  const activeCount = agents.filter((a) => a.status === "active").length;

  if (!isOpen) return null;

  return (
    <aside className="w-[280px] h-full border-l border-[var(--border)] bg-[var(--card)] flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-sharp text-[16px] text-[var(--foreground)]">
            monitoring
          </span>
          <span className="text-[13px] font-primary font-semibold text-[var(--foreground)]">
            Status
          </span>
          <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
            {activeCount}/{agents.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-s)] hover:bg-[var(--secondary)] transition-colors"
          aria-label="パネルを閉じる"
        >
          <span className="material-symbols-sharp text-[16px] text-[var(--muted-foreground)]">
            close
          </span>
        </button>
      </div>

      {/* Section toggle */}
      <div className="flex border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setSection("agents")}
          className={`flex-1 py-2 text-[12px] font-primary font-medium transition-colors border-b-2 ${
            section === "agents"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Agents
        </button>
        <button
          type="button"
          onClick={() => setSection("tasks")}
          className={`flex-1 py-2 text-[12px] font-primary font-medium transition-colors border-b-2 ${
            section === "tasks"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Tasks
          {activeTasks.length > 0 && (
            <span className="ml-1 text-[10px] font-secondary text-[var(--color-info-foreground)]">
              {activeTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {section === "agents" ? (
          <div className="divide-y divide-[var(--border)]">
            {agentsLoading ? (
              <div className="px-3 py-6 text-center">
                <span className="material-symbols-sharp text-[24px] text-[var(--muted-foreground)] animate-spin">
                  progress_activity
                </span>
                <p className="text-[12px] font-primary text-[var(--muted-foreground)] mt-1">
                  Loading agents...
                </p>
              </div>
            ) : agents.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <span className="material-symbols-sharp text-[24px] text-[var(--muted-foreground)]">
                  smart_toy
                </span>
                <p className="text-[12px] font-primary text-[var(--muted-foreground)] mt-1">
                  No agents registered
                </p>
              </div>
            ) : null}
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--secondary)] transition-colors"
              >
                {/* Avatar + status dot */}
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-[var(--radius-s)] bg-[var(--muted)] flex items-center justify-center">
                    <span className="text-[11px] font-secondary font-semibold text-[var(--foreground)]">
                      {agent.name.charAt(0)}
                    </span>
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--card)] ${
                      agent.status === "active"
                        ? "bg-[var(--color-success-foreground)]"
                        : agent.status === "idle"
                          ? "bg-[var(--color-warning-foreground)]"
                          : "bg-[var(--muted-foreground)]"
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-primary font-medium text-[var(--foreground)] truncate">
                    {agent.name}
                  </p>
                  <p className="text-[10px] font-secondary text-[var(--muted-foreground)] truncate">
                    {agent.role}
                  </p>
                </div>

                {/* Status badge */}
                <Badge variant={statusBadge[agent.status]} className="text-[10px] flex-shrink-0">
                  <span className="material-symbols-sharp text-[10px]">
                    {statusIcon[agent.status]}
                  </span>
                  {agent.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {activeTasks.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <span className="material-symbols-sharp text-[24px] text-[var(--muted-foreground)]">
                  task_alt
                </span>
                <p className="text-[12px] font-primary text-[var(--muted-foreground)] mt-1">
                  No active tasks
                </p>
              </div>
            ) : (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="px-3 py-2.5 hover:bg-[var(--secondary)] transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`material-symbols-sharp text-[14px] mt-0.5 flex-shrink-0 ${
                        task.status === "in_progress"
                          ? "text-[var(--color-info-foreground)] pulse-live"
                          : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      {task.status === "in_progress" ? "progress_activity" : "schedule"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-primary text-[var(--foreground)] truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.assignee && (
                          <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">
                            {task.assignee}
                          </span>
                        )}
                        <Badge
                          variant={task.status === "in_progress" ? "info" : "secondary"}
                          className="text-[9px]"
                        >
                          {task.status === "in_progress" ? "running" : task.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer: link to Work page */}
      <div className="border-t border-[var(--border)] px-3 py-2">
        <a
          href="/work"
          className="flex items-center justify-center gap-1 text-[11px] font-primary text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <span className="material-symbols-sharp text-[14px]">open_in_new</span>
          Full monitoring
        </a>
      </div>
    </aside>
  );
}

// Mobile drawer version
interface AgentStatusDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function AgentStatusDrawer({ isOpen, onClose }: AgentStatusDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute right-0 top-0 h-full w-[300px] max-w-[85vw]">
        <AgentStatusPanel isOpen={true} onClose={onClose} />
      </div>
    </div>
  );
}
