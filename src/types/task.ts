import { z } from "zod";

export const TaskStatusSchema = z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskPrioritySchema = z.enum(["critical", "high", "medium", "low"]);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  assignee: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  blockedBy: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
