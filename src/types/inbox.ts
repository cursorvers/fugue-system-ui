import { z } from "zod";

export const InboxTypeSchema = z.enum(["review", "alert", "info", "approval"]);
export type InboxType = z.infer<typeof InboxTypeSchema>;

export const InboxSeveritySchema = z.enum(["critical", "major", "minor", "info"]);
export type InboxSeverity = z.infer<typeof InboxSeveritySchema>;

export const InboxItemSchema = z.object({
  id: z.number().int(),
  type: InboxTypeSchema,
  title: z.string(),
  body: z.string(),
  time: z.string(),
  read: z.boolean(),
  severity: InboxSeveritySchema.optional(),
  actionUrl: z.string().optional(),
});

export type InboxItem = z.infer<typeof InboxItemSchema>;
