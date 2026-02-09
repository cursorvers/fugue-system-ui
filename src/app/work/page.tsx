"use client";

import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// --- Types ---

interface Quota {
  used: number;
  limit: number;
  unit: string;
  period?: string;
}

interface Agent {
  name: string;
  role: string;
  description: string;
  status: "Online" | "Idle" | "Offline";
  color: string;
  tasks: number;
  successRate: string;
  quota: Quota;
  quotas?: Quota[];
}

interface Task {
  id: string;
  name: string;
  agent: string;
  status: "Completed" | "In Progress" | "Queued";
  time: string;
}

// --- Static Data ---

const COLLAPSED_LIMIT = 6;

const staticAgents: Agent[] = [
  {
    name: "Claude",
    role: "orchestrator",
    description: "Task routing, Planning, Integration",
    status: "Online",
    color: "#D97706",
    tasks: 47,
    successRate: "99.8%",
    quota: { used: 0, limit: 100, unit: "%", period: "weekly" },
  },
  {
    name: "Codex",
    role: "security-analyst",
    description: "Design, Security, Analysis",
    status: "Online",
    color: "#FF8400",
    tasks: 57,
    successRate: "99.2%",
    quota: { used: 0, limit: 100, unit: "%", period: "monthly" },
  },
  {
    name: "GLM-4.7",
    role: "code-reviewer",
    description: "Code review, Math, Refactor",
    status: "Online",
    color: "#3B82F6",
    tasks: 342,
    successRate: "98.8%",
    quota: { used: 0, limit: 100, unit: "%", period: "5h rolling" },
  },
  {
    name: "Gemini",
    role: "ui-reviewer",
    description: "UI/UX Review, Image Analysis",
    status: "Online",
    color: "#8B5CF6",
    tasks: 89,
    successRate: "97.5%",
    quota: { used: 0, limit: 60, unit: "requests" },
  },
  {
    name: "Pencil",
    role: "design-system",
    description: "UI Design, Components",
    status: "Online",
    color: "#EC4899",
    tasks: 67,
    successRate: "100%",
    quota: { used: 0, limit: -1, unit: "unlimited" },
  },
  {
    name: "Subagent",
    role: "explore",
    description: "Research, Parallel Tasks",
    status: "Idle",
    color: "#10B981",
    tasks: 234,
    successRate: "96.3%",
    quota: { used: 0, limit: -1, unit: "unlimited" },
  },
  {
    name: "Manus",
    role: "browser",
    description: "Browser Automation, Research",
    status: "Offline",
    color: "#6B7280",
    tasks: 12,
    successRate: "91.7%",
    quota: { used: 87, limit: 200, unit: "credits" },
  },
  {
    name: "Grok",
    role: "x-analyst",
    description: "X/Twitter, Trends, Realtime",
    status: "Idle",
    color: "#1DA1F2",
    tasks: 5,
    successRate: "94.0%",
    quota: { used: 12, limit: 100, unit: "requests" },
  },
  {
    name: "Excalidraw",
    role: "diagram",
    description: "Diagrams, Architecture Viz",
    status: "Online",
    color: "#6366F1",
    tasks: 23,
    successRate: "100%",
    quota: { used: 0, limit: -1, unit: "unlimited" },
  },
];

const staticTasks: Task[] = [
  { id: "TSK-001", name: "Code Review: auth.ts", agent: "GLM-4.7", status: "Completed", time: "2 min ago" },
  { id: "TSK-002", name: "Security Analysis: payments.ts", agent: "Codex", status: "Completed", time: "5 min ago" },
  { id: "TSK-003", name: "UI Review: Dashboard", agent: "Gemini", status: "In Progress", time: "8 min ago" },
  { id: "TSK-004", name: "Design: Settings Page", agent: "Pencil", status: "Queued", time: "12 min ago" },
  { id: "TSK-005", name: "Plan Review: API Refactor", agent: "Codex", status: "Completed", time: "15 min ago" },
  { id: "TSK-006", name: "Refactor: utils.ts", agent: "GLM-4.7", status: "Queued", time: "18 min ago" },
];

// --- Agent Card (inline, compact for grid) ---

