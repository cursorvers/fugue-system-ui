import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatOrchestrationService } from "../chat-orchestration";

// Mock crypto.randomUUID for deterministic test output
beforeEach(() => {
  let counter = 0;
  vi.stubGlobal("crypto", {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${++counter}`,
  });
});

describe("ChatOrchestrationService", () => {
  const service = new ChatOrchestrationService();

  describe("dispatch", () => {
    it("returns empty array for unknown message type", () => {
      const result = service.dispatch({ type: "unknown" });
      expect(result).toEqual([]);
    });

    it("handles ack with taskId", () => {
      const actions = service.dispatch({
        type: "ack",
        taskId: "task-1",
        routing: { suggestedAgent: "codex-1", confidence: 0.95 },
      });
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("update-message");
      if (actions[0].type === "update-message") {
        expect(actions[0].messageId).toBe("task-1");
        expect(actions[0].updates.status).toBe("delegating");
        expect(actions[0].updates.routing?.suggestedAgent).toBe("codex-1");
      }
    });

    it("handles ack without taskId", () => {
      const actions = service.dispatch({ type: "ack" });
      expect(actions).toEqual([]);
    });

    it("handles chat-response", () => {
      const actions = service.dispatch({
        type: "chat-response",
        payload: {
          content: "Hello from orchestrator",
          role: "assistant",
          done: true,
        },
      });
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("add-message");
      if (actions[0].type === "add-message") {
        expect(actions[0].message.type).toBe("orchestrator");
        expect(actions[0].message.content).toBe("Hello from orchestrator");
        expect(actions[0].message.status).toBe("completed");
      }
    });

    it("handles chat-response with system role", () => {
      const actions = service.dispatch({
        type: "chat-response",
        payload: { content: "System message", role: "system" },
      });
      expect(actions).toHaveLength(1);
      if (actions[0].type === "add-message") {
        expect(actions[0].message.type).toBe("system");
      }
    });

    it("handles chat-response with empty content", () => {
      const actions = service.dispatch({
        type: "chat-response",
        payload: { content: "", role: "assistant" },
      });
      expect(actions).toEqual([]);
    });

    it("handles chat-response with message field fallback", () => {
      const actions = service.dispatch({
        type: "chat-response",
        payload: { message: "Fallback content" },
      });
      expect(actions).toHaveLength(1);
      if (actions[0].type === "add-message") {
        expect(actions[0].message.content).toBe("Fallback content");
      }
    });

    it("handles task_created", () => {
      const actions = service.dispatch({
        type: "task_created",
        payload: { id: "task-2", executor: "glm-1" },
      });
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("update-message");
      if (actions[0].type === "update-message") {
        expect(actions[0].messageId).toBe("task-2");
        expect(actions[0].updates.routing?.suggestedAgent).toBe("glm-1");
      }
    });

    it("handles task-result completed", () => {
      const actions = service.dispatch({
        type: "task-result",
        taskId: "task-3",
        status: "completed",
        logs: "Build succeeded",
      });
      expect(actions).toHaveLength(1);
      if (actions[0].type === "add-message") {
        expect(actions[0].message.status).toBe("completed");
        expect(actions[0].message.details).toEqual(["Build succeeded"]);
      }
    });

    it("handles task-result failed", () => {
      const actions = service.dispatch({
        type: "task-result",
        taskId: "task-4",
        status: "failed",
      });
      expect(actions).toHaveLength(1);
      if (actions[0].type === "add-message") {
        expect(actions[0].message.status).toBe("error");
        expect(actions[0].message.content).toBe("タスクが失敗しました");
      }
    });

    it("handles execution-plan", () => {
      const plan = {
        id: "plan-1",
        title: "Deploy",
        mode: "tutti",
        steps: [],
        status: "pending",
        createdAt: "2024-01-01",
      };
      const actions = service.dispatch({
        type: "execution-plan",
        payload: plan,
      });
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("add-plan");
    });

    it("handles plan-step-update", () => {
      const actions = service.dispatch({
        type: "plan-step-update",
        planId: "plan-1",
        stepId: "step-1",
        status: "completed",
      });
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("update-step");
      if (actions[0].type === "update-step") {
        expect(actions[0].planId).toBe("plan-1");
        expect(actions[0].stepId).toBe("step-1");
        expect(actions[0].status).toBe("completed");
      }
    });

    it("handles error with message field", () => {
      const actions = service.dispatch({
        type: "error",
        message: "Connection lost",
      });
      expect(actions).toHaveLength(1);
      if (actions[0].type === "add-message") {
        expect(actions[0].message.content).toBe("Connection lost");
        expect(actions[0].message.status).toBe("error");
      }
    });

    it("handles error with payload.message fallback", () => {
      const actions = service.dispatch({
        type: "error",
        payload: { message: "Server error" },
      });
      expect(actions).toHaveLength(1);
      if (actions[0].type === "add-message") {
        expect(actions[0].message.content).toBe("Server error");
      }
    });

    it("handles error with default message", () => {
      const actions = service.dispatch({ type: "error" });
      expect(actions).toHaveLength(1);
      if (actions[0].type === "add-message") {
        expect(actions[0].message.content).toBe("エラーが発生しました");
      }
    });
  });
});
