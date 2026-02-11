"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { MetricCard, Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { Agent, Run, InboxItem } from "@/types";

const statusColors: Record<Agent["status"], "success" | "warning" | "secondary"> = {
  active: "success",
  idle: "warning",
  offline: "secondary",
  error: "secondary",
};

const runStatusConfig: Record<Run["status"], { badge: "success" | "info" | "error" | "warning" | "secondary"; icon: string }> = {
  completed: { badge: "success", icon: "check_circle" },
  running: { badge: "info", icon: "progress_activity" },
  failed: { badge: "error", icon: "error" },
  queued: { badge: "secondary", icon: "schedule" },
  cancelled: { badge: "warning", icon: "cancel" },
};

const inboxTypeConfig: Record<InboxItem["type"], { icon: string; color: string }> = {
  review: { icon: "rate_review", color: "text-[var(--primary)]" },
  alert: { icon: "warning", color: "text-[var(--color-warning-foreground)]" },
  info: { icon: "info", color: "text-[var(--muted-foreground)]" },
  approval: { icon: "check_circle", color: "text-[var(--color-success-foreground)]" },
};

export default function Dashboard() {
  const [inboxOpen, setInboxOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const {
    agents,
    runs,
    inbox,
    metrics,
    dataSource,
    isConnected,
    isConnecting,
    error,
    refresh,
  } = useDashboardData();

  const unreadCount = inbox.filter((i) => !i.read).length;

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

          {/* Connection Status */}
          <ConnectionStatus
            state={isConnected ? "connected" : isConnecting ? "connecting" : error ? "error" : "disconnected"}
            error={error}
            onReconnect={refresh}
          />

          <div className="flex-1 flex flex-col gap-6 p-4 lg:p-8 overflow-auto">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg lg:text-xl font-primary font-semibold text-[var(--foreground)]">
                  概要
                </h1>
                <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5">
                  システム状況と最近のアクティビティ
                  {dataSource === "live" && (
                    <span className="ml-2 text-[var(--color-success-foreground)]">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success-foreground)] mr-1 align-middle" aria-hidden="true" />
                      Live
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "success" : "secondary"} dot>
                  {isConnected ? "オンライン" : "オフライン"}
                </Badge>
                {dataSource === "live" && (
                  <Button variant="ghost" size="icon" onClick={refresh} aria-label="データを更新">
                    <span className="material-symbols-sharp text-[20px]">refresh</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInboxOpen(!inboxOpen)}
                  className="relative"
                  aria-label={`受信箱${unreadCount > 0 ? ` (${unreadCount}件 未読)` : ""}`}
                >
                  <span className="material-symbols-sharp text-[20px]">inbox</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--destructive)] text-white text-[10px] font-secondary font-bold flex items-center justify-center" aria-hidden="true">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                label="稼働エージェント"
                value={`${metrics.activeAgents.current} / ${metrics.activeAgents.total}`}
                icon="smart_toy"
                change="+1 本日"
                changeType="positive"
              />
              <MetricCard
                label="タスク / 24h"
                value={metrics.tasksLast24h.count}
                icon="task_alt"
                change={metrics.tasksLast24h.changePercent}
                changeType={metrics.tasksLast24h.changeType}
              />
              <MetricCard
                label="成功率"
                value={metrics.successRate.value}
                icon="verified"
                change={metrics.successRate.change}
                changeType={metrics.successRate.changeType}
              />
              <MetricCard
                label="平均レイテンシ"
                value={metrics.avgLatency.value}
                icon="speed"
                change={metrics.avgLatency.change}
                changeType={metrics.avgLatency.changeType}
              />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
              {/* Agents */}
              <Card className="flex flex-col min-h-0">
                <CardHeader className="flex items-center justify-between">
                  <h2 className="text-[13px] font-primary font-semibold text-[var(--foreground)] uppercase tracking-wider">
                    エージェント
                  </h2>
                  <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                    {agents.filter((a) => a.status === "active").length} 稼働中
                  </span>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-1 overflow-auto p-2">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                      className={`flex items-center gap-3 px-2 py-2 min-h-[44px] rounded-[var(--radius-m)] hover:bg-[var(--secondary)] transition-colors cursor-pointer text-left w-full ${
                        agent.id === selectedAgent ? "bg-[var(--secondary)]" : ""
                      }`}
                      aria-expanded={agent.id === selectedAgent}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-[var(--radius-m)] bg-[var(--muted)] flex items-center justify-center">
                          <span className="text-xs font-secondary font-semibold text-[var(--foreground)]">
                            {agent.name.charAt(0)}
                          </span>
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--card)] ${
                            agent.status === "active" ? "bg-[var(--color-success-foreground)]" :
                            agent.status === "idle" ? "bg-[var(--color-warning-foreground)]" :
                            "bg-[var(--muted-foreground)]"
                          }`}
                          aria-label={agent.status}
                        />
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
                        <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">{agent.latency}</p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Runs */}
              <Card className="lg:col-span-2 flex flex-col min-h-0">
                <CardHeader className="flex items-center justify-between">
                  <h2 className="text-[13px] font-primary font-semibold text-[var(--foreground)] uppercase tracking-wider">
                    最近の実行
                  </h2>
                  <Button variant="ghost" size="sm">すべて表示</Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                  <table className="w-full">
                    <caption className="sr-only">最近のオーケストレーション実行</caption>
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th scope="col" className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">実行</th>
                        <th scope="col" className="text-left text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">ステータス</th>
                        <th scope="col" className="text-right text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2 hidden sm:table-cell">所要時間</th>
                        <th scope="col" className="text-right text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-2">時刻</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run) => {
                        const config = runStatusConfig[run.status];
                        return (
                          <tr key={run.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className={`material-symbols-sharp text-[16px] ${
                                  run.status === "running" ? "text-[var(--color-info-foreground)] pulse-live" :
                                  run.status === "failed" ? "text-[var(--color-error-foreground)]" :
                                  "text-[var(--color-success-foreground)]"
                                }`} aria-hidden="true">
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
                              <span className="text-[12px] font-secondary text-[var(--muted-foreground)]">
                                {run.startedAt ? new Date(run.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                              </span>
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
            role="presentation"
          >
            <div className="absolute inset-0 bg-black/30 lg:hidden" />
            <aside
              className="absolute right-0 top-0 h-full w-[340px] bg-[var(--card)] border-l border-[var(--border)] shadow-[var(--shadow-l)] flex flex-col z-50"
              role="dialog"
              aria-label="受信箱"
              aria-modal="true"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h2 className="text-[13px] font-primary font-semibold text-[var(--foreground)] uppercase tracking-wider">
                  受信箱
                </h2>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-[11px]">
                    すべて既読にする
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setInboxOpen(false)} aria-label="受信箱を閉じる">
                    <span className="material-symbols-sharp text-[18px]">close</span>
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto" role="list" aria-label="受信メッセージ">
                {inbox.map((item) => {
                  const config = inboxTypeConfig[item.type];
                  return (
                    <div
                      key={item.id}
                      role="listitem"
                      className={`flex gap-3 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--secondary)] transition-colors cursor-pointer ${
                        !item.read ? "bg-[var(--color-info)]" : ""
                      }`}
                    >
                      <span className={`material-symbols-sharp text-[18px] mt-0.5 flex-shrink-0 ${config.color}`} aria-hidden="true">
                        {config.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-[13px] font-primary truncate ${!item.read ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}`}>
                            {item.title}
                          </p>
                          {!item.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" aria-label="未読" />
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
