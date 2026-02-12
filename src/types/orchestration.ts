import { z } from "zod";

// ─── Execution Plan ─────────────────────────────────────────────────────────

export const ExecutionStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  agent: z.string().optional(),
  provider: z.string().optional(),
  description: z.string().optional(),
  estimatedTokens: z.number().optional(),
  status: z.enum(["pending", "running", "completed", "failed", "skipped"]).default("pending"),
});

export type ExecutionStep = z.infer<typeof ExecutionStepSchema>;

export const ExecutionPlanSchema = z.object({
  id: z.string(),
  taskId: z.string().optional(),
  title: z.string(),
  mode: z.enum(["tutti", "forte", "max"]).default("tutti"),
  steps: z.array(ExecutionStepSchema),
  status: z.enum(["pending", "approved", "rejected", "executing", "completed", "failed"]).default("pending"),
  createdAt: z.string().or(z.number()),
  approvedAt: z.string().or(z.number()).optional(),
  rejectedReason: z.string().optional(),
});

export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

// ─── Approval Request ───────────────────────────────────────────────────────

export const ApprovalRequestSchema = z.object({
  planId: z.string(),
  requester: z.string().optional(),
  reason: z.string().optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).default("low"),
  autoApproveTimeout: z.number().optional(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;
