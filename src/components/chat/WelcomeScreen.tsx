"use client";

import { cn } from "@/lib/utils";
import { useAgents } from "@/contexts/AgentsContext";
import { useContextualSuggestions } from "@/hooks/useContextualSuggestions";
import type { AgentStatus } from "@/types";

interface WelcomeScreenProps {
  readonly isConnected: boolean;
  readonly onSendSuggestion: (text: string) => void;
}

const statusColor: Record<AgentStatus, string> = {
  active: "bg-[var(--color-success-foreground)]",
  idle: "bg-[var(--color-warning-foreground)]",
  offline: "bg-[var(--muted-foreground)]",
  error: "bg-[var(--color-error-foreground)]",
};

export function WelcomeScreen({
  isConnected,
  onSendSuggestion,
}: WelcomeScreenProps) {
  const { agents, activeAgents, connectionState } = useAgents();
  const suggestions = useContextualSuggestions({ agents, isConnected });

  const idleCount = agents.filter((a) => a.status === "idle").length;
  const errorCount = agents.filter((a) => a.status === "error").length;
  const offlineCount = agents.filter((a) => a.status === "offline").length;

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
      {/* Orchestrator identity */}
      <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-l)] bg-[var(--secondary)] mb-3">
        <span className="material-symbols-sharp text-[24px] text-[var(--primary)]">
          hub
        </span>
      </div>

      <h2 className="text-[16px] font-primary font-semibold text-[var(--foreground)] mb-1">
        FUGUE Orchestrator
      </h2>
      <p className="text-[12px] font-primary text-[var(--muted-foreground)] text-center max-w-[300px] mb-5">
        マルチエージェント・オーケストレーション。監視・調整・指揮をここから。
      </p>

      {/* Agent fleet status — the key differentiator from Happy */}
      {agents.length > 0 && (
        <div className="flex items-center gap-4 mb-5 px-4 py-2.5 rounded-[var(--radius-m)] bg-[var(--secondary)] border border-[var(--border)]">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", statusColor.active)} />
            <span className="text-[11px] font-secondary text-[var(--foreground)]">
              {activeAgents.length} 稼働
            </span>
          </div>
          {idleCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", statusColor.idle)} />
              <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                {idleCount} 待機
              </span>
            </div>
          )}
          {errorCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", statusColor.error)} />
              <span className="text-[11px] font-secondary text-[var(--color-error-foreground)]">
                {errorCount} エラー
              </span>
            </div>
          )}
          {offlineCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", statusColor.offline)} />
              <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                {offlineCount} オフライン
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                connectionState === "ready" && "bg-[var(--color-success-foreground)]",
                connectionState === "connecting" && "bg-[var(--color-warning-foreground)] animate-pulse",
                connectionState === "stale" && "bg-[var(--color-warning-foreground)]",
                connectionState === "error" && "bg-[var(--color-error-foreground)]"
              )}
            />
            <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
              {connectionState === "ready"
                ? "リアルタイム"
                : connectionState === "stale"
                  ? "遅延"
                  : connectionState === "error"
                    ? "エラー"
                    : "接続中"}
            </span>
          </div>
        </div>
      )}

      {/* Agent fleet mini roster */}
      {agents.length > 0 && (
        <div className="flex items-center gap-1 mb-5">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                "w-7 h-7 rounded-full bg-[var(--muted)] flex items-center justify-center ring-1.5 transition-all",
                agent.status === "active"
                  ? "ring-[var(--color-success-foreground)]"
                  : agent.status === "idle"
                    ? "ring-[var(--color-warning-foreground)]"
                    : "ring-[var(--muted-foreground)]",
                agent.status === "active" && "pulse-live"
              )}
              title={`${agent.name} — ${agent.role} (${agent.status})`}
            >
              <span className="text-[10px] font-secondary font-bold text-[var(--foreground)]">
                {agent.name.charAt(0)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Contextual suggestion chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-[360px]">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onSendSuggestion(s.prompt)}
            disabled={!isConnected}
            className={cn(
              "flex items-center gap-2 px-3 py-3 rounded-[var(--radius-m)] border border-[var(--border)] text-left transition-colors min-h-[44px]",
              isConnected
                ? "hover:bg-[var(--secondary)] hover:border-[var(--muted-foreground)]"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="material-symbols-sharp text-[16px] text-[var(--primary)] flex-shrink-0">
              {s.icon}
            </span>
            <span className="text-[12px] font-primary text-[var(--foreground)] leading-tight">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
