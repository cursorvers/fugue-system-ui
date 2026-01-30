"use client";

import { Sidebar } from "@/components/Sidebar";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const agents = [
  {
    name: "Codex",
    role: "security-analyst",
    description: "Design, Security, Analysis",
    status: "Online",
    color: "#FF8400",
    tasks: 156,
    successRate: "99.2%",
  },
  {
    name: "GLM-4.7",
    role: "code-reviewer",
    description: "Code review, Math, Refactor",
    status: "Online",
    color: "#3B82F6",
    tasks: 342,
    successRate: "98.8%",
  },
  {
    name: "Gemini",
    role: "ui-reviewer",
    description: "UI/UX Review, Image Analysis",
    status: "Online",
    color: "#8B5CF6",
    tasks: 89,
    successRate: "97.5%",
  },
  {
    name: "Pencil",
    role: "design-system",
    description: "UI Design, Components",
    status: "Online",
    color: "#EC4899",
    tasks: 67,
    successRate: "100%",
  },
  {
    name: "Subagent",
    role: "explore",
    description: "Research, Parallel Tasks",
    status: "Idle",
    color: "#10B981",
    tasks: 234,
    successRate: "96.3%",
  },
  {
    name: "Manus",
    role: "browser",
    description: "Browser Automation, Research",
    status: "Offline",
    color: "#6B7280",
    tasks: 12,
    successRate: "91.7%",
  },
];

export default function AgentsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)]">
        <Sidebar activePage="agents" />

      <main className="flex-1 p-8 lg:p-10 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-primary text-2xl font-semibold text-[var(--foreground)]">
              Agent Management
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Monitor and configure execution tier agents
            </p>
          </div>
          <Button variant="default">Add Agent</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.name} className="flex flex-col">
              <CardHeader className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: agent.color }}
                  >
                    <span className="text-white text-sm font-bold">
                      {agent.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-primary text-base font-semibold text-[var(--foreground)]">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {agent.role}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    agent.status === "Online"
                      ? "success"
                      : agent.status === "Idle"
                      ? "secondary"
                      : "secondary"
                  }
                >
                  {agent.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  {agent.description}
                </p>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-[var(--muted-foreground)]">Tasks</p>
                    <p className="font-primary font-semibold text-[var(--foreground)]">
                      {agent.tasks}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--muted-foreground)]">Success</p>
                    <p className="font-primary font-semibold text-[var(--color-success-foreground)]">
                      {agent.successRate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}