function AgentMiniCard({ agent }: { agent: Agent }) {
  const usagePercent =
    agent.quota.limit === -1
      ? 100
      : agent.quota.limit > 0
      ? Math.round((agent.quota.used / agent.quota.limit) * 100)
      : 0;

  const barColor =
    agent.quota.limit === -1
      ? "bg-[var(--color-success-foreground)]"
      : usagePercent > 90
      ? "bg-[var(--color-error-foreground)]"
      : usagePercent > 70
      ? "bg-[var(--color-warning-foreground)]"
      : "bg-[var(--primary)]";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] transition-colors">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: agent.color }}
      >
        <span className="text-white text-xs font-bold">{agent.name.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-primary font-semibold text-[var(--foreground)] truncate">
            {agent.name}
          </span>
          <Badge
            variant={agent.status === "Online" ? "success" : agent.status === "Idle" ? "secondary" : "secondary"}
            className="text-[9px] ml-2"
          >
            {agent.status}
          </Badge>
        </div>
        <p className="text-[10px] text-[var(--muted-foreground)] truncate">{agent.description}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex-1 h-1 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${Math.min(agent.quota.limit === -1 ? 100 : usagePercent, 100)}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-[var(--muted-foreground)]">
            {agent.quota.limit === -1 ? "\u221e" : `${usagePercent}%`}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Tabs ---

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
        a.role.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
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

          <div className="flex-1 p-4 lg:p-10 overflow-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-3">
              <div>
                <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                  Work
                </h1>
                <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
                  Agents and tasks in one view
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 mb-4 bg-[var(--secondary)] rounded-full p-1 w-fit">
              <button
                onClick={() => setTab("agents")}
                className={`px-4 py-1.5 rounded-full text-xs font-primary font-medium transition-colors ${
                  tab === "agents"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="material-symbols-sharp text-sm align-middle mr-1">smart_toy</span>
                Agents ({staticAgents.length})
              </button>
              <button
                onClick={() => setTab("tasks")}
                className={`px-4 py-1.5 rounded-full text-xs font-primary font-medium transition-colors ${
                  tab === "tasks"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="material-symbols-sharp text-sm align-middle mr-1">task_alt</span>
                Tasks ({staticTasks.length})
              </button>
            </div>

            {/* Agents Tab */}
            {tab === "agents" && (
              <div>
                {/* Search */}
                {staticAgents.length > COLLAPSED_LIMIT && (
                  <div className="mb-3">
                    <div className="relative max-w-xs">
                      <span className="material-symbols-sharp text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      />
                    </div>
                  </div>
                )}

                {/* Agent Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visibleAgents.map((agent) => (
                    <AgentMiniCard key={agent.name} agent={agent} />
                  ))}
                </div>

                {/* Collapse/Expand toggle */}
                {!searchQuery && hiddenCount > 0 && (
                  <button
                    onClick={() => setAgentsExpanded((prev) => !prev)}
                    className="mt-3 flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors font-primary"
                  >
                    <span className="material-symbols-sharp text-sm">
                      {agentsExpanded ? "expand_less" : "expand_more"}
                    </span>
                    {agentsExpanded
                      ? "Show less"
                      : `Show ${hiddenCount} more agent${hiddenCount > 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            )}

            {/* Tasks Tab */}
            {tab === "tasks" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                      All Tasks
                    </h2>
                    <Badge variant="secondary">{staticTasks.length} tasks</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {staticTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col lg:flex-row lg:items-center justify-between py-3 border-b border-[var(--border)] last:border-0 gap-2"
                      >
                        <div className="flex items-center gap-3 lg:gap-4">
                          <span className="text-[10px] lg:text-xs font-mono text-[var(--muted-foreground)]">
                            {task.id}
                          </span>
                          <div>
                            <p className="text-xs lg:text-sm font-secondary text-[var(--foreground)]">
                              {task.name}
                            </p>
                            <p className="text-[10px] lg:text-xs text-[var(--muted-foreground)]">
                              Assigned to {task.agent}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 lg:gap-4 ml-auto">
                          <span className="text-[10px] lg:text-xs text-[var(--muted-foreground)]">
                            {task.time}
                          </span>
                          <Badge
                            variant={
                              task.status === "Completed"
                                ? "success"
                                : task.status === "In Progress"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px] lg:text-xs"
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
