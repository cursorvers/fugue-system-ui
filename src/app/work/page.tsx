"use client";

import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useServerData } from "@/hooks/useServerData";
import type { ServerTask } from "@/types";

// --- Types ---

interface Quota {
  readonly used: number;
  readonly limit: number;
  readonly unit: string;
  readonly period?: string;
}

interface Agent {
  readonly name: string;
  readonly role: string;
  readonly status: "active" | "idle" | "offline";
  readonly tasks: number;
  readonly successRate: string;
  readonly quota: Quota;
}

interface Task {
  readonly id: string;
  readonly name: string;
  readonly agent: string;
  readonly status: "completed" | "running" | "queued";
  readonly time: string;
}

// --- Static Data ---

const COLLAPSED_LIMIT = 6;

const staticAgents: readonly Agent[] = [
  { name: "Claude", role: "orchestrator", status: "active", tasks: 47, successRate: "99.8%", quota: { used: 0, limit: 100, unit: "%", period: "weekly" } },
  { name: "Codex", role: "security-analyst", status: "active", tasks: 57, successRate: "99.2%", quota: { used: 0, limit: 100, unit: "%", period: "monthly" } },
  { name: "GLM-4.7", role: "code-reviewer", status: "active", tasks: 342, successRate: "98.8%", quota: { used: 0, limit: 100, unit: "%", period: "5h rolling" } },
  { name: "Gemini", role: "ui-reviewer", status: "active", tasks: 89, successRate: "97.5%", quota: { used: 0, limit: 60, unit: "requests" } },
  { name: "Pencil", role: "design-system", status: "active", tasks: 67, successRate: "100%", quota: { used: 0, limit: -1, unit: "unlimited" } },
  { name: "Subagent", role: "explore", status: "idle", tasks: 234, successRate: "96.3%", quota: { used: 0, limit: -1, unit: "unlimited" } },
  { name: "Manus", role: "browser", status: "offline", tasks: 12, successRate: "91.7%", quota: { used: 87, limit: 200, unit: "credits" } },
  { name: "Grok", role: "x-analyst", status: "idle", tasks: 5, successRate: "94.0%", quota: { used: 12, limit: 100, unit: "requests" } },
  { name: "Excalidraw", role: "diagram", status: "active", tasks: 23, successRate: "100%", quota: { used: 0, limit: -1, unit: "unlimited" } },
];

const staticTasks: readonly Task[] = [
  { id: "TSK-001", name: "Code Review: auth.ts", agent: "GLM-4.7", status: "completed", time: "2m ago" },
  { id: "TSK-002", name: "Security Analysis: payments.ts", agent: "Codex", status: "completed", time: "5m ago" },
  { id: "TSK-003", name: "UI Review: Dashboard", agent: "Gemini", status: "running", time: "8m ago" },
  { id: "TSK-004", name: "Design: Settings Page", agent: "Pencil", status: "queued", time: "12m ago" },
  { id: "TSK-005", name: "Plan Review: API Refactor", agent: "Codex", status: "completed", time: "15m ago" },
  { id: "TSK-006", name: "Refactor: utils.ts", agent: "GLM-4.7", status: "queued", time: "18m ago" },
];

const statusConfig = {
  active: { badge: "success" as const, dot: "bg-[var(--color-success-foreground)]" },
  idle: { badge: "warning" as const, dot: "bg-[var(--color-warning-foreground)]" },
  offline: { badge: "secondary" as const, dot: "bg-[var(--muted-foreground)]" },
};

const taskStatusConfig = {
  completed: { badge: "success" as const, icon: "check_circle" },
  running: { badge: "info" as const, icon: "progress_activity" },
  queued: { badge: "secondary" as const, icon: "schedule" },
};

