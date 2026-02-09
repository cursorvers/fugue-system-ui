"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { MetricCard, Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const agents = [
  { name: "Codex", role: "architect", status: "active" as const, tasks: 24, latency: "0.8s" },
  { name: "GLM-4.7", role: "reviewer", status: "active" as const, tasks: 31, latency: "0.5s" },
  { name: "Gemini", role: "ui-reviewer", status: "idle" as const, tasks: 8, latency: "1.1s" },
  { name: "Pencil", role: "designer", status: "active" as const, tasks: 12, latency: "0.3s" },
  { name: "Grok", role: "analyst", status: "offline" as const, tasks: 0, latency: "—" },
];

const recentRuns = [
  { id: "run-042", name: "Security audit: payments.ts", status: "completed" as const, duration: "12s", time: "2m ago" },
  { id: "run-041", name: "Code review: auth refactor", status: "completed" as const, duration: "8s", time: "5m ago" },
  { id: "run-040", name: "UI review: Settings page", status: "running" as const, duration: "3s", time: "now" },
  { id: "run-039", name: "Plan review: API v2", status: "completed" as const, duration: "15s", time: "8m ago" },
  { id: "run-038", name: "Design: Inbox drawer", status: "failed" as const, duration: "2s", time: "12m ago" },
];

const inboxItems = [
  { id: 1, type: "review" as const, title: "GLM: auth.ts review complete", body: "Score 6/7 — 2 suggestions", time: "2m", read: false },
  { id: 2, type: "alert" as const, title: "Codex: security warning", body: "Potential XSS in user input handler", time: "5m", read: false },
  { id: 3, type: "info" as const, title: "Build succeeded", body: "17 routes compiled, 0 errors", time: "8m", read: true },
  { id: 4, type: "review" as const, title: "Gemini: UI review done", body: "Layout approved with notes", time: "15m", read: true },
  { id: 5, type: "info" as const, title: "Deploy preview ready", body: "fugue-system-ui-abc123.vercel.app", time: "20m", read: true },
];

const statusColors = {
  active: "success" as const,
  idle: "warning" as const,
  offline: "secondary" as const,
};

const runStatusConfig = {
  completed: { badge: "success" as const, icon: "check_circle" },
  running: { badge: "info" as const, icon: "progress_activity" },
  failed: { badge: "error" as const, icon: "error" },
};

const inboxTypeConfig = {
  review: { icon: "rate_review", color: "text-[var(--primary)]" },
  alert: { icon: "warning", color: "text-[var(--color-warning-foreground)]" },
  info: { icon: "info", color: "text-[var(--muted-foreground)]" },
};

