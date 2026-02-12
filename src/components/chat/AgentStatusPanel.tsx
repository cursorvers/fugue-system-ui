"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/Badge";
import { useAgents } from "@/contexts/AgentsContext";
import { useSupabaseTasks } from "@/hooks/useSupabaseTasks";
import type { Agent, AgentStatus } from "@/types";

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

const statusLabel: Record<AgentStatus, string> = {
  active: "稼働中",
  idle: "待機中",
  offline: "オフライン",
  error: "エラー",
};

// --- E3: Debounced status with minimum display time ---
const STATUS_DEBOUNCE_MS = 300;
const STATUS_MIN_DISPLAY_MS = 500;

function useDebouncedStatus(status: AgentStatus): AgentStatus {
  const [displayed, setDisplayed] = useState(status);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChangeRef = useRef(Date.now());

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const elapsed = Date.now() - lastChangeRef.current;
    const minWait = Math.max(STATUS_MIN_DISPLAY_MS - elapsed, 0);
    const delay = Math.max(STATUS_DEBOUNCE_MS, minWait);

    timerRef.current = setTimeout(() => {
      setDisplayed(status);
      lastChangeRef.current = Date.now();
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status]);

  return displayed;
}

// --- Skeleton row for loading state ---
function SkeletonRow() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 animate-pulse">
      <div className="w-7 h-7 rounded-[var(--radius-s)] bg-[var(--muted)]" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3 w-20 rounded bg-[var(--muted)]" />
        <div className="h-2.5 w-14 rounded bg-[var(--muted)]" />
      </div>
      <div className="h-4 w-12 rounded-[var(--radius-pill)] bg-[var(--muted)]" />
    </div>
  );
}

// --- Progressive Disclosure Agent Card ---
interface AgentCardProps {
  readonly agent: Agent;
}

function AgentCard({ agent }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const debouncedStatus = useDebouncedStatus(agent.status);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div className="border-b border-[var(--border)]">
      {/* Collapsed row — always visible */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--secondary)] transition-colors text-left"
        aria-expanded={expanded}
      >
        {/* Avatar + status dot */}
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-[var(--radius-s)] bg-[var(--muted)] flex items-center justify-center">
            <span className="text-[11px] font-secondary font-semibold text-[var(--foreground)]">
              {agent.name.charAt(0)}
            </span>
          </div>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--card)]",
              debouncedStatus === "active" && "bg-[var(--color-success-foreground)]",
              debouncedStatus === "idle" && "bg-[var(--color-warning-foreground)]",
              debouncedStatus === "error" && "bg-[var(--color-error-foreground)]",
              debouncedStatus === "offline" && "bg-[var(--muted-foreground)]"
            )}
          />
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-primary font-medium text-[var(--foreground)] truncate">
            {agent.name}
          </p>
        </div>

        {/* Status badge */}
        <Badge variant={statusBadge[debouncedStatus]} className="text-[10px] flex-shrink-0">
          <span className="material-symbols-sharp text-[10px]">
            {statusIcon[debouncedStatus]}
          </span>
          {statusLabel[debouncedStatus]}
        </Badge>

        {/* Expand chevron */}
        <span
          className={cn(
            "material-symbols-sharp text-[14px] text-[var(--muted-foreground)] transition-transform",
            expanded && "rotate-180"
          )}
        >
          expand_more
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-2.5 pl-[42px] space-y-1">
          <div className="flex items-center gap-3 text-[10px] font-secondary text-[var(--muted-foreground)]">
            <span>役割: {agent.role}</span>
            {agent.provider && <span>プロバイダ: {agent.provider}</span>}
          </div>
          <div className="flex items-center gap-3 text-[10px] font-secondary text-[var(--muted-foreground)]">
            <span>タスク: {agent.tasks}</span>
            <span>遅延: {agent.latency}</span>
          </div>
          {agent.lastSeen && (
            <p className="text-[10px] font-secondary text-[var(--muted-foreground)]">
              最終確認: {new Date(agent.lastSeen).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Panel (unmounts hooks when closed) ---
interface AgentStatusPanelProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function AgentStatusPanel({ isOpen, onClose }: AgentStatusPanelProps) {
  if (!isOpen) return null;
  return <AgentStatusPanelContent onClose={onClose} />;
}

function AgentStatusPanelContent({ onClose }: { readonly onClose: () => void }) {
  const [section, setSection] = useState<"agents" | "tasks">("agents");
  const { agents, connectionState } = useAgents();
  const agentsLoading = connectionState === "connecting";
  const { tasks } = useSupabaseTasks();

  const activeTasks = tasks.filter(
    (t) => t.status === "in_progress" || t.status === "pending"
  );
  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <aside className="w-[280px] h-full border-l border-[var(--border)] bg-[var(--card)] flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-sharp text-[16px] text-[var(--foreground)]">
            monitoring
          </span>
          <span className="text-[13px] font-primary font-semibold text-[var(--foreground)]">
            ステータス
          </span>
          <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
            {activeCount}/{agents.length}
          </span>
          {/* Connection state indicator */}
          {connectionState !== "ready" && (
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                connectionState === "connecting" && "bg-[var(--color-warning-foreground)] animate-pulse",
                connectionState === "stale" && "bg-[var(--color-warning-foreground)]",
                connectionState === "error" && "bg-[var(--color-error-foreground)]"
              )}
              title={connectionState}
            />
          )}
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
          エージェント
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
          タスク
          {activeTasks.length > 0 && (
            <span className="ml-1 text-[10px] font-secondary text-[var(--color-info-foreground)]">
              {activeTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" aria-live="polite" aria-relevant="additions text">
        {section === "agents" ? (
          <div>
            {agentsLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : agents.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <span className="material-symbols-sharp text-[24px] text-[var(--muted-foreground)]">
                  smart_toy
                </span>
                <p className="text-[12px] font-primary text-[var(--muted-foreground)] mt-1">
                  登録済みエージェントなし
                </p>
              </div>
            ) : (
              agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {activeTasks.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <span className="material-symbols-sharp text-[24px] text-[var(--muted-foreground)]">
                  task_alt
                </span>
                <p className="text-[12px] font-primary text-[var(--muted-foreground)] mt-1">
                  実行中のタスクなし
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
                          {task.status === "in_progress" ? "実行中" : task.status === "pending" ? "保留中" : task.status}
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
          詳細モニタリング
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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[300px] max-w-[85vw]">
        <AgentStatusPanel isOpen={true} onClose={onClose} />
      </div>
    </div>
  );
}
