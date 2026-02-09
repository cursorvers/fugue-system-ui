"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWebSocket, type WebSocketMessage } from "./useWebSocket";
import { mockAgents } from "@/data/mock-agents";
import { mockRuns } from "@/data/mock-runs";
import { mockInboxItems } from "@/data/mock-inbox";
import { mockMetrics } from "@/data/mock-metrics";
import type {
  Agent,
  Run,
  InboxItem,
  DashboardMetrics,
  ServerTask,
  ServerGitRepo,
  ServerAlert,
  ServerProviderHealth,
} from "@/types";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  "wss://cockpit-public-ws.masa-stage1.workers.dev/ws";

interface DashboardState {
  readonly serverTasks: readonly ServerTask[];
  readonly gitRepos: readonly ServerGitRepo[];
  readonly alerts: readonly ServerAlert[];
  readonly providerHealth: readonly ServerProviderHealth[];
  readonly dataSource: "mock" | "live";
}

const INITIAL_STATE: DashboardState = {
  serverTasks: [],
  gitRepos: [],
  alerts: [],
  providerHealth: [],
  dataSource: "mock",
};

// Map server tasks to frontend Run type
function serverTaskToRun(task: ServerTask): Run {
  const createdAtMs =
    typeof task.createdAt === "number"
      ? task.createdAt * 1000
      : Date.parse(task.createdAt);
  const updatedAtMs = task.updatedAt
    ? typeof task.updatedAt === "number"
      ? task.updatedAt * 1000
      : Date.parse(String(task.updatedAt))
    : createdAtMs;

  const durationMs = updatedAtMs - createdAtMs;
  const durationStr =
    durationMs > 0 ? `${Math.round(durationMs / 1000)}s` : "—";

  return {
    id: task.id,
    name: task.title,
    status:
      task.status === "completed"
        ? "completed"
        : task.status === "failed"
          ? "failed"
          : task.status === "pending"
            ? "queued"
            : "running",
    duration: durationStr,
    agent: task.executor ?? undefined,
    startedAt: new Date(createdAtMs).toISOString(),
    completedAt:
      task.status === "completed" || task.status === "failed"
        ? new Date(updatedAtMs).toISOString()
        : undefined,
  };
}

// Map server alerts to InboxItem
function serverAlertToInbox(alert: ServerAlert, index: number): InboxItem {
  const createdAtMs =
    typeof alert.createdAt === "number"
      ? alert.createdAt * 1000
      : Date.parse(String(alert.createdAt));
  const minutesAgo = Math.round((Date.now() - createdAtMs) / 60000);
  const timeStr = minutesAgo < 1 ? "now" : `${minutesAgo}m`;

  return {
    id: 1000 + index,
    type: "alert",
    title: alert.title,
    body: alert.message ?? "",
    time: timeStr,
    read: alert.acknowledged ?? false,
    severity:
      alert.severity === "critical"
        ? "critical"
        : alert.severity === "major"
          ? "major"
          : alert.severity === "minor"
            ? "minor"
            : "info",
  };
}

// Compute metrics from server tasks
function computeMetrics(
  tasks: readonly ServerTask[],
  providerHealth: readonly ServerProviderHealth[],
): DashboardMetrics {
  const completed = tasks.filter((t) => t.status === "completed").length;
  const failed = tasks.filter((t) => t.status === "failed").length;
  const total = completed + failed;
  const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "100.0";

  const healthyProviders = providerHealth.filter(
    (p) => p.status === "healthy" || p.status === "degraded",
  ).length;

  return {
    activeAgents: {
      current: healthyProviders || mockMetrics.activeAgents.current,
      total: providerHealth.length || mockMetrics.activeAgents.total,
    },
    tasksLast24h: {
      count: tasks.length || mockMetrics.tasksLast24h.count,
      changePercent: mockMetrics.tasksLast24h.changePercent,
      changeType: mockMetrics.tasksLast24h.changeType,
    },
    successRate: {
      value: total > 0 ? `${rate}%` : mockMetrics.successRate.value,
      change: mockMetrics.successRate.change,
      changeType: mockMetrics.successRate.changeType,
    },
    avgLatency: mockMetrics.avgLatency,
  };
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const hasReceivedDataRef = useRef(false);

  const handleMessage = useCallback((msg: WebSocketMessage) => {
    switch (msg.type) {
      case "tasks": {
        const payload = msg.payload as ServerTask[];
        if (Array.isArray(payload)) {
          hasReceivedDataRef.current = true;
          setState((prev) => ({
            ...prev,
            serverTasks: payload,
            dataSource: "live" as const,
          }));
        }
        break;
      }

      case "git-status": {
        const payload = msg.payload as { repos: ServerGitRepo[] };
        if (payload?.repos && Array.isArray(payload.repos)) {
          setState((prev) => ({
            ...prev,
            gitRepos: payload.repos,
          }));
        }
        break;
      }

      case "alert": {
        const payload = msg.payload as ServerAlert;
        if (payload?.id) {
          setState((prev) => ({
            ...prev,
            alerts: [
              ...prev.alerts.filter((a) => a.id !== payload.id),
              payload,
            ],
          }));
        }
        break;
      }

      case "observability-sync": {
        const payload = msg.payload as {
          provider_health?: ServerProviderHealth[];
        };
        if (payload?.provider_health) {
          setState((prev) => ({
            ...prev,
            providerHealth: payload.provider_health ?? [],
          }));
        }
        break;
      }

      case "pong":
        break;

      default:
        break;
    }
  }, []);

  const {
    isConnected,
    isConnecting,
    error,
    send,
  } = useWebSocket({
    url: WS_URL,
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
    onMessage: handleMessage,
  });

  const refresh = useCallback(() => {
    send({ type: "status-request" });
  }, [send]);

  // Request fresh data on reconnect
  const prevConnected = useRef(false);
  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      // Small delay to let the connection stabilize
      const timer = setTimeout(refresh, 500);
      prevConnected.current = true;
      return () => clearTimeout(timer);
    }
    if (!isConnected) {
      prevConnected.current = false;
    }
  }, [isConnected, refresh]);

  // Derived data: use live data if available, mock otherwise
  const isLive = state.dataSource === "live";

  const agents: readonly Agent[] = isLive
    ? [...mockAgents]
    : mockAgents;

  const runs: readonly Run[] = isLive
    ? state.serverTasks.map(serverTaskToRun)
    : mockRuns;

  const inbox: readonly InboxItem[] =
    state.alerts.length > 0
      ? [
          ...state.alerts.map(serverAlertToInbox),
          ...mockInboxItems.filter((i) => i.type !== "alert"),
        ]
      : mockInboxItems;

  const metrics: DashboardMetrics = isLive
    ? computeMetrics(state.serverTasks, state.providerHealth)
    : mockMetrics;

  return {
    agents,
    runs,
    inbox,
    metrics,
    gitRepos: state.gitRepos,
    alerts: state.alerts,
    providerHealth: state.providerHealth,
    dataSource: state.dataSource,
    isConnected,
    isConnecting,
    error,
    refresh,
  } as const;
}
