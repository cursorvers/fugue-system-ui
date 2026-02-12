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
    label: "タスク状況",
    prompt: "進行中のタスクと進捗を表示して",
  },
  {
    icon: "commit",
    label: "Git変更",
    prompt: "未コミットの変更とブランチ状態を確認して",
  },
  {
    icon: "monitoring",
    label: "システム状態",
    prompt: "プロバイダの応答時間とエラー率を表示して",
  },
  {
    icon: "notification_important",
    label: "アラート",
    prompt: "未解決のアラートを表示して",
  },
];

// Agent-role to contextual suggestion mapping
const ROLE_SUGGESTIONS: Partial<Record<AgentRole, Suggestion>> = {
  architect: {
    icon: "architecture",
    label: "設計レビュー",
    prompt: "現在のアーキテクチャ判断と保留中の設計タスクをレビューして",
  },
  "code-reviewer": {
    icon: "rate_review",
    label: "コードレビュー",
    prompt: "保留中のコードレビューと最近のレビュー結果を表示して",
  },
  "security-analyst": {
    icon: "shield",
    label: "セキュリティ",
    prompt: "最近の変更に対してセキュリティチェックを実行して",
  },
  "ui-reviewer": {
    icon: "palette",
    label: "UIレビュー",
    prompt: "最近のUI変更とデザインの一貫性をレビューして",
  },
  designer: {
    icon: "draw",
    label: "デザイン状況",
    prompt: "現在のデザインタスクとPencilファイルの状態を表示して",
  },
  analyst: {
    icon: "analytics",
    label: "分析",
    prompt: "最近の分析結果とインサイトを表示して",
  },
  reviewer: {
    icon: "checklist",
    label: "レビュー待ち",
    prompt: "レビュー承認待ちの項目を表示して",
  },
  "general-reviewer": {
    icon: "summarize",
    label: "サマリー",
    prompt: "本日の全エージェントの活動を要約して",
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
