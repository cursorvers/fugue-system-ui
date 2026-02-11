"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useServerData } from "@/hooks/useServerData";
import type { ServerTask } from "@/types";

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

const runLogs: Record<string, readonly LogEntry[]> = {
  "RUN-042": [
    { timestamp: "16:42:00", level: "INFO", agent: "Codex", message: "Starting security analysis on payments.ts" },
    { timestamp: "16:42:08", level: "INFO", agent: "Codex", message: "Scanning for injection vulnerabilities..." },
    { timestamp: "16:42:15", level: "WARN", agent: "Codex", message: "Potential unvalidated input at line 47" },
    { timestamp: "16:42:22", level: "INFO", agent: "Codex", message: "XSS check passed — no innerHTML usage" },
    { timestamp: "16:42:28", level: "INFO", agent: "Codex", message: "CSRF token validation present" },
    { timestamp: "16:42:33", level: "INFO", agent: "Codex", message: "Analysis complete: 1 warning, 0 critical" },
  ],
  "RUN-041": [
    { timestamp: "16:41:42", level: "INFO", agent: "GLM-4.7", message: "Starting code review for auth.ts" },
    { timestamp: "16:41:48", level: "INFO", agent: "GLM-4.7", message: "Checking type safety..." },
    { timestamp: "16:41:55", level: "INFO", agent: "GLM-4.7", message: "Review complete: Score 6/7" },
  ],
  "RUN-040": [
    { timestamp: "16:40:48", level: "INFO", agent: "Gemini", message: "Starting UI review for Dashboard" },
    { timestamp: "16:41:12", level: "INFO", agent: "Gemini", message: "Capturing viewport screenshots..." },
    { timestamp: "16:41:45", level: "WARN", agent: "Gemini", message: "Contrast ratio below AA on muted text" },
    { timestamp: "16:42:00", level: "INFO", agent: "Gemini", message: "Layout analysis in progress..." },
  ],
  "RUN-039": [
    { timestamp: "16:39:30", level: "INFO", agent: "Codex", message: "Reviewing API refactor plan" },
    { timestamp: "16:39:45", level: "INFO", agent: "Codex", message: "Architecture check: REST → tRPC migration" },
    { timestamp: "16:40:15", level: "INFO", agent: "Codex", message: "Plan approved with 2 suggestions" },
  ],
  "RUN-038": [
    { timestamp: "16:38:00", level: "INFO", agent: "Manus", message: "Launching browser session..." },
    { timestamp: "16:38:15", level: "INFO", agent: "Manus", message: "Navigating to /checkout" },
    { timestamp: "16:39:00", level: "ERROR", agent: "Manus", message: "Element not found: #payment-form" },
    { timestamp: "16:39:30", level: "ERROR", agent: "Manus", message: "Timeout waiting for payment confirmation" },
    { timestamp: "16:40:00", level: "ERROR", agent: "Manus", message: "Test failed: checkout flow broken" },
  ],
  "RUN-037": [
    { timestamp: "16:37:00", level: "INFO", agent: "Orchestrator", message: "Initiating 3-party consensus vote" },
    { timestamp: "16:37:15", level: "INFO", agent: "Codex", message: "Vote: APPROVE — deploy is safe" },
    { timestamp: "16:37:20", level: "INFO", agent: "GLM-4.7", message: "Vote: APPROVE — no regressions" },
    { timestamp: "16:37:25", level: "INFO", agent: "Gemini", message: "Vote: APPROVE — UI verified" },
    { timestamp: "16:37:30", level: "INFO", agent: "Orchestrator", message: "Consensus reached: 3/3 approved" },
    { timestamp: "16:38:00", level: "INFO", agent: "Orchestrator", message: "Deploy initiated to preview" },
  ],
};

function serverTaskToRun(task: ServerTask): Run {
  const createdAtMs = typeof task.createdAt === "number" ? task.createdAt * 1000 : Date.parse(String(task.createdAt));
  const updatedAtMs = task.updatedAt ? (typeof task.updatedAt === "number" ? task.updatedAt * 1000 : Date.parse(String(task.updatedAt))) : createdAtMs;
  const durationMs = updatedAtMs - createdAtMs;
  const durationStr = durationMs > 60000 ? `${Math.round(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s` : durationMs > 0 ? `${Math.round(durationMs / 1000)}s` : "—";
  const minutesAgo = Math.round((Date.now() - createdAtMs) / 60000);
  const timeStr = minutesAgo < 1 ? "now" : `${minutesAgo}m ago`;

  return {
    id: task.id,
    name: task.title,
    agent: task.executor ?? "Orchestrator",
    status: task.status === "completed" ? "success" : task.status === "failed" ? "failed" : "running",
    duration: durationStr,
    time: timeStr,
    logsCount: task.logs ? task.logs.split("\n").length : 0,
  };
}

