import type { ExecutionPlan, ExecutionStep } from "./orchestration";

export interface Message {
  readonly id: string;
  readonly type: "user" | "orchestrator" | "system";
  readonly content: string;
  readonly timestamp: Date;
  readonly status?: "pending" | "delegating" | "completed" | "error";
  readonly details?: readonly string[];
  readonly routing?: {
    readonly suggestedAgent?: string;
    readonly confidence?: number;
  };
  readonly projectId?: string;
  readonly conversationId?: string;
}

/** Actions produced by ChatOrchestrationService */
export type ChatAction =
  | { readonly type: "add-message"; readonly message: Message }
  | { readonly type: "update-message"; readonly messageId: string; readonly updates: Partial<Pick<Message, "status" | "routing">> }
  | { readonly type: "add-plan"; readonly plan: ExecutionPlan }
  | { readonly type: "update-step"; readonly planId: string; readonly stepId: string; readonly status: ExecutionStep["status"] };
