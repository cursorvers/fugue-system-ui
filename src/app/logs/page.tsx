"use client";

import { Sidebar } from "@/components/Sidebar";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const logs = [
  {
    timestamp: "16:42:15",
    level: "INFO",
    agent: "Codex",
    message: "Security analysis completed for payments.ts",
  },
  {
    timestamp: "16:42:10",
    level: "INFO",
    agent: "GLM-4.7",
    message: "Code review delegated: auth.ts",
  },
  {
    timestamp: "16:41:58",
    level: "WARN",
    agent: "Gemini",
    message: "Rate limit approaching (85% usage)",
  },
  {
    timestamp: "16:41:45",
    level: "INFO",
    agent: "Orchestrator",
    message: "Task TSK-003 assigned to Gemini ui-reviewer",
  },
  {
    timestamp: "16:41:30",
    level: "INFO",
    agent: "Pencil",
    message: "Design system component created: Card",
  },
  {
    timestamp: "16:41:15",
    level: "ERROR",
    agent: "Manus",
    message: "Browser session timeout - retrying...",
  },
  {
    timestamp: "16:41:00",
    level: "INFO",
    agent: "Subagent",
    message: "Parallel exploration completed: 3 files analyzed",
  },
  {
    timestamp: "16:40:45",
    level: "INFO",
    agent: "Orchestrator",
    message: "Consensus vote passed: 3/3 approved",
  },
];

export default function LogsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)]">
        <Sidebar activePage="logs" />

      <main className="flex-1 p-8 lg:p-10 overflow-auto">
        <div className="mb-6">
          <h1 className="font-primary text-2xl font-semibold text-[var(--foreground)]">
            System Logs
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Real-time activity and event logs
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-primary text-base font-semibold text-[var(--foreground)]">
                Recent Activity
              </h2>
              <Badge variant="success">Live</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 py-2 border-b border-[var(--border)] last:border-0"
                >
                  <span className="text-[var(--muted-foreground)] w-20 flex-shrink-0">
                    {log.timestamp}
                  </span>
                  <Badge
                    variant={
                      log.level === "ERROR"
                        ? "default"
                        : log.level === "WARN"
                        ? "secondary"
                        : "success"
                    }
                    className="w-14 justify-center"
                  >
                    {log.level}
                  </Badge>
                  <span className="text-[var(--primary)] w-24 flex-shrink-0">
                    [{log.agent}]
                  </span>
                  <span className="text-[var(--foreground)]">{log.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      </div>
    </ProtectedRoute>
  );
}
