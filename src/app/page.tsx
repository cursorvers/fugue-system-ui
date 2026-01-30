"use client";

import { Sidebar } from "@/components/Sidebar";
import { MetricCard, Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";

const sidebarSections = [
  {
    title: "Orchestrator",
    items: [
      { icon: "dashboard", label: "Dashboard", active: true },
      { icon: "smart_toy", label: "Agents" },
      { icon: "task_alt", label: "Tasks" },
      { icon: "receipt_long", label: "Logs" },
    ],
  },
  {
    title: "Execution Tier",
    items: [
      { icon: "code", label: "Codex" },
      { icon: "psychology", label: "GLM-4.7" },
      { icon: "stars", label: "Gemini" },
      { icon: "design_services", label: "Pencil" },
    ],
  },
];

const agents = [
  { name: "Codex", description: "Design, Security, Analysis", status: "Online", color: "#FF8400" },
  { name: "GLM-4.7", description: "Code review, Math, Refactor", status: "Online", color: "#3B82F6" },
  { name: "Gemini", description: "UI/UX Review, Image Analysis", status: "Online", color: "#8B5CF6" },
  { name: "Pencil", description: "UI Design, Components", status: "Online", color: "#EC4899" },
];

const recentTasks = [
  { name: "Code Review: auth.ts", time: "2 min ago" },
  { name: "Security Analysis: payments.ts", time: "5 min ago" },
  { name: "UI Review: Dashboard", time: "8 min ago" },
  { name: "Design: Settings Page", time: "12 min ago" },
  { name: "Plan Review: API Refactor", time: "15 min ago" },
];

export default function Dashboard() {
  return (
    <div className="flex h-full bg-[var(--background)]">
      <Sidebar
        logo="FUGUE"
        sections={sidebarSections}
        footer={{ name: "Joe Doe", email: "joe@acmecorp.com" }}
      />

      <main className="flex-1 flex flex-col gap-8 p-10 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-primary font-semibold text-[var(--foreground)]">
              FUGUE Dashboard
            </h1>
            <p className="text-sm font-secondary text-[var(--muted-foreground)]">
              Federated Unified Governance for Universal Execution
            </p>
          </div>
          <Badge variant="success">System Online</Badge>
        </div>

        {/* Metrics */}
        <div className="flex gap-4">
          <MetricCard label="Active Agents" value="4 / 6" />
          <MetricCard label="Tasks Queued" value="12" />
          <MetricCard label="Success Rate" value="98.5%" valueColor="var(--color-success-foreground)" />
          <MetricCard label="Avg Response" value="1.2s" />
        </div>

        {/* Content Row */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Agents List */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-base font-primary font-semibold text-[var(--foreground)]">
                Execution Tier Agents
              </h2>
              <Button variant="ghost" size="default">
                View All
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 overflow-auto">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: agent.color }}
                    >
                      <span className="text-white text-xs font-bold">
                        {agent.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-primary font-medium text-[var(--foreground)]">
                        {agent.name}
                      </p>
                      <p className="text-xs font-secondary text-[var(--muted-foreground)]">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">{agent.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card className="w-[320px] flex flex-col">
            <CardHeader>
              <h2 className="text-base font-primary font-semibold text-[var(--foreground)]">
                Recent Tasks
              </h2>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-2 overflow-auto">
              {recentTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                >
                  <span className="text-sm font-secondary text-[var(--foreground)]">
                    {task.name}
                  </span>
                  <span className="text-xs font-secondary text-[var(--muted-foreground)]">
                    {task.time}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
