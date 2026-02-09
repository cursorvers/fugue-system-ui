import { z } from "zod";

export const RunStatusSchema = z.enum(["queued", "running", "completed", "failed", "cancelled"]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const RunSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: RunStatusSchema,
  duration: z.string(),
  agent: z.string().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

export type Run = z.infer<typeof RunSchema>;
