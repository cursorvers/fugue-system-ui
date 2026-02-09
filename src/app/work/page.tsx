"use client";

import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

// --- Tab type ---
type WorkTab = "agents" | "tasks";

export default function WorkPage() {
  const [tab, setTab] = useState<WorkTab>("agents");
  const [agentsExpanded, setAgentsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
                  {staticTasks.length}
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
                          className="grid grid-cols-1 lg:grid-cols-[1fr_80px_60px_80px_100px] gap-2 lg:gap-4 px-4 py-3 hover:bg-[var(--secondary)] transition-colors cursor-pointer items-center"
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
                      {staticTasks.map((task) => {
                        const config = taskStatusConfig[task.status];
                        return (
                          <tr key={task.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer">
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
      </div>
    </ProtectedRoute>
  );
}
