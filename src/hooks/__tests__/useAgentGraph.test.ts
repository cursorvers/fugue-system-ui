import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAgentGraph } from "../useAgentGraph";
import type { Agent } from "@/types/agent";

function createAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "agent-1",
    name: "Test Agent",
    role: "architect",
    status: "active",
    tasks: 3,
    latency: "120ms",
    ...overrides,
  };
}

describe("useAgentGraph", () => {
  describe("nodes", () => {
    it("maps agents to AgentNode format", () => {
      const agents = [createAgent()];
      const { result } = renderHook(() => useAgentGraph(agents));
      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].id).toBe("agent-1");
      expect(result.current.nodes[0].label).toBe("Test Agent");
      expect(result.current.nodes[0].latencyMs).toBe(120);
      expect(result.current.nodes[0].taskCount).toBe(3);
    });

    it("handles empty agents array", () => {
      const { result } = renderHook(() => useAgentGraph([]));
      expect(result.current.nodes).toEqual([]);
    });
  });

  describe("edges (buildEdges)", () => {
    it("creates edges from orchestrators to workers", () => {
      const agents = [
        createAgent({ id: "orch", role: "architect", provider: "codex" }),
        createAgent({ id: "worker", role: "code-reviewer", provider: "codex" }),
      ];
      const { result } = renderHook(() => useAgentGraph(agents));
      expect(result.current.edges.length).toBeGreaterThan(0);
      expect(result.current.edges[0].source).toBe("orch");
      expect(result.current.edges[0].target).toBe("worker");
    });

    it("creates feedback edges from security to architect", () => {
      const agents = [
        createAgent({ id: "arch", role: "architect" }),
        createAgent({ id: "sec", role: "security-analyst" }),
      ];
      const { result } = renderHook(() => useAgentGraph(agents));
      const feedbackEdge = result.current.edges.find((e) => e.label === "feedback");
      expect(feedbackEdge).toBeDefined();
      expect(feedbackEdge?.source).toBe("sec");
      expect(feedbackEdge?.target).toBe("arch");
    });

    it("assigns higher weight for same-provider connections", () => {
      const agents = [
        createAgent({ id: "orch", role: "architect", provider: "codex" }),
        createAgent({ id: "w1", role: "code-reviewer", provider: "codex" }),
        createAgent({ id: "w2", role: "analyst", provider: "glm" }),
      ];
      const { result } = renderHook(() => useAgentGraph(agents));
      const directEdge = result.current.edges.find((e) => e.target === "w1" && e.source === "orch");
      const crossEdge = result.current.edges.find((e) => e.target === "w2" && e.source === "orch");
      expect(directEdge?.weight).toBe(2);
      expect(crossEdge?.weight).toBe(1);
    });
  });

  describe("health (computeHealth)", () => {
    it("computes health for healthy fleet", () => {
      const agents = [
        createAgent({ id: "a1", status: "active", latency: "100ms" }),
        createAgent({ id: "a2", status: "active", latency: "200ms" }),
      ];
      const { result } = renderHook(() => useAgentGraph(agents));
      expect(result.current.health.totalAgents).toBe(2);
      expect(result.current.health.activeAgents).toBe(2);
      expect(result.current.health.errorAgents).toBe(0);
      expect(result.current.health.avgLatencyMs).toBe(150);
      expect(result.current.health.overallStatus).toBe("healthy");
    });

    it("detects degraded status", () => {
      const agents = [
        createAgent({ id: "a1", status: "active" }),
        createAgent({ id: "a2", status: "error" }),
        createAgent({ id: "a3", status: "active" }),
      ];
      const { result } = renderHook(() => useAgentGraph(agents));
      expect(result.current.health.overallStatus).toBe("degraded");
    });

    it("detects critical status when many errors", () => {
      const agents = [
        createAgent({ id: "a1", status: "error" }),
        createAgent({ id: "a2", status: "error" }),
        createAgent({ id: "a3", status: "active" }),
      ];
      const { result } = renderHook(() => useAgentGraph(agents));
      expect(result.current.health.overallStatus).toBe("critical");
    });

    it("handles empty agents", () => {
      const { result } = renderHook(() => useAgentGraph([]));
      expect(result.current.health.totalAgents).toBe(0);
      expect(result.current.health.avgLatencyMs).toBe(0);
    });

    it("parses latency in seconds", () => {
      const agents = [createAgent({ id: "a1", status: "active", latency: "1.5s" })];
      const { result } = renderHook(() => useAgentGraph(agents));
      expect(result.current.nodes[0].latencyMs).toBe(1500);
    });

    it("parses latency in minutes", () => {
      const agents = [createAgent({ id: "a1", status: "active", latency: "2m" })];
      const { result } = renderHook(() => useAgentGraph(agents));
      expect(result.current.nodes[0].latencyMs).toBe(120000);
    });
  });
});
