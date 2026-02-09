"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Run {
  readonly id: string;
  readonly name: string;
  readonly agent: string;
  readonly status: "success" | "running" | "failed";
  readonly duration: string;
  readonly time: string;
  readonly logsCount: number;
}

interface LogEntry {
  readonly timestamp: string;
  readonly level: "INFO" | "WARN" | "ERROR";
  readonly agent: string;
  readonly message: string;
}

const runs: readonly Run[] = [
  { id: "RUN-042", name: "Security Analysis: payments.ts", agent: "Codex", status: "success", duration: "33s", time: "5m ago", logsCount: 12 },
  { id: "RUN-041", name: "Code Review: auth.ts", agent: "GLM-4.7", status: "success", duration: "18s", time: "2m ago", logsCount: 8 },
  { id: "RUN-040", name: "UI Review: Dashboard", agent: "Gemini", status: "running", duration: "1m 12s", time: "8m ago", logsCount: 4 },
  { id: "RUN-039", name: "Plan Review: API Refactor", agent: "Codex", status: "success", duration: "45s", time: "15m ago", logsCount: 15 },
  { id: "RUN-038", name: "Browser Test: Checkout Flow", agent: "Manus", status: "failed", duration: "2m 30s", time: "22m ago", logsCount: 23 },
  { id: "RUN-037", name: "Consensus Vote: Deploy", agent: "Orchestrator", status: "success", duration: "60s", time: "25m ago", logsCount: 6 },
];

const recentLogs: readonly LogEntry[] = [
  { timestamp: "16:42:15", level: "INFO", agent: "Codex", message: "Security analysis completed for payments.ts" },
  { timestamp: "16:42:10", level: "INFO", agent: "GLM-4.7", message: "Code review delegated: auth.ts" },
  { timestamp: "16:41:58", level: "WARN", agent: "Gemini", message: "Rate limit approaching (85% usage)" },
  { timestamp: "16:41:45", level: "INFO", agent: "Orchestrator", message: "Task TSK-003 assigned to Gemini ui-reviewer" },
  { timestamp: "16:41:30", level: "INFO", agent: "Pencil", message: "Design system component created: Card" },
  { timestamp: "16:41:15", level: "ERROR", agent: "Manus", message: "Browser session timeout — retrying..." },
  { timestamp: "16:41:00", level: "INFO", agent: "Subagent", message: "Parallel exploration completed: 3 files analyzed" },
  { timestamp: "16:40:45", level: "INFO", agent: "Orchestrator", message: "Consensus vote passed: 3/3 approved" },
];

const statusConfig = {
  success: { badge: "success" as const, icon: "check_circle" },
  running: { badge: "info" as const, icon: "progress_activity" },
  failed: { badge: "error" as const, icon: "error" },
};

const logLevelConfig = {
  INFO: "success" as const,
  WARN: "warning" as const,
  ERROR: "error" as const,
};

export default function RunsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="runs" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="runs" />

          <div className="flex-1 p-4 lg:p-8 overflow-auto">
            <div className="mb-6">
              <h1 className="text-lg lg:text-xl font-primary font-semibold text-[var(--foreground)]">
                Runs
              </h1>
              <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5">
                Execution history and system logs
              </p>
            </div>

            {/* Runs Table */}
            <Card className="mb-6">
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-[13px] font-primary font-semibold text-[var(--foreground)] uppercase tracking-wider">
                  Recent Runs
                </h2>
                <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">{runs.length} total</span>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">Run</th>
                      <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2 hidden sm:table-cell">Agent</th>
                      <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">Status</th>
                      <th className="text-right text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2 hidden sm:table-cell">Duration</th>
                      <th className="text-right text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => {
                      const config = statusConfig[run.status];
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
                                <p className="text-[10px] font-secondary text-[var(--muted-foreground)]">{run.id} · {run.logsCount} logs</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 hidden sm:table-cell">
                            <span className="text-[12px] font-secondary text-[var(--foreground)]">{run.agent}</span>
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

            {/* Live Logs */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-[13px] font-primary font-semibold text-[var(--foreground)] uppercase tracking-wider">
                  Live Logs
                </h2>
                <Badge variant="success" dot>Live</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border)]">
                  {recentLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 px-4 py-2 hover:bg-[var(--secondary)] transition-colors text-[12px] font-secondary"
                    >
                      <span className="text-[var(--muted-foreground)] w-16 flex-shrink-0 font-secondary">
                        {log.timestamp}
                      </span>
                      <Badge
                        variant={logLevelConfig[log.level]}
                        className="w-12 justify-center text-[10px] flex-shrink-0"
                      >
                        {log.level}
                      </Badge>
                      <span className="text-[var(--primary)] w-20 flex-shrink-0 truncate font-secondary">
                        {log.agent}
                      </span>
                      <span className="text-[var(--foreground)] font-secondary">{log.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
