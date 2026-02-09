import { z } from "zod";

export const AgentStatusSchema = z.enum(["active", "idle", "offline", "error"]);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentRoleSchema = z.enum([
  "architect",
  "code-reviewer",
  "security-analyst",
  "reviewer",
  "ui-reviewer",
  "designer",
  "analyst",
  "general-reviewer",
]);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: AgentRoleSchema,
  status: AgentStatusSchema,
  tasks: z.number().int().min(0),
  latency: z.string(),
  lastSeen: z.string().datetime().optional(),
  provider: z.enum(["codex", "glm", "gemini", "pencil", "grok"]).optional(),
});

export type Agent = z.infer<typeof AgentSchema>;
