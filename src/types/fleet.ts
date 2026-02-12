import { z } from "zod";

// ─── Agent Fleet Types ──────────────────────────────────────────────────────

export const AgentNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  provider: z.enum(["codex", "glm", "gemini", "pencil", "grok", "claude"]),
  role: z.string(),
  status: z.enum(["active", "idle", "offline", "error"]),
  latencyMs: z.number().optional(),
  errorRate: z.number().optional(),
  taskCount: z.number().default(0),
});

export type AgentNode = z.infer<typeof AgentNodeSchema>;

export const DependencyEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  weight: z.number().default(1),
});

export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;

export const FleetHealthSchema = z.object({
  totalAgents: z.number(),
  activeAgents: z.number(),
  errorAgents: z.number(),
  avgLatencyMs: z.number(),
  avgErrorRate: z.number(),
  overallStatus: z.enum(["healthy", "degraded", "critical"]),
});

export type FleetHealth = z.infer<typeof FleetHealthSchema>;
