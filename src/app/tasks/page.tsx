"use client";

import { Sidebar } from "@/components/Sidebar";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const tasks = [
  {
    id: "TSK-001",
    name: "Code Review: auth.ts",
    agent: "GLM-4.7",
    status: "Completed",
    time: "2 min ago",
  },
  {
    id: "TSK-002",
    name: "Security Analysis: payments.ts",
    agent: "Codex",
    status: "Completed",
    time: "5 min ago",
  },
  {
    id: "TSK-003",
    name: "UI Review: Dashboard",
    agent: "Gemini",
    status: "In Progress",
    time: "8 min ago",
  },
  {
    id: "TSK-004",
    name: "Design: Settings Page",
    agent: "Pencil",
    status: "Queued",
    time: "12 min ago",
  },
  {
    id: "TSK-005",
    name: "Plan Review: API Refactor",
    agent: "Codex",
    status: "Completed",
    time: "15 min ago",
  },
  {
    id: "TSK-006",
    name: "Refactor: utils.ts",
    agent: "GLM-4.7",
    status: "Queued",
    time: "18 min ago",
  },
];

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)]">
        <Sidebar activePage="tasks" />

      <main className="flex-1 p-8 lg:p-10 overflow-auto">
        <div className="mb-6">
          <h1 className="font-primary text-2xl font-semibold text-[var(--foreground)]">
            Task Queue
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Monitor delegated tasks and their status
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-primary text-base font-semibold text-[var(--foreground)]">
                All Tasks
              </h2>
              <Badge variant="secondary">{tasks.length} tasks</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-[var(--muted-foreground)]">
                      {task.id}
                    </span>
                    <div>
                      <p className="text-sm font-secondary text-[var(--foreground)]">
                        {task.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Assigned to {task.agent}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--muted-foreground)]">
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
                    >
                      {task.status}
                    </Badge>
                  </div>
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