export default function Dashboard() {
  const [inboxOpen, setInboxOpen] = useState(false);
  const unreadCount = inboxItems.filter((i) => !i.read).length;

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar activePage="overview" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Mobile Header */}
          <MobileNav activePage="overview" />

          <div className="flex-1 flex flex-col gap-6 p-4 lg:p-8 overflow-auto">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg lg:text-xl font-primary font-semibold text-[var(--foreground)]">
                  Overview
                </h1>
                <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5">
                  System status and recent activity
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" dot>Online</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInboxOpen(!inboxOpen)}
                  className="relative"
                >
                  <span className="material-symbols-sharp text-[20px]">inbox</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--destructive)] text-white text-[9px] font-secondary font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="Active Agents" value="4 / 5" icon="smart_toy" change="+1 today" changeType="positive" />
              <MetricCard label="Tasks / 24h" value="75" icon="task_alt" change="+12%" changeType="positive" />
              <MetricCard label="Success Rate" value="98.5%" icon="verified" change="+0.3%" changeType="positive" />
              <MetricCard label="Avg Latency" value="0.7s" icon="speed" change="-0.1s" changeType="positive" />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
              {/* Agents — spans 1 col */}
              <Card className="flex flex-col min-h-0">
                <CardHeader className="flex items-center justify-between">
                  <h2 className="text-[13px] font-primary font-semibold text-[var(--foreground)] uppercase tracking-wider">
                    Agents
                  </h2>
                  <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                    {agents.filter((a) => a.status === "active").length} active
                  </span>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-1 overflow-auto p-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.name}
                      className="flex items-center gap-3 px-2 py-2 rounded-[var(--radius-m)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-[var(--radius-m)] bg-[var(--muted)] flex items-center justify-center">
                          <span className="text-xs font-secondary font-semibold text-[var(--foreground)]">
                            {agent.name.charAt(0)}
                          </span>
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--card)] ${
                          agent.status === "active" ? "bg-[var(--color-success-foreground)]" :
                          agent.status === "idle" ? "bg-[var(--color-warning-foreground)]" :
                          "bg-[var(--muted-foreground)]"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-primary font-medium text-[var(--foreground)] truncate">
                          {agent.name}
                        </p>
                        <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                          {agent.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-secondary text-[var(--foreground)]">{agent.tasks}</p>
                        <p className="text-[10px] font-secondary text-[var(--muted-foreground)]">{agent.latency}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Runs — spans 2 cols */}
              <Card className="lg:col-span-2 flex flex-col min-h-0">
                <CardHeader className="flex items-center justify-between">
                  <h2 className="text-[13px] font-primary font-semibold text-[var(--foreground)] uppercase tracking-wider">
                    Recent Runs
                  </h2>
                  <Button variant="ghost" size="sm">View all</Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">Run</th>
                        <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">Status</th>
                        <th className="text-right text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2 hidden sm:table-cell">Duration</th>
                        <th className="text-right text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRuns.map((run) => {
                        const config = runStatusConfig[run.status];
                        return (
                          <tr key={run.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className={`material-symbols-sharp text-[16px] ${
                                  run.status === "running" ? "text-[var(--color-info-foreground)] pulse-live" :
                                  run.status === "failed" ? "text-[var(--color-error-foreground)]" :
                                  "text-[var(--color-success-foreground)]"
                                }`}>
                                  {config.icon}
                                </span>
                                <div>
                                  <p className="text-[13px] font-primary text-[var(--foreground)]">{run.name}</p>
                                  <p className="text-[10px] font-secondary text-[var(--muted-foreground)]">{run.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant={config.badge}>{run.status}</Badge>
                            </td>
                            <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                              <span className="text-[12px] font-secondary text-[var(--muted-foreground)]">{run.duration}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="text-[12px] font-secondary text-[var(--muted-foreground)]">{run.time}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Inbox Drawer */}
        {inboxOpen && (
          <div
            className="fixed inset-0 z-40 lg:relative lg:inset-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setInboxOpen(false);
            }}
          >
            {/* Backdrop on mobile */}
            <div className="absolute inset-0 bg-black/30 lg:hidden" />
            <aside className="absolute right-0 top-0 h-full w-[340px] bg-[var(--card)] border-l border-[var(--border)] shadow-[var(--shadow-l)] flex flex-col z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h2 className="text-[13px] font-primary font-semibold text-[var(--foreground)] uppercase tracking-wider">
                  Inbox
                </h2>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-[11px]">
                    Mark all read
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setInboxOpen(false)}>
                    <span className="material-symbols-sharp text-[18px]">close</span>
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {inboxItems.map((item) => {
                  const config = inboxTypeConfig[item.type];
                  return (
                    <div
                      key={item.id}
                      className={`flex gap-3 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--secondary)] transition-colors cursor-pointer ${
                        !item.read ? "bg-[var(--color-info)]" : ""
                      }`}
                    >
                      <span className={`material-symbols-sharp text-[18px] mt-0.5 flex-shrink-0 ${config.color}`}>
                        {config.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-[13px] font-primary truncate ${!item.read ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}`}>
                            {item.title}
                          </p>
                          {!item.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] font-secondary text-[var(--muted-foreground)] truncate mt-0.5">
                          {item.body}
                        </p>
                      </div>
                      <span className="text-[10px] font-secondary text-[var(--muted-foreground)] flex-shrink-0 mt-0.5">
                        {item.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
