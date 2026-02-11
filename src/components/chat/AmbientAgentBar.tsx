"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAgents } from "@/contexts/AgentsContext";
import type { Agent } from "@/types";

const MAX_VISIBLE_AVATARS = 5;

// Status color for avatar ring
function statusRingClass(status: Agent["status"]): string {
  switch (status) {
    case "active":
      return "ring-[var(--color-success-foreground)]";
    case "idle":
      return "ring-[var(--color-warning-foreground)]";
    case "error":
      return "ring-[var(--color-error-foreground)]";
    default:
      return "ring-[var(--muted-foreground)]";
  }
}

interface AmbientAgentBarProps {
  readonly onTapAgent?: (agentId: string) => void;
}

export function AmbientAgentBar({ onTapAgent }: AmbientAgentBarProps) {
  const { agents, activeAgents, connectionState } = useAgents();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // E5: VisualViewport keyboard detection (throttled via rAF)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let rafId: number | null = null;

    const handleResize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const heightRatio = vv.height / window.innerHeight;
        setKeyboardVisible(heightRatio < 0.75);
      });
    };

    vv.addEventListener("resize", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleAgentClick = useCallback(
    (agentId: string) => {
      onTapAgent?.(agentId);
    },
    [onTapAgent]
  );

  // Hide when keyboard is visible or no agents at all
  if (keyboardVisible || agents.length === 0) return null;

  const visibleAgents = agents.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = agents.length - MAX_VISIBLE_AVATARS;

  return (
    <div
      className="flex items-center gap-1.5 px-1 py-1 h-8"
      role="status"
      aria-label={`${activeAgents.length} active agents`}
    >
      {/* Connection state indicator */}
      {connectionState !== "ready" && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            connectionState === "connecting" && "bg-[var(--color-warning-foreground)] animate-pulse",
            connectionState === "stale" && "bg-[var(--color-warning-foreground)]",
            connectionState === "error" && "bg-[var(--color-error-foreground)]"
          )}
          title={connectionState}
        />
      )}

      {/* Agent mini avatars */}
      {visibleAgents.map((agent) => (
        <button
          key={agent.id}
          type="button"
          onClick={() => handleAgentClick(agent.id)}
          className={cn(
            "relative w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0 ring-1.5 transition-all",
            statusRingClass(agent.status),
            agent.status === "active" && "pulse-live"
          )}
          title={`${agent.name} (${agent.status})`}
          aria-label={`${agent.name}: ${agent.status}`}
        >
          <span className="text-[9px] font-secondary font-bold text-[var(--foreground)]">
            {agent.name.charAt(0)}
          </span>
        </button>
      ))}

      {/* Overflow count */}
      {overflowCount > 0 && (
        <span className="text-[10px] font-secondary text-[var(--muted-foreground)] flex-shrink-0 px-0.5">
          +{overflowCount}
        </span>
      )}

      {/* Orchestration summary */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">
          {activeAgents.length}/{agents.length} agents
        </span>
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            connectionState === "ready" && "bg-[var(--color-success-foreground)]",
            connectionState === "connecting" && "bg-[var(--color-warning-foreground)] animate-pulse",
            connectionState === "stale" && "bg-[var(--color-warning-foreground)]",
            connectionState === "error" && "bg-[var(--color-error-foreground)]"
          )}
        />
      </div>
    </div>
  );
}
