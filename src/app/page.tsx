"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { MetricCard, Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";

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

const quickActions = [
  { icon: "chat", label: "Chat", href: "/chat", color: "bg-[var(--primary)]" },
  { icon: "notifications", label: "Alerts", href: "/notifications", color: "bg-orange-500" },
  { icon: "smart_toy", label: "Agents", href: "/agents", color: "bg-purple-500" },
  { icon: "task_alt", label: "Tasks", href: "/tasks", color: "bg-green-500" },
];

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar activePage="dashboard" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Mobile Header with Hamburger Menu */}
          <MobileNav activePage="dashboard" />

          <div className="flex-1 flex flex-col gap-4 lg:gap-8 p-4 lg:p-10 overflow-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div>
                <h1 className="text-xl lg:text-[28px] font-primary font-semibold text-[var(--foreground)]">
                  FUGUE Dashboard
                </h1>
                <p className="text-xs lg:text-sm font-secondary text-[var(--muted-foreground)]">
                  Federated Unified Governance for Universal Execution
                </p>
              </div>
              <Badge variant="success" className="w-fit">System Online</Badge>
            </div>

            {/* Mobile Quick Actions */}
            <div className="lg:hidden grid grid-cols-4 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--sidebar)] transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center`}>
                    <span className="material-symbols-sharp text-white text-lg">{action.icon}</span>
                  </div>
                  <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Metrics - Horizontal scroll on mobile, grid on desktop */}
            <div className="flex lg:grid lg:grid-cols-4 gap-3 lg:gap-4 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
              <MetricCard label="Active Agents" value="4 / 6" className="min-w-[140px] lg:min-w-0" />
              <MetricCard label="Tasks Queued" value="12" className="min-w-[140px] lg:min-w-0" />
              <MetricCard label="Success Rate" value="98.5%" valueColor="var(--color-success-foreground)" className="min-w-[140px] lg:min-w-0" />
              <MetricCard label="Avg Response" value="1.2s" className="min-w-[140px] lg:min-w-0" />
            </div>

            {/* Content Row - Stack on mobile, side-by-side on desktop */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
              {/* Agents List */}
              <Card className="flex-1 flex flex-col">
                <CardHeader className="flex items-center justify-between">
                  <h2 className="text-sm lg:text-base font-primary font-semibold text-[var(--foreground)]">
                    Execution Tier Agents
                  </h2>
                  <Button variant="ghost" size="default" className="text-xs lg:text-sm">
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2 lg:gap-3 overflow-auto">
                  {agents.map((agent) => (
                    <div
                      key={agent.name}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div
                          className="w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: agent.color }}
                        >
                          <span className="text-white text-[10px] lg:text-xs font-bold">
                            {agent.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs lg:text-sm font-primary font-medium text-[var(--foreground)]">
                            {agent.name}
                          </p>
                          <p className="text-[10px] lg:text-xs font-secondary text-[var(--muted-foreground)]">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px] lg:text-xs">{agent.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Tasks */}
              <Card className="lg:w-[320px] flex flex-col">
                <CardHeader>
                  <h2 className="text-sm lg:text-base font-primary font-semibold text-[var(--foreground)]">
                    Recent Tasks
                  </h2>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-1 lg:gap-2 overflow-auto">
                  {recentTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                    >
                      <span className="text-xs lg:text-sm font-secondary text-[var(--foreground)] truncate flex-1 mr-2">
                        {task.name}
                      </span>
                      <span className="text-[10px] lg:text-xs font-secondary text-[var(--muted-foreground)] whitespace-nowrap">
                        {task.time}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
