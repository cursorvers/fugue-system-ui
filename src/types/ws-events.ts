import { z } from "zod";
import { AgentSchema } from "./agent";
import { RunSchema } from "./run";
import { TaskSchema } from "./task";
import { InboxItemSchema } from "./inbox";
import { DashboardMetricsSchema } from "./metrics";

// =============================================================================
// Ideal Event Types (future backend alignment)
// =============================================================================

export const WsEventTypeSchema = z.enum([
  "agent-update",
  "run-update",
  "task-update",
  "inbox-update",
  "metric-update",
  "status-response",
  "chat-response",
  "error",
  "pong",
]);
export type WsEventType = z.infer<typeof WsEventTypeSchema>;

export const WsAgentUpdateSchema = z.object({
  type: z.literal("agent-update"),
  payload: AgentSchema,
});

export const WsRunUpdateSchema = z.object({
  type: z.literal("run-update"),
  payload: RunSchema,
});

export const WsTaskUpdateSchema = z.object({
  type: z.literal("task-update"),
  payload: TaskSchema,
});

export const WsInboxUpdateSchema = z.object({
  type: z.literal("inbox-update"),
  payload: InboxItemSchema,
});

export const WsMetricUpdateSchema = z.object({
  type: z.literal("metric-update"),
  payload: DashboardMetricsSchema,
});

export const WsChatResponseSchema = z.object({
  type: z.literal("chat-response"),
  payload: z.object({
    taskId: z.string().optional(),
    role: z.string().optional(),
    message: z.string().optional(),
    content: z.string().optional(),
    streaming: z.boolean().optional(),
    done: z.boolean().optional(),
    timestamp: z.number().optional(),
  }),
});

export const WsErrorSchema = z.object({
  type: z.literal("error"),
  payload: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
  message: z.string().optional(),
});

export const WsEventSchema = z.discriminatedUnion("type", [
  WsAgentUpdateSchema,
  WsRunUpdateSchema,
  WsTaskUpdateSchema,
  WsInboxUpdateSchema,
  WsMetricUpdateSchema,
  WsChatResponseSchema,
  WsErrorSchema,
]);

export type WsEvent = z.infer<typeof WsEventSchema>;

// =============================================================================
// Actual Server Messages (from cockpit-websocket DO)
// =============================================================================

// D1 task record from status-request
export const ServerTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  executor: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.number()]),
  updatedAt: z.union([z.string(), z.number()]).optional(),
  logs: z.string().nullable().optional(),
  result: z.unknown().optional(),
});
export type ServerTask = z.infer<typeof ServerTaskSchema>;

// Git repo from status-request
export const ServerGitRepoSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  branch: z.string().optional(),
  status: z.string().optional(),
  uncommittedCount: z.number().optional(),
  aheadCount: z.number().optional(),
  behindCount: z.number().optional(),
  lastChecked: z.union([z.string(), z.number()]).optional(),
  modifiedFiles: z.array(z.string()).optional(),
});
export type ServerGitRepo = z.infer<typeof ServerGitRepoSchema>;

// Alert from status-request
export const ServerAlertSchema = z.object({
  id: z.union([z.string(), z.number()]),
  severity: z.string(),
  title: z.string(),
  message: z.string().optional(),
  source: z.string().optional(),
  createdAt: z.union([z.string(), z.number()]),
  acknowledged: z.boolean().optional(),
});
export type ServerAlert = z.infer<typeof ServerAlertSchema>;

// Provider health from observability-sync
export const ServerProviderHealthSchema = z.object({
  provider: z.string(),
  status: z.string(),
  latencyP95Ms: z.number().optional(),
  errorRate: z.number().optional(),
  lastRequestAt: z.union([z.string(), z.number()]).optional(),
});
export type ServerProviderHealth = z.infer<typeof ServerProviderHealthSchema>;

// All server-to-client message types from the DO
export const ServerTasksMessageSchema = z.object({
  type: z.literal("tasks"),
  payload: z.array(ServerTaskSchema),
});

export const ServerGitStatusMessageSchema = z.object({
  type: z.literal("git-status"),
  payload: z.object({
    repos: z.array(ServerGitRepoSchema),
  }),
});

export const ServerAlertMessageSchema = z.object({
  type: z.literal("alert"),
  payload: ServerAlertSchema,
});

export const ServerObservabilitySyncSchema = z.object({
  type: z.literal("observability-sync"),
  payload: z.object({
    provider_health: z.array(ServerProviderHealthSchema).optional(),
  }),
});

export const ServerAckSchema = z.object({
  type: z.literal("ack"),
  taskId: z.string().optional(),
  message: z.string().optional(),
  agentCount: z.number().optional(),
  routing: z.object({
    suggestedAgent: z.string().optional(),
    confidence: z.number().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export const ServerTaskCreatedSchema = z.object({
  type: z.literal("task_created"),
  payload: z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    executor: z.string().optional(),
    createdAt: z.union([z.string(), z.number()]),
    updatedAt: z.union([z.string(), z.number()]).optional(),
  }),
});

export const ServerTaskResultSchema = z.object({
  type: z.literal("task-result"),
  taskId: z.string(),
  result: z.unknown().optional(),
  status: z.string(),
  logs: z.string().optional(),
});

export const ServerPingSchema = z.object({
  type: z.literal("ping"),
  timestamp: z.number().optional(),
});

export const ServerPongSchema = z.object({
  type: z.literal("pong"),
  timestamp: z.number().optional(),
});

// Union of all actual server message types
export type ServerMessage =
  | z.infer<typeof ServerTasksMessageSchema>
  | z.infer<typeof ServerGitStatusMessageSchema>
  | z.infer<typeof ServerAlertMessageSchema>
  | z.infer<typeof ServerObservabilitySyncSchema>
  | z.infer<typeof ServerAckSchema>
  | z.infer<typeof ServerTaskCreatedSchema>
  | z.infer<typeof ServerTaskResultSchema>
  | z.infer<typeof WsChatResponseSchema>
  | z.infer<typeof WsErrorSchema>
  | z.infer<typeof ServerPingSchema>
  | z.infer<typeof ServerPongSchema>;

// =============================================================================
// Client-to-Server Messages
// =============================================================================

export const WsClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("chat"),
    payload: z.object({
      message: z.string(),
      context: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
  z.object({
    type: z.literal("command"),
    payload: z.object({
      command: z.string(),
      args: z.array(z.string()).optional(),
    }),
  }),
  z.object({
    type: z.literal("status-request"),
  }),
  z.object({
    type: z.literal("ping"),
  }),
]);

export type WsClientMessage = z.infer<typeof WsClientMessageSchema>;