export default function RunsPage() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const { tasks: serverTasks, isConnected, isConnecting, error, refresh } = useServerData();
  const activeRuns: readonly Run[] = serverTasks.length > 0
    ? serverTasks.map(serverTaskToRun)
    : runs;

  const selectedRun = selectedRunId ? activeRuns.find((r) => r.id === selectedRunId) ?? null : null;
  const selectedLogs = selectedRunId ? runLogs[selectedRunId] ?? [] : [];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="runs" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="runs" />

          <ConnectionStatus
            state={isConnected ? "connected" : isConnecting ? "connecting" : error ? "error" : "disconnected"}
            error={error}
            onReconnect={refresh}
          />

          <div className="flex-1 p-4 lg:p-8 overflow-auto">
            <div className="mb-6">
              <h1 className="text-lg lg:text-xl font-primary font-semibold text-[var(--foreground)]">
                実行履歴
              </h1>
              <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5">
                実行履歴とシステムログ
              </p>
            </div>

            {/* Runs Table */}
            <Card className="mb-6">
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-[13px] font-primary font-semibold text-[var(--foreground)] uppercase tracking-wider">
                  最近の実行
                </h2>
                <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">{activeRuns.length} 件</span>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">実行</th>
                      <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2 hidden sm:table-cell">エージェント</th>
                      <th className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">ステータス</th>
                      <th className="text-right text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2 hidden sm:table-cell">所要時間</th>
                      <th className="text-right text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">時刻</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRuns.map((run) => {
                      const config = statusConfig[run.status];
                      return (
                        <tr
                          key={run.id}
                          onClick={() => setSelectedRunId(run.id === selectedRunId ? null : run.id)}
                          className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer ${
                            run.id === selectedRunId ? "bg-[var(--secondary)]" : ""
                          }`}
                        >
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
                  ライブログ
                </h2>
                <Badge variant="success" dot>Live</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border)]">
                  {recentLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--secondary)] transition-colors text-[12px] font-secondary"
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

        {/* Run Detail Panel */}
        {selectedRun && (
          <div
            className="fixed inset-0 z-40 lg:relative lg:inset-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedRunId(null);
            }}
          >
            <div className="absolute inset-0 bg-black/30 lg:hidden" />
            <aside className="absolute right-0 top-0 h-full w-[380px] bg-[var(--card)] border-l border-[var(--border)] shadow-[var(--shadow-l)] flex flex-col z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`material-symbols-sharp text-[18px] ${
                    selectedRun.status === "running" ? "text-[var(--color-info-foreground)] pulse-live" :
                    selectedRun.status === "failed" ? "text-[var(--color-error-foreground)]" :
                    "text-[var(--color-success-foreground)]"
                  }`}>
                    {statusConfig[selectedRun.status].icon}
                  </span>
                  <span className="text-[13px] font-primary font-semibold text-[var(--foreground)] truncate">
                    {selectedRun.id}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedRunId(null)}>
                  <span className="material-symbols-sharp text-[18px]">close</span>
                </Button>
              </div>

              {/* Summary */}
              <div className="px-4 py-3 border-b border-[var(--border)] space-y-2">
                <p className="text-[13px] font-primary font-medium text-[var(--foreground)]">
                  {selectedRun.name}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">エージェント</p>
                    <p className="text-[12px] font-secondary text-[var(--foreground)] mt-0.5">{selectedRun.agent}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">ステータス</p>
                    <div className="mt-0.5">
                      <Badge variant={statusConfig[selectedRun.status].badge}>{selectedRun.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">所要時間</p>
                    <p className="text-[12px] font-secondary text-[var(--foreground)] mt-0.5">{selectedRun.duration}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">開始</p>
                    <p className="text-[12px] font-secondary text-[var(--foreground)] mt-0.5">{selectedRun.time}</p>
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
                <h3 className="text-[11px] font-primary font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  実行ログ
                </h3>
                <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">
                  {selectedLogs.length} 件
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                {selectedLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 px-4 py-1.5 hover:bg-[var(--secondary)] transition-colors text-[11px] font-secondary border-b border-[var(--border)] last:border-0"
                  >
                    <span className="text-[var(--muted-foreground)] w-14 flex-shrink-0">{log.timestamp}</span>
                    <Badge
                      variant={logLevelConfig[log.level]}
                      className="text-[10px] px-1 py-0 flex-shrink-0"
                    >
                      {log.level}
                    </Badge>
                    <span className="text-[var(--foreground)] break-words">{log.message}</span>
                  </div>
                ))}
                {selectedLogs.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <span className="text-[12px] font-secondary text-[var(--muted-foreground)]">ログがありません</span>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
