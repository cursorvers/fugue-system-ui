import type { DashboardMetrics } from "@/types";

export const mockMetrics: DashboardMetrics = {
  activeAgents: {
    current: 4,
    total: 5,
  },
  tasksLast24h: {
    count: 75,
    changePercent: "+12%",
    changeType: "positive",
  },
  successRate: {
    value: "98.5%",
    change: "+0.3%",
    changeType: "positive",
  },
  avgLatency: {
    value: "0.7s",
    change: "-0.1s",
    changeType: "positive",
  },
};
