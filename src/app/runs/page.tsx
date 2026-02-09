"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Run {
  id: string;
  name: string;
  agent: string;
  status: "Success" | "Running" | "Failed";
  duration: string;
  time: string;
  logsCount: number;
}

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  agent: string;
  message: string;
}

const runs: Run[] = [
  { id: "RUN-042", name: "Security Analysis: payments.ts", agent: "Codex", status: "Success", duration: "33s", time: "5 min ago", logsCount: 12 },
  { id: "RUN-041", name: "Code Review: auth.ts", agent: "GLM-4.7", status: "Success", duration: "18s", time: "2 min ago", logsCount: 8 },
  { id: "RUN-040", name: "UI Review: Dashboard", agent: "Gemini", status: "Running", duration: "1m 12s", time: "8 min ago", logsCount: 4 },
  { id: "RUN-039", name: "Plan Review: API Refactor", agent: "Codex", status: "Success", duration: "45s", time: "15 min ago", logsCount: 15 },
  { id: "RUN-038", name: "Browser Test: Checkout Flow", agent: "Manus", status: "Failed", duration: "2m 30s", time: "22 min ago", logsCount: 23 },
  { id: "RUN-037", name: "Consensus Vote: Deploy", agent: "Orchestrator", status: "Success", duration: "60s", time: "25 min ago", logsCount: 6 },
];

const recentLogs: LogEntry[] = [
  { timestamp: "16:42:15", level: "INFO", agent: "Codex", message: "Security analysis completed for payments.ts" },
  { timestamp: "16:42:10", level: "INFO", agent: "GLM-4.7", message: "Code review delegated: auth.ts" },
  { timestamp: "16:41:58", level: "WARN", agent: "Gemini", message: "Rate limit approaching (85% usage)" },
  { timestamp: "16:41:45", level: "INFO", agent: "Orchestrator", message: "Task TSK-003 assigned to Gemini ui-reviewer" },
  { timestamp: "16:41:30", level: "INFO", agent: "Pencil", message: "Design system component created: Card" },
  { timestamp: "16:41:15", level: "ERROR", agent: "Manus", message: "Browser session timeout - retrying..." },
  { timestamp: "16:41:00", level: "INFO", agent: "Subagent", message: "Parallel exploration completed: 3 files analyzed" },
  { timestamp: "16:40:45", level: "INFO", agent: "Orchestrator", message: "Consensus vote passed: 3/3 approved" },
];

export default function RunsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="runs" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="runs" />

          <div className="flex-1 p-4 lg:p-10 overflow-auto">
            <div className="mb-4 lg:mb-6">
              <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                Runs
              </h1>
              <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
                Execution history and system logs
              </p>
            </div>

            {/* Runs List */}
            <Card className="mb-4 lg:mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    Recent Runs
                  </h2>
                  <Badge variant="secondary">{runs.length} runs</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between py-3 border-b border-[var(--border)] last:border-0 gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] lg:text-xs font-mono text-[var(--muted-foreground)]">
                          {run.id}
                        </span>
                        <div>
                          <p className="text-xs lg:text-sm font-secondary text-[var(--foreground)]">
                            {run.name}
                          </p>
                          <p className="text-[10px] lg:text-xs text-[var(--muted-foreground)]">
                            {run.agent} · {run.duration} · {run.logsCount} logs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-auto">
                        <span className="text-[10px] lg:text-xs text-[var(--muted-foreground)]">
                          {run.time}
                        </span>
                        <Badge
                          variant={
                            run.status === "Success"
                              ? "success"
                              : run.status === "Running"
                              ? "default"
                              : "error"
                          }
                          className="text-[10px] lg:text-xs"
                        >
                          {run.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Logs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    Live Logs
                  </h2>
                  <Badge variant="success">Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-xs lg:text-sm">
                  {recentLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col lg:flex-row lg:items-start gap-1 lg:gap-4 py-2 border-b border-[var(--border)] last:border-0"
                    >
                      <div className="flex items-center gap-2 lg:gap-4">
                        <span className="text-[var(--muted-foreground)] w-16 lg:w-20 flex-shrink-0">
                          {log.timestamp}
                        </span>
                        <Badge
                          variant={
                            log.level === "ERROR"
                              ? "error"
                              : log.level === "WARN"
                              ? "warning"
                              : "success"
                          }
                          className="w-12 lg:w-14 justify-center text-[10px] lg:text-xs"
                        >
                          {log.level}
                        </Badge>
                        <span className="text-[var(--primary)] w-20 lg:w-24 flex-shrink-0 truncate">
                          [{log.agent}]
                        </span>
                      </div>
                      <span className="text-[var(--foreground)]">{log.message}</span>
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