// --- Agent detail data ---
const agentDetails: Record<string, { description: string; recentTasks: readonly string[]; config: readonly string[] }> = {
  Claude: { description: "Primary orchestrator. Routes tasks, integrates results, manages consensus votes.", recentTasks: ["Orchestrated 3-party vote for deploy", "Routed auth review to GLM", "Integrated security scan results"], config: ["Model: Opus 4.6", "Role: Orchestrator", "Auto-execute: enabled"] },
  Codex: { description: "Architecture, security analysis, and high-precision code review.", recentTasks: ["Security scan: payments.ts (passed)", "Architecture review: API v2", "Plan review: microservices migration"], config: ["Plan: $200/mo fixed", "Agents: architect, security-analyst, code-reviewer", "Priority: Critical path"] },
  "GLM-4.7": { description: "Fast code review, refactoring advice, and general-purpose analysis.", recentTasks: ["Code review: auth.ts (6/7)", "Refactor suggestion: utils.ts", "Summary: sprint retrospective"], config: ["Plan: $15/mo fixed", "Parallel limit: 7", "Agents: code-reviewer, refactor-advisor"] },
  Gemini: { description: "UI/UX review with visual analysis. Screenshot-based validation.", recentTasks: ["UI review: Dashboard layout", "Contrast audit: dark mode", "Responsive check: mobile nav"], config: ["Billing: Pay-per-use", "Weekly limit: 60 requests", "Agents: ui-reviewer, image-analyst"] },
  Pencil: { description: "Design system management via MCP. Component creation and theming.", recentTasks: ["Created Card component", "Updated dark theme variables", "Designed Settings layout"], config: ["Cost: Free (MCP)", "Tools: batch_design, set_variables", "Auto-trigger: .pen files"] },
  Subagent: { description: "File exploration only. Haiku/Sonnet subagent (rate-limit restricted).", recentTasks: ["Explored src/components/ (3 files)", "Found navigation config", "Scanned test coverage"], config: ["Model: Haiku", "Limit: 5/week", "Type: Explore only"] },
  Manus: { description: "Browser automation for E2E testing and web research.", recentTasks: ["Browser test: checkout flow (failed)", "Screenshot: landing page", "Form fill: registration test"], config: ["Budget: 200 credits", "Used: 87 credits", "Auto-approve: ≤50cr"] },
  Grok: { description: "X/Twitter analysis and real-time information retrieval.", recentTasks: ["Trend analysis: AI tooling", "X sentiment: competitor launch", "Real-time: API status check"], config: ["Billing: Per-request", "Used: 12/100", "Agents: x-analyst, trend-analyzer"] },
  Excalidraw: { description: "Diagram generation for architecture and flow visualization.", recentTasks: ["System architecture diagram", "Data flow: auth pipeline", "Component hierarchy chart"], config: ["Cost: Free", "Format: SVG/PNG", "Auto-trigger: diagram requests"] },
};

// --- Task detail data ---
const taskDetails: Record<string, { description: string; steps: readonly string[]; output: string }> = {
  "TSK-001": { description: "Automated code review of auth.ts focusing on type safety, error handling, and security patterns.", steps: ["Loaded auth.ts (142 lines)", "Checked type annotations: 12/12 typed", "Validated error handling: try-catch on all async", "Security: no hardcoded secrets found", "Score: 6/7 — 1 suggestion (unused import)"], output: "Review complete. Score 6/7. 1 minor suggestion." },
  "TSK-002": { description: "Security analysis of payments.ts for OWASP Top 10 vulnerabilities.", steps: ["Scanning for injection vulnerabilities...", "Checking XSS vectors: 0 found", "Validating CSRF tokens: present", "Input validation: Zod schemas detected", "Rate limiting: configured on endpoints"], output: "Analysis complete. 0 critical, 1 warning (unvalidated input L47)." },
  "TSK-003": { description: "Visual UI review of Dashboard page across viewport sizes.", steps: ["Capturing desktop viewport (1440px)...", "Capturing tablet viewport (768px)...", "Capturing mobile viewport (375px)...", "Analyzing contrast ratios..."], output: "In progress — analyzing contrast ratios..." },
  "TSK-004": { description: "Design Settings page layout with Pencil MCP.", steps: ["Queued — waiting for Gemini UI review to complete"], output: "Waiting in queue." },
  "TSK-005": { description: "Review API refactor plan from REST to tRPC.", steps: ["Loaded Plans.md (API Refactor section)", "Checked endpoint mapping: 12 endpoints", "Validated type safety improvements", "Architecture: approved with suggestions"], output: "Plan approved. 2 suggestions: batch endpoints, add caching layer." },
  "TSK-006": { description: "Refactor utils.ts to reduce duplication and improve type safety.", steps: ["Queued — waiting for available agent slot"], output: "Waiting in queue." },
};

// --- Tab type ---
type WorkTab = "agents" | "tasks";

