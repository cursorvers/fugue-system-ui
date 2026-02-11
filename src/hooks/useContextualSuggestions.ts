"use client";

import { useMemo } from "react";
import type { Agent, AgentRole } from "@/types";

export interface Suggestion {
  readonly icon: string;
  readonly label: string;
  readonly prompt: string;
}

// Static fallback when offline or no agents
const STATIC_SUGGESTIONS: readonly Suggestion[] = [
  {
    icon: "task_alt",
    label: "Task status",
    prompt: "Show current task list and progress",
  },
  {
    icon: "commit",
    label: "Git changes",
    prompt: "Check uncommitted changes and branch status across repos",
  },
  {
    icon: "monitoring",
    label: "System health",
    prompt: "Show provider response times and error rates",
  },
  {
    icon: "notification_important",
    label: "Alerts",
    prompt: "Show unresolved alerts",
  },
];

// Agent-role to contextual suggestion mapping
const ROLE_SUGGESTIONS: Partial<Record<AgentRole, Suggestion>> = {
  architect: {
    icon: "architecture",
    label: "Design review",
    prompt: "Review current architecture decisions and pending design tasks",
  },
  "code-reviewer": {
    icon: "rate_review",
    label: "Code review",
    prompt: "Show pending code reviews and recent review results",
  },
  "security-analyst": {
    icon: "shield",
    label: "Security scan",
    prompt: "Run a security check on recent changes",
  },
  "ui-reviewer": {
    icon: "palette",
    label: "UI review",
    prompt: "Review recent UI changes and design consistency",
  },
  designer: {
    icon: "draw",
    label: "Design status",
    prompt: "Show current design tasks and Pencil file status",
  },
  analyst: {
    icon: "analytics",
    label: "Analytics",
    prompt: "Show recent analysis results and insights",
  },
  reviewer: {
    icon: "checklist",
    label: "Review queue",
    prompt: "Show items waiting for review approval",
  },
  "general-reviewer": {
    icon: "summarize",
    label: "Summary",
    prompt: "Summarize today's activity across all agents",
  },
};

interface UseContextualSuggestionsOptions {
  readonly agents: readonly Agent[];
  readonly isConnected: boolean;
}

export function useContextualSuggestions({
  agents,
  isConnected,
}: UseContextualSuggestionsOptions): readonly Suggestion[] {
  return useMemo(() => {
    // Fallback to static suggestions when offline or no agents
    if (!isConnected || agents.length === 0) {
      return STATIC_SUGGESTIONS;
    }

    // Build contextual suggestions from active agents
    const activeAgents = agents.filter((a) => a.status === "active");
    const contextual: Suggestion[] = [];
    const seenRoles = new Set<string>();

    for (const agent of activeAgents) {
      if (seenRoles.has(agent.role)) continue;
      seenRoles.add(agent.role);

      const suggestion = ROLE_SUGGESTIONS[agent.role];
      if (suggestion) {
        contextual.push(suggestion);
      }
    }

    // Fill remaining slots with static suggestions (max 4 total)
    const maxSuggestions = 4;
    if (contextual.length < maxSuggestions) {
      const remaining = STATIC_SUGGESTIONS.filter(
        (s) => !contextual.some((c) => c.icon === s.icon)
      );
      contextual.push(...remaining.slice(0, maxSuggestions - contextual.length));
    }

    return contextual.slice(0, maxSuggestions);
  }, [agents, isConnected]);
}
