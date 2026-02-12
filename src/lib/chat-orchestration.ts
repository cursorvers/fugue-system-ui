/**
 * Chat Orchestration Service — Pure TypeScript, React-independent.
 *
 * Dispatches WebSocket messages to typed actions that the UI layer
 * can consume without knowing about WS message internals.
 */

import type { ExecutionPlan, ExecutionStep } from "@/types/orchestration";
import type { ChatAction } from "@/types/chat";

/** Raw WebSocket message from the server */
interface WsMessage {
  readonly type: string;
  readonly [key: string]: unknown;
}

type MessageHandler = (msg: WsMessage) => readonly ChatAction[];

export class ChatOrchestrationService {
  private readonly handlers: ReadonlyMap<string, MessageHandler>;

  constructor() {
    const handlerEntries: ReadonlyArray<[string, MessageHandler]> = [
      ["ack", this.handleAck],
      ["chat-response", this.handleChatResponse],
      ["task_created", this.handleTaskCreated],
      ["task-result", this.handleTaskResult],
      ["execution-plan", this.handleExecutionPlan],
      ["plan-step-update", this.handlePlanStepUpdate],
      ["error", this.handleError],
    ];
    this.handlers = new Map(handlerEntries);
  }

  /** Dispatch a WS message to zero or more ChatActions */
  dispatch(msg: WsMessage): readonly ChatAction[] {
    const handler = this.handlers.get(msg.type);
    if (!handler) return [];
    return handler(msg);
  }

  private handleAck(msg: WsMessage): readonly ChatAction[] {
    const taskId = msg.taskId as string | undefined;
    const routing = msg.routing as {
      suggestedAgent?: string;
      confidence?: number;
    } | undefined;
    if (!taskId) return [];
    return [{
      type: "update-message",
      messageId: taskId,
      updates: {
        status: "delegating" as const,
        routing: routing ? { suggestedAgent: routing.suggestedAgent, confidence: routing.confidence } : undefined,
      },
    }];
  }

  private handleChatResponse(msg: WsMessage): readonly ChatAction[] {
    const payload = msg.payload as {
      taskId?: string;
      role?: string;
      content?: string;
      message?: string;
      timestamp?: number;
      done?: boolean;
    };
    if (!payload) return [];
    const content = payload.content || payload.message || "";
    if (!content) return [];
    return [{
      type: "add-message",
      message: {
        id: `resp-${crypto.randomUUID()}`,
        type: payload.role === "system" ? "system" : "orchestrator",
        content,
        timestamp: payload.timestamp ? new Date(payload.timestamp * 1000) : new Date(),
        status: payload.done === false ? "delegating" : "completed",
      },
    }];
  }

  private handleTaskCreated(msg: WsMessage): readonly ChatAction[] {
    const payload = msg.payload as { id: string; executor?: string };
    if (!payload) return [];
    return [{
      type: "update-message",
      messageId: payload.id,
      updates: {
        status: "delegating" as const,
        routing: { suggestedAgent: payload.executor },
      },
    }];
  }

  private handleTaskResult(msg: WsMessage): readonly ChatAction[] {
    const taskId = msg.taskId as string | undefined;
    const status = msg.status as string | undefined;
    const logs = msg.logs as string | undefined;
    if (!taskId) return [];
    return [{
      type: "add-message",
      message: {
        id: `result-${crypto.randomUUID()}`,
        type: "orchestrator",
        content: status === "completed" ? "タスクが完了しました" : "タスクが失敗しました",
        timestamp: new Date(),
        status: status === "completed" ? "completed" : "error",
        details: logs ? [logs] : undefined,
      },
    }];
  }

  private handleExecutionPlan(msg: WsMessage): readonly ChatAction[] {
    const plan = msg.payload as ExecutionPlan;
    if (!plan?.id) return [];
    return [{ type: "add-plan", plan }];
  }

  private handlePlanStepUpdate(msg: WsMessage): readonly ChatAction[] {
    const planId = msg.planId as string;
    const stepId = msg.stepId as string;
    const status = msg.status as ExecutionStep["status"];
    if (!planId || !stepId || !status) return [];
    return [{ type: "update-step", planId, stepId, status }];
  }

  private handleError(msg: WsMessage): readonly ChatAction[] {
    const errorMsg =
      (msg.message as string) ||
      (msg.payload as { message?: string })?.message ||
      "エラーが発生しました";
    return [{
      type: "add-message",
      message: {
        id: `error-${crypto.randomUUID()}`,
        type: "system",
        content: errorMsg,
        timestamp: new Date(),
        status: "error",
      },
    }];
  }
}