function serverTaskToWorkTask(task: ServerTask): Task {
  const createdAtMs = typeof task.createdAt === "number" ? task.createdAt * 1000 : Date.parse(String(task.createdAt));
  const minutesAgo = Math.round((Date.now() - createdAtMs) / 60000);
  const timeStr = minutesAgo < 1 ? "now" : `${minutesAgo}m ago`;
  return {
    id: task.id,
    name: task.title,
    agent: task.executor ?? "Orchestrator",
    status: task.status === "completed" ? "completed" : task.status === "failed" ? "completed" : task.status === "pending" ? "queued" : "running",
    time: timeStr,
  };
}

export default function WorkPage() {
  const [tab, setTab] = useState<WorkTab>("agents");
  const [agentsExpanded, setAgentsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const { tasks: serverTasks, isConnected, isConnecting, error, refresh } = useServerData();
  const tasks: readonly Task[] = serverTasks.length > 0
    ? serverTasks.map(serverTaskToWorkTask)
    : staticTasks;

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return staticAgents;
    const q = searchQuery.toLowerCase();
    return staticAgents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const visibleAgents = agentsExpanded ? filteredAgents : filteredAgents.slice(0, COLLAPSED_LIMIT);
  const hiddenCount = filteredAgents.length - COLLAPSED_LIMIT;

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="work" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="work" />

          <ConnectionStatus
            state={isConnected ? "connected" : isConnecting ? "connecting" : error ? "error" : "disconnected"}
            error={error}
            onReconnect={refresh}
          />

          <div className="flex-1 p-4 lg:p-8 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg lg:text-xl font-primary font-semibold text-[var(--foreground)]">
                  Work
                </h1>
                <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5">
                  Agents and tasks in one view
                </p>
              </div>
            </div>

            {/* Tabs — underline style */}
            <div className="flex gap-6 border-b border-[var(--border)] mb-6">
              <button
                onClick={() => setTab("agents")}
                className={`pb-2 text-[13px] font-primary font-medium transition-colors border-b-2 ${
                  tab === "agents"
                    ? "border-[var(--primary)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Agents
                <span className="ml-1.5 text-[11px] font-secondary text-[var(--muted-foreground)]">
                  {staticAgents.length}
                </span>
              </button>
              <button
                onClick={() => setTab("tasks")}
                className={`pb-2 text-[13px] font-primary font-medium transition-colors border-b-2 ${
                  tab === "tasks"
                    ? "border-[var(--primary)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Tasks
                <span className="ml-1.5 text-[11px] font-secondary text-[var(--muted-foreground)]">
                  {tasks.length}
                </span>
              </button>
            </div>

            {/* Agents Tab */}
            {tab === "agents" && (
              <div>
                {/* Search */}
                {staticAgents.length > COLLAPSED_LIMIT && (
                  <div className="mb-4">
                    <div className="relative max-w-xs">
                      <span className="material-symbols-sharp text-[16px] text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Filter agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] text-[13px] font-primary text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      />
                    </div>
                  </div>
                )}

                {/* Agent table-like list */}
                <Card>
                  <div className="divide-y divide-[var(--border)]">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_80px_60px_80px_100px] gap-4 px-4 py-2 text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider hidden lg:grid">
                      <span>Agent</span>
                      <span>Status</span>
                      <span className="text-right">Tasks</span>
                      <span className="text-right">Success</span>
                      <span className="text-right">Quota</span>
                    </div>

                    {visibleAgents.map((agent) => {
                      const config = statusConfig[agent.status];
                      const usagePercent = agent.quota.limit === -1
                        ? 100
                        : agent.quota.limit > 0
                        ? Math.round((agent.quota.used / agent.quota.limit) * 100)
                        : 0;

                      return (
                        <div
                          key={agent.name}
                          onClick={() => { setSelectedAgent(agent.name === selectedAgent ? null : agent.name); setSelectedTask(null); }}
                          className={`grid grid-cols-1 lg:grid-cols-[1fr_80px_60px_80px_100px] gap-2 lg:gap-4 px-4 py-3 hover:bg-[var(--secondary)] transition-colors cursor-pointer items-center ${
                            agent.name === selectedAgent ? "bg-[var(--secondary)]" : ""
                          }`}
                        >
                          {/* Agent info */}
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-[var(--radius-m)] bg-[var(--muted)] flex items-center justify-center">
                                <span className="text-xs font-secondary font-semibold text-[var(--foreground)]">
                                  {agent.name.charAt(0)}
                                </span>
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--card)] ${config.dot}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-primary font-medium text-[var(--foreground)] truncate">
                                {agent.name}
                              </p>
                              <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                                {agent.role}
                              </p>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="hidden lg:block">
                            <Badge variant={config.badge} dot>{agent.status}</Badge>
                          </div>

                          {/* Tasks */}
                          <div className="hidden lg:block text-right">
                            <span className="text-[13px] font-secondary text-[var(--foreground)]">{agent.tasks}</span>
                          </div>

                          {/* Success rate */}
                          <div className="hidden lg:block text-right">
                            <span className="text-[13px] font-secondary text-[var(--foreground)]">{agent.successRate}</span>
                          </div>

                          {/* Quota */}
                          <div className="hidden lg:flex items-center gap-2 justify-end">
                            <div className="w-16 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  agent.quota.limit === -1
                                    ? "bg-[var(--color-success-foreground)]"
                                    : usagePercent > 90
                                    ? "bg-[var(--color-error-foreground)]"
                                    : usagePercent > 70
                                    ? "bg-[var(--color-warning-foreground)]"
                                    : "bg-[var(--primary)]"
                                }`}
                                style={{ width: `${Math.min(agent.quota.limit === -1 ? 100 : usagePercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-secondary text-[var(--muted-foreground)] w-8 text-right">
                              {agent.quota.limit === -1 ? "\u221e" : `${usagePercent}%`}
                            </span>
                          </div>

                          {/* Mobile: inline stats */}
                          <div className="lg:hidden flex items-center gap-3 text-[11px] font-secondary text-[var(--muted-foreground)]">
                            <Badge variant={config.badge} dot className="text-[10px]">{agent.status}</Badge>
                            <span>{agent.tasks} tasks</span>
                            <span>{agent.successRate}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Expand toggle */}
                {!searchQuery && hiddenCount > 0 && (
                  <button
                    onClick={() => setAgentsExpanded((prev) => !prev)}
                    className="mt-3 flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors font-primary"
                  >
                    <span className="material-symbols-sharp text-[16px]">
                      {agentsExpanded ? "expand_less" : "expand_more"}
                    </span>
                    {agentsExpanded ? "Show less" : `Show ${hiddenCount} more`}
                  </button>
                )}
              </div>
            )}

            {/* Tasks Tab */}
            {tab === "tasks" && (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">Task</th>
                        <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2 hidden sm:table-cell">Agent</th>
                        <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">Status</th>
                        <th className="text-right text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => {
                        const config = taskStatusConfig[task.status];
                        return (
                          <tr
                            key={task.id}
                            onClick={() => { setSelectedTask(task.id === selectedTask ? null : task.id); setSelectedAgent(null); }}
                            className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer ${
                              task.id === selectedTask ? "bg-[var(--secondary)]" : ""
                            }`}
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className={`material-symbols-sharp text-[16px] ${
                                  task.status === "running" ? "text-[var(--color-info-foreground)] pulse-live" :
                                  task.status === "completed" ? "text-[var(--color-success-foreground)]" :
                                  "text-[var(--muted-foreground)]"
                                }`}>
                                  {config.icon}
                                </span>
                                <div>
                                  <p className="text-[13px] font-primary text-[var(--foreground)]">{task.name}</p>
                                  <p className="text-[10px] font-secondary text-[var(--muted-foreground)]">{task.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 hidden sm:table-cell">
                              <span className="text-[12px] font-secondary text-[var(--foreground)]">{task.agent}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant={config.badge}>{task.status}</Badge>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="text-[12px] font-secondary text-[var(--muted-foreground)]">{task.time}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        {/* Agent Detail Panel */}
        {selectedAgent && (() => {
          const agent = staticAgents.find((a) => a.name === selectedAgent);
          const detail = agentDetails[selectedAgent];
          if (!agent || !detail) return null;
          const config = statusConfig[agent.status];
          return (
            <div
              className="fixed inset-0 z-40 lg:relative lg:inset-auto"
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedAgent(null); }}
            >
              <div className="absolute inset-0 bg-black/30 lg:hidden" />
              <aside className="absolute right-0 top-0 h-full w-[380px] bg-[var(--card)] border-l border-[var(--border)] shadow-[var(--shadow-l)] flex flex-col z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[var(--radius-m)] bg-[var(--muted)] flex items-center justify-center">
                      <span className="text-xs font-secondary font-semibold text-[var(--foreground)]">{agent.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-primary font-semibold text-[var(--foreground)]">{agent.name}</p>
                      <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">{agent.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}>
                    <span className="material-symbols-sharp text-[18px]">close</span>
                  </Button>
                </div>

                <div className="flex-1 overflow-auto">
                  {/* Status & Stats */}
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">Status</p>
                        <div className="mt-1"><Badge variant={config.badge} dot>{agent.status}</Badge></div>
                      </div>
                      <div>
                        <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">Tasks</p>
                        <p className="text-[16px] font-secondary font-semibold text-[var(--foreground)] mt-1">{agent.tasks}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">Success</p>
                        <p className="text-[16px] font-secondary font-semibold text-[var(--color-success-foreground)] mt-1">{agent.successRate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider mb-1">About</p>
                    <p className="text-[12px] font-primary text-[var(--foreground)] leading-relaxed">{detail.description}</p>
                  </div>

                  {/* Recent Tasks */}
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Recent Activity</p>
                    <div className="space-y-1.5">
                      {detail.recentTasks.map((t, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="material-symbols-sharp text-[14px] text-[var(--color-success-foreground)] mt-0.5 flex-shrink-0">check_circle</span>
                          <span className="text-[11px] font-secondary text-[var(--foreground)]">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Config */}
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Configuration</p>
                    <div className="space-y-1">
                      {detail.config.map((c, i) => (
                        <p key={i} className="text-[11px] font-secondary text-[var(--muted-foreground)]">{c}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          );
        })()}

        {/* Task Detail Panel */}
        {selectedTask && (() => {
          const task = tasks.find((t) => t.id === selectedTask);
          const detail = taskDetails[selectedTask];
          if (!task || !detail) return null;
          const config = taskStatusConfig[task.status];
          return (
            <div
              className="fixed inset-0 z-40 lg:relative lg:inset-auto"
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedTask(null); }}
            >
              <div className="absolute inset-0 bg-black/30 lg:hidden" />
              <aside className="absolute right-0 top-0 h-full w-[380px] bg-[var(--card)] border-l border-[var(--border)] shadow-[var(--shadow-l)] flex flex-col z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`material-symbols-sharp text-[18px] ${
                      task.status === "running" ? "text-[var(--color-info-foreground)] pulse-live" :
                      task.status === "completed" ? "text-[var(--color-success-foreground)]" :
                      "text-[var(--muted-foreground)]"
                    }`}>{config.icon}</span>
                    <span className="text-[13px] font-primary font-semibold text-[var(--foreground)] truncate">{task.id}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTask(null)}>
                    <span className="material-symbols-sharp text-[18px]">close</span>
                  </Button>
                </div>

                <div className="flex-1 overflow-auto">
                  <div className="px-4 py-3 border-b border-[var(--border)] space-y-2">
                    <p className="text-[13px] font-primary font-medium text-[var(--foreground)]">{task.name}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">Agent</p>
                        <p className="text-[12px] font-secondary text-[var(--foreground)] mt-0.5">{task.agent}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">Status</p>
                        <div className="mt-0.5"><Badge variant={config.badge}>{task.status}</Badge></div>
                      </div>
                      <div>
                        <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">Time</p>
                        <p className="text-[12px] font-secondary text-[var(--foreground)] mt-0.5">{task.time}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Description</p>
                    <p className="text-[12px] font-primary text-[var(--foreground)] leading-relaxed">{detail.description}</p>
                  </div>

                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Execution Steps</p>
                    <div className="space-y-1.5">
                      {detail.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[10px] font-secondary text-[var(--muted-foreground)] w-4 flex-shrink-0 mt-0.5 text-right">{i + 1}</span>
                          <span className="text-[11px] font-secondary text-[var(--foreground)]">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Output</p>
                    <div className="bg-[var(--muted)] rounded-[var(--radius-m)] p-3">
                      <p className="text-[11px] font-secondary text-[var(--foreground)]">{detail.output}</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          );
        })()}
      </div>
    </ProtectedRoute>
  );
}
