import { mockAgents } from "@/data/mock-agents";
import { mockTasks } from "@/data/mock-tasks";
import { mockRuns } from "@/data/mock-runs";
import type { Agent } from "@/types";

// Keyword-based intent matching for demo mode chat
interface Intent {
  readonly keywords: readonly string[];
  readonly respond: () => string;
}

function agentStatusLine(a: Agent): string {
  const statusJa: Record<string, string> = {
    active: "稼働中",
    idle: "待機中",
    offline: "オフライン",
    error: "エラー",
  };
  return `- **${a.name}** (${a.role}): ${statusJa[a.status] ?? a.status} — ${a.tasks}タスク, ${a.latency}`;
}

const INTENTS: readonly Intent[] = [
  {
    keywords: ["タスク", "進行", "作業", "task", "やること", "todo"],
    respond: () => {
      const inProgress = mockTasks.filter((t) => t.status === "in_progress");
      const pending = mockTasks.filter((t) => t.status === "pending");
      const blocked = mockTasks.filter((t) => t.status === "blocked");

      const lines: string[] = [];
      if (inProgress.length > 0) {
        lines.push(`**進行中 (${inProgress.length}件)**`);
        for (const t of inProgress) {
          lines.push(`- ${t.title} — 担当: ${t.assignee ?? "未割当"} [${t.priority}]`);
        }
      }
      if (pending.length > 0) {
        lines.push(`\n**待機中 (${pending.length}件)**`);
        for (const t of pending) {
          lines.push(`- ${t.title} [${t.priority}]`);
        }
      }
      if (blocked.length > 0) {
        lines.push(`\n**ブロック中 (${blocked.length}件)**`);
        for (const t of blocked) {
          lines.push(`- ${t.title} — ${t.description ?? ""}`);
        }
      }
      if (lines.length === 0) {
        return "現在タスクはありません。";
      }
      return lines.join("\n");
    },
  },
  {
    keywords: ["エージェント", "agent", "稼働", "誰", "チーム", "フリート"],
    respond: () => {
      const active = mockAgents.filter((a) => a.status === "active");
      const idle = mockAgents.filter((a) => a.status === "idle");
      const offline = mockAgents.filter(
        (a) => a.status === "offline" || a.status === "error"
      );

      const lines = [
        `**エージェント (${mockAgents.length}体)**`,
        "",
        `稼働中: ${active.length} / 待機: ${idle.length} / オフライン: ${offline.length}`,
        "",
        ...mockAgents.map(agentStatusLine),
      ];
      return lines.join("\n");
    },
  },
  {
    keywords: ["実行", "run", "ラン", "最近", "履歴"],
    respond: () => {
      const lines = ["**最近の実行**", ""];
      const statusJa: Record<string, string> = {
        completed: "完了",
        running: "実行中",
        failed: "失敗",
        queued: "待機",
        cancelled: "キャンセル",
      };
      for (const r of mockRuns) {
        lines.push(
          `- ${r.name} — ${statusJa[r.status] ?? r.status} (${r.duration}, ${r.agent})`
        );
      }
      return lines.join("\n");
    },
  },
  {
    keywords: ["ステータス", "状態", "status", "概要", "サマリー", "まとめ"],
    respond: () => {
      const active = mockAgents.filter((a) => a.status === "active").length;
      const inProgress = mockTasks.filter((t) => t.status === "in_progress").length;
      const pending = mockTasks.filter((t) => t.status === "pending").length;
      const completedRuns = mockRuns.filter((r) => r.status === "completed").length;

      return [
        "**システム概要**",
        "",
        `- エージェント: ${active}/${mockAgents.length} 稼働中`,
        `- タスク: ${inProgress}件 進行中, ${pending}件 待機中`,
        `- 最近の実行: ${completedRuns}/${mockRuns.length} 完了`,
        `- 成功率: 98.5%`,
        `- 平均レイテンシ: 0.7s`,
      ].join("\n");
    },
  },
  {
    keywords: ["セキュリティ", "security", "脆弱", "audit"],
    respond: () => {
      return [
        "**セキュリティ状況**",
        "",
        "- Codex security-analyst: XSSリスクを1件検出（user input handler）",
        "- OWASP Top 10 監査: 待機中（task-004）",
        "- CSPヘッダー: 設定済み",
        "- 認証: JWT + HttpOnly Cookie",
      ].join("\n");
    },
  },
  {
    keywords: ["ヘルプ", "help", "使い方", "何ができる", "コマンド"],
    respond: () => {
      return [
        "**FUGUE チャットコマンド**",
        "",
        "以下の質問に対応しています:",
        "- 「進行中のタスクは？」— タスク一覧",
        "- 「エージェントの状態は？」— エージェント稼働状況",
        "- 「最近の実行は？」— 実行履歴",
        "- 「ステータスは？」— システム概要",
        "- 「セキュリティは？」— セキュリティ状況",
        "",
        "*デモモードで動作中。ライブ接続時はリアルタイムデータを表示します。*",
      ].join("\n");
    },
  },
];

const FALLBACK_RESPONSE =
  "了解しました。現在デモモードで動作中のため、限定的な応答のみ可能です。\n\n「ヘルプ」と入力すると利用可能なコマンドを確認できます。";

/**
 * Match user input to a mock response based on keyword matching.
 * Returns the response string after a simulated delay.
 */
export function generateMockResponse(input: string): string {
  const normalized = input.toLowerCase();

  for (const intent of INTENTS) {
    if (intent.keywords.some((kw) => normalized.includes(kw))) {
      return intent.respond();
    }
  }

  return FALLBACK_RESPONSE;
}
