import { z } from "zod";

export const MetricChangeTypeSchema = z.enum(["positive", "negative", "neutral"]);
export type MetricChangeType = z.infer<typeof MetricChangeTypeSchema>;

export const DashboardMetricsSchema = z.object({
  activeAgents: z.object({
    current: z.number().int(),
    total: z.number().int(),
  }),
  tasksLast24h: z.object({
    count: z.number().int(),
    changePercent: z.string(),
    changeType: MetricChangeTypeSchema,
  }),
  successRate: z.object({
    value: z.string(),
    change: z.string(),
    changeType: MetricChangeTypeSchema,
  }),
  avgLatency: z.object({
    value: z.string(),
    change: z.string(),
    changeType: MetricChangeTypeSchema,
  }),
});

export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
