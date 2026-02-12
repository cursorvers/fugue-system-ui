import { describe, it, expect } from "vitest";
import {
  AgentSchema,
  AgentStatusSchema,
  AgentRoleSchema,
  RunSchema,
  RunStatusSchema,
  TaskSchema,
  TaskStatusSchema,
  TaskPrioritySchema,
  InboxItemSchema,
  InboxTypeSchema,
  InboxSeveritySchema,
  DashboardMetricsSchema,
  ExecutionPlanSchema,
  ExecutionStepSchema,
  AgentNodeSchema,
  DependencyEdgeSchema,
  FleetHealthSchema,
  ServerTaskSchema,
  ServerGitRepoSchema,
  ServerAlertSchema,
  WsEventSchema,
  WsClientMessageSchema,
} from "@/types";

describe("Zod schemas", () => {
  describe("AgentSchema", () => {
    it("accepts valid agent", () => {
      const result = AgentSchema.safeParse({
        id: "agent-1",
        name: "Architect",
        role: "architect",
        status: "active",
        tasks: 5,
        latency: "120ms",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = AgentSchema.safeParse({
        id: "agent-1",
        name: "Test",
        role: "architect",
        status: "unknown",
        tasks: 0,
        latency: "0ms",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative tasks", () => {
      const result = AgentSchema.safeParse({
        id: "agent-1",
        name: "Test",
        role: "architect",
        status: "active",
        tasks: -1,
        latency: "0ms",
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional provider", () => {
      const result = AgentSchema.safeParse({
        id: "agent-1",
        name: "Test",
        role: "code-reviewer",
        status: "idle",
        tasks: 0,
        latency: "50ms",
        provider: "glm",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("AgentStatusSchema", () => {
    it.each(["active", "idle", "offline", "error"])("accepts '%s'", (status) => {
      expect(AgentStatusSchema.safeParse(status).success).toBe(true);
    });
  });

  describe("AgentRoleSchema", () => {
    it.each([
      "architect", "code-reviewer", "security-analyst",
      "reviewer", "ui-reviewer", "designer", "analyst", "general-reviewer",
    ])("accepts '%s'", (role) => {
      expect(AgentRoleSchema.safeParse(role).success).toBe(true);
    });
  });

  describe("RunSchema", () => {
    it("accepts valid run", () => {
      const result = RunSchema.safeParse({
        id: "run-1",
        name: "Deploy",
        status: "running",
        duration: "2m 30s",
        startedAt: "2024-01-01T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing startedAt", () => {
      const result = RunSchema.safeParse({
        id: "run-1",
        name: "Deploy",
        status: "running",
        duration: "2m",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RunStatusSchema", () => {
    it.each(["queued", "running", "completed", "failed", "cancelled"])("accepts '%s'", (s) => {
      expect(RunStatusSchema.safeParse(s).success).toBe(true);
    });
  });

  describe("TaskSchema", () => {
    it("accepts valid task", () => {
      const result = TaskSchema.safeParse({
        id: "task-1",
        title: "Fix bug",
        status: "pending",
        priority: "high",
        createdAt: "2024-01-01T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts task with optional fields", () => {
      const result = TaskSchema.safeParse({
        id: "task-1",
        title: "Fix bug",
        status: "in_progress",
        priority: "critical",
        assignee: "agent-1",
        createdAt: "2024-01-01T00:00:00.000Z",
        blockedBy: ["task-0"],
        description: "Fix the login bug",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("TaskStatusSchema", () => {
    it.each(["pending", "in_progress", "completed", "blocked", "cancelled"])("accepts '%s'", (s) => {
      expect(TaskStatusSchema.safeParse(s).success).toBe(true);
    });
  });

  describe("TaskPrioritySchema", () => {
    it.each(["critical", "high", "medium", "low"])("accepts '%s'", (p) => {
      expect(TaskPrioritySchema.safeParse(p).success).toBe(true);
    });
  });

  describe("InboxItemSchema", () => {
    it("accepts valid inbox item", () => {
      const result = InboxItemSchema.safeParse({
        id: 1,
        type: "alert",
        title: "High CPU",
        body: "Agent-1 CPU at 95%",
        time: "2m ago",
        read: false,
      });
      expect(result.success).toBe(true);
    });

    it("rejects string id", () => {
      const result = InboxItemSchema.safeParse({
        id: "not-a-number",
        type: "info",
        title: "Test",
        body: "Body",
        time: "now",
        read: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("InboxTypeSchema", () => {
    it.each(["review", "alert", "info", "approval"])("accepts '%s'", (t) => {
      expect(InboxTypeSchema.safeParse(t).success).toBe(true);
    });
  });

  describe("InboxSeveritySchema", () => {
    it.each(["critical", "major", "minor", "info"])("accepts '%s'", (s) => {
      expect(InboxSeveritySchema.safeParse(s).success).toBe(true);
    });
  });

  describe("DashboardMetricsSchema", () => {
    it("accepts valid metrics", () => {
      const result = DashboardMetricsSchema.safeParse({
        activeAgents: { current: 5, total: 8 },
        tasksLast24h: { count: 42, changePercent: "+15%", changeType: "positive" },
        successRate: { value: "98.5%", change: "+0.5%", changeType: "positive" },
        avgLatency: { value: "120ms", change: "-10ms", changeType: "positive" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ExecutionPlanSchema", () => {
    it("accepts valid plan", () => {
      const result = ExecutionPlanSchema.safeParse({
        id: "plan-1",
        title: "Deploy to production",
        mode: "tutti",
        steps: [
          { id: "step-1", label: "Type check", status: "pending" },
          { id: "step-2", label: "Build", agent: "codex-1", status: "pending" },
        ],
        status: "pending",
        createdAt: "2024-01-01T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all modes", () => {
      for (const mode of ["tutti", "forte", "max"]) {
        const result = ExecutionPlanSchema.safeParse({
          id: "plan-1",
          title: "Test",
          mode,
          steps: [],
          status: "pending",
          createdAt: "2024-01-01T00:00:00.000Z",
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("ExecutionStepSchema", () => {
    it.each(["pending", "running", "completed", "failed", "skipped"])("accepts status '%s'", (s) => {
      const result = ExecutionStepSchema.safeParse({ id: "s1", label: "Test", status: s });
      expect(result.success).toBe(true);
    });
  });

  describe("Fleet schemas", () => {
    it("AgentNodeSchema accepts valid node", () => {
      const result = AgentNodeSchema.safeParse({
        id: "node-1",
        label: "Architect",
        provider: "codex",
        role: "architect",
        status: "active",
        taskCount: 5,
      });
      expect(result.success).toBe(true);
    });

    it("DependencyEdgeSchema accepts valid edge", () => {
      const result = DependencyEdgeSchema.safeParse({
        id: "e1",
        source: "node-1",
        target: "node-2",
        label: "direct",
        weight: 2,
      });
      expect(result.success).toBe(true);
    });

    it("FleetHealthSchema accepts valid health", () => {
      const result = FleetHealthSchema.safeParse({
        totalAgents: 8,
        activeAgents: 6,
        errorAgents: 1,
        avgLatencyMs: 150,
        avgErrorRate: 0.02,
        overallStatus: "degraded",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Server schemas", () => {
    it("ServerTaskSchema accepts valid task", () => {
      const result = ServerTaskSchema.safeParse({
        id: "task-1",
        title: "Test",
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("ServerTaskSchema accepts numeric createdAt", () => {
      const result = ServerTaskSchema.safeParse({
        id: "task-1",
        title: "Test",
        status: "pending",
        createdAt: 1704067200,
      });
      expect(result.success).toBe(true);
    });

    it("ServerGitRepoSchema accepts valid repo", () => {
      const result = ServerGitRepoSchema.safeParse({
        id: "repo-1",
        name: "fugue-system-ui",
        path: "/app",
        branch: "main",
        status: "clean",
      });
      expect(result.success).toBe(true);
    });

    it("ServerAlertSchema accepts valid alert", () => {
      const result = ServerAlertSchema.safeParse({
        id: "alert-1",
        severity: "critical",
        title: "High CPU",
        createdAt: "2024-01-01T00:00:00Z",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("WsEventSchema", () => {
    it("accepts agent-update event", () => {
      const result = WsEventSchema.safeParse({
        type: "agent-update",
        payload: {
          id: "a1",
          name: "Test",
          role: "architect",
          status: "active",
          tasks: 0,
          latency: "50ms",
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts error event", () => {
      const result = WsEventSchema.safeParse({
        type: "error",
        message: "Something failed",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("WsClientMessageSchema", () => {
    it("accepts chat message", () => {
      const result = WsClientMessageSchema.safeParse({
        type: "chat",
        payload: { message: "Hello" },
      });
      expect(result.success).toBe(true);
    });

    it("accepts approve-plan", () => {
      const result = WsClientMessageSchema.safeParse({
        type: "approve-plan",
        planId: "plan-1",
      });
      expect(result.success).toBe(true);
    });

    it("accepts ping", () => {
      const result = WsClientMessageSchema.safeParse({ type: "ping" });
      expect(result.success).toBe(true);
    });

    it("rejects unknown type", () => {
      const result = WsClientMessageSchema.safeParse({ type: "unknown" });
      expect(result.success).toBe(false);
    });
  });
});
