"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
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
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="logs" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="logs" />

          <div className="flex-1 p-4 lg:p-10 overflow-auto">
            <div className="mb-4 lg:mb-6">
              <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                System Logs
              </h1>
              <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
                Real-time activity and event logs
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    Recent Activity
                  </h2>
                  <Badge variant="success">Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-xs lg:text-sm">
                  {logs.map((log, idx) => (
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
                      <span className="text-[var(--foreground)] pl-0 lg:pl-0">{log.message}</span>
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
