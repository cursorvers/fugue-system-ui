"use client";

import { useCallback, useRef } from "react";
import { ChatOrchestrationService } from "@/lib/chat-orchestration";
import type { ChatAction, Message } from "@/types/chat";
import type { ExecutionStep } from "@/types/orchestration";

interface UseChatOrchestrationOptions {
  readonly addMessage: (message: Message) => void;
  readonly updateMessage: (id: string, updates: Partial<Pick<Message, "status" | "routing">>) => void;
  readonly addPlan: (plan: Parameters<UseChatOrchestrationOptions["addMessage"]>[0] extends never ? never : any) => void;
  readonly updateStepStatus: (planId: string, stepId: string, status: ExecutionStep["status"]) => void;
}

/**
 * React hook wrapping ChatOrchestrationService.
 * Converts WS messages into state updates via the service's dispatch.
 */
export function useChatOrchestration({
  addMessage,
  updateMessage,
  addPlan,
  updateStepStatus,
}: UseChatOrchestrationOptions) {
  const serviceRef = useRef<ChatOrchestrationService | null>(null);
  if (!serviceRef.current) {
    serviceRef.current = new ChatOrchestrationService();
  }

  const handleWebSocketMessage = useCallback(
    (wsMessage: Record<string, unknown>) => {
      const actions = serviceRef.current!.dispatch(
        wsMessage as { type: string; [key: string]: unknown },
      );

      for (const action of actions) {
        switch (action.type) {
          case "add-message":
            addMessage(action.message);
            break;
          case "update-message":
            updateMessage(action.messageId, action.updates);
            break;
          case "add-plan":
            addPlan(action.plan);
            break;
          case "update-step":
            updateStepStatus(action.planId, action.stepId, action.status);
            break;
        }
      }
    },
    [addMessage, updateMessage, addPlan, updateStepStatus],
  );

  return { handleWebSocketMessage };
}
