import { generateMockResponse } from "@/lib/mock-chat-responder";
import { supabase } from "@/lib/supabase";

type ChatIntent =
  | "failure"
  | "task"
  | "agent"
  | "development-status"
  | "other";

interface FugueRunRow {
  readonly summary: string | null;
  readonly status: string;
  readonly agent_id: string | null;
}

interface FugueAgentRow {
  readonly name: string;
  readonly role: string;
  readonly status: string;
}

interface FugueTaskRow {
  readonly title: string;
  readonly priority: string;
  readonly assignee_id: string | null;
}

interface IntentConfig {
  readonly intent: ChatIntent;
  readonly keywords: readonly string[];
}

const INTENT_PRIORITY: readonly IntentConfig[] = [
  {
    intent: "failure",
    keywords: ["失敗", "failed", "failure", "エラー", "error", "障害", "落ち"],
  },
  {
    intent: "task",
    keywords: ["タスク", "task", "進行", "作業", "todo", "やること"],
  },
  {
    intent: "agent",
    keywords: ["エージェント", "agent", "担当", "誰が", "役割", "メンバー"],
  },
  {
    intent: "development-status",
    keywords: ["開発状況", "状況", "ステータス", "status", "サマリー", "概要", "最近"],
  },
];

const HELP_RESPONSE = [
  "対応可能な質問例:",
  "- 「失敗した実行は？」",
  "- 「進行中のタスクは？」",
  "- 「エージェント一覧を見せて」",
  "- 「開発状況を教えて」",
].join("\n");

function detectIntent(input: string): ChatIntent {
  const normalized = input.toLowerCase();

  for (const config of INTENT_PRIORITY) {
    if (config.keywords.some((keyword) => normalized.includes(keyword))) {
      return config.intent;
    }
  }

  return "other";
}

function formatRunLine(row: FugueRunRow): string {
  return `- ${row.summary ?? "Untitled run"} | ${row.status} | ${row.agent_id ?? "unknown"}`;
}

function fallbackResponse(input: string, reason: string): string {
  console.warn(`[chat-intent-router] ${reason}`);
  return generateMockResponse(input);
}

async function getDevelopmentStatus(input: string): Promise<string> {
  if (!supabase) {
    return fallbackResponse(input, "Supabase client unavailable for development status");
  }

  const { data, error } = await supabase
    .from("fugue_runs")
    .select("summary, status, agent_id")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data || data.length === 0) {
    return fallbackResponse(
      input,
      `Development status fallback: ${error?.message ?? "empty result"}`
    );
  }

  return ["最新の開発状況:", ...((data as readonly FugueRunRow[]).map(formatRunLine))].join(
    "\n"
  );
}

async function getAgents(input: string): Promise<string> {
  if (!supabase) {
    return fallbackResponse(input, "Supabase client unavailable for agents");
  }

  const { data, error } = await supabase
    .from("fugue_agents")
    .select("name, role, status")
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    return fallbackResponse(
      input,
      `Agents fallback: ${error?.message ?? "empty result"}`
    );
  }

  return ["エージェント一覧:", ...((data as readonly FugueAgentRow[]).map((row) => (
    `- ${row.name} | ${row.role} | ${row.status}`
  )))].join("\n");
}

async function getTasks(input: string): Promise<string> {
  if (!supabase) {
    return fallbackResponse(input, "Supabase client unavailable for tasks");
  }

  const { data, error } = await supabase
    .from("fugue_tasks")
    .select("title, priority, assignee_id")
    .eq("status", "in_progress")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return fallbackResponse(
      input,
      `Tasks fallback: ${error?.message ?? "empty result"}`
    );
  }

  return ["進行中タスク:", ...((data as readonly FugueTaskRow[]).map((row) => (
    `- ${row.title} | ${row.priority} | ${row.assignee_id ?? "unassigned"}`
  )))].join("\n");
}

async function getFailures(input: string): Promise<string> {
  if (!supabase) {
    return fallbackResponse(input, "Supabase client unavailable for failed runs");
  }

  const { data, error } = await supabase
    .from("fugue_runs")
    .select("summary, status, agent_id")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data || data.length === 0) {
    return fallbackResponse(
      input,
      `Failed runs fallback: ${error?.message ?? "empty result"}`
    );
  }

  return ["失敗した実行:", ...((data as readonly FugueRunRow[]).map(formatRunLine))].join(
    "\n"
  );
}

export async function routeChatIntent(input: string): Promise<string> {
  const intent = detectIntent(input);

  switch (intent) {
    case "failure":
      return getFailures(input);
    case "task":
      return getTasks(input);
    case "agent":
      return getAgents(input);
    case "development-status":
      return getDevelopmentStatus(input);
    case "other":
    default:
      return HELP_RESPONSE;
  }
}
