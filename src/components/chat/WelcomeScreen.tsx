"use client";

import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
  readonly isConnected: boolean;
  readonly onSendSuggestion: (text: string) => void;
}

const SUGGESTIONS: readonly {
  readonly icon: string;
  readonly label: string;
  readonly prompt: string;
}[] = [
  {
    icon: "task_alt",
    label: "タスク状況",
    prompt: "現在のタスク一覧と進捗を表示して",
  },
  {
    icon: "commit",
    label: "Git変更確認",
    prompt: "各リポジトリの未コミット変更とブランチ状態を確認して",
  },
  {
    icon: "monitoring",
    label: "稼働状態",
    prompt: "全プロバイダーの応答速度とエラー率を表示して",
  },
  {
    icon: "notification_important",
    label: "アラート確認",
    prompt: "未対応のアラートを表示して",
  },
];

export function WelcomeScreen({
  isConnected,
  onSendSuggestion,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-l)] bg-[var(--secondary)] mb-4">
        <span className="material-symbols-sharp text-[24px] text-[var(--primary)]">
          terminal
        </span>
      </div>

      {/* Title */}
      <h2 className="text-[16px] font-primary font-semibold text-[var(--foreground)] mb-1">
        FUGUE Orchestrator
      </h2>
      <p className="text-[13px] font-primary text-[var(--muted-foreground)] text-center max-w-[280px] mb-6">
        自然言語で何でも聞いてください。タスクは自動的に適切なエージェントにルーティングされます。
      </p>

      {/* Connection status */}
      <div className="flex items-center gap-1.5 mb-6">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            isConnected
              ? "bg-[var(--color-success-foreground)]"
              : "bg-[var(--color-error-foreground)] animate-pulse"
          )}
        />
        <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
          {isConnected ? "接続済み" : "接続中..."}
        </span>
      </div>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-[340px]">
        {SUGGESTIONS.map((s) => (
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
