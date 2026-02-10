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
