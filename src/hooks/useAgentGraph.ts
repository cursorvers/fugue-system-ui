"use client";

import { useMemo } from "react";
import type { Agent } from "@/types/agent";
import type { AgentNode, DependencyEdge, FleetHealth } from "@/types/fleet";

interface UseAgentGraphReturn {
  readonly nodes: readonly AgentNode[];
  readonly edges: readonly DependencyEdge[];
  readonly health: FleetHealth;
}

// Build dependency edges based on orchestration patterns
function buildEdges(agents: readonly Agent[]): readonly DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const orchestrators = agents.filter(
    (a) => a.role === "architect" || a.role === "general-reviewer"
  );
  const workers = agents.filter(
    (a) => a.role !== "architect" && a.role !== "general-reviewer"
  );

  // Orchestrators feed into workers
  for (const orch of orchestrators) {
    for (const worker of workers) {
      // Same-provider agents have stronger connections
      const weight = orch.provider === worker.provider ? 2 : 1;
      edges.push({
        id: `${orch.id}->${worker.id}`,
        source: orch.id,
        target: worker.id,
        label: orch.provider === worker.provider ? "direct" : "cross",
        weight,
      });
    }
  }

  // Security analyst feeds back to architects
  const securityAgents = agents.filter((a) => a.role === "security-analyst");
  const architects = agents.filter((a) => a.role === "architect");
  for (const sec of securityAgents) {
    for (const arch of architects) {
      edges.push({
        id: `${sec.id}->${arch.id}`,
        source: sec.id,
        target: arch.id,
        label: "feedback",
        weight: 3,
      });
    }
  }

  return edges;
}

function parseLatencyMs(latency: string): number {
  const match = latency.match(/([\d.]+)\s*(ms|s|m)/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  if (match[2] === "s") return value * 1000;
  if (match[2] === "m") return value * 60000;
  return value;
}

function computeHealth(agents: readonly Agent[]): FleetHealth {
  const total = agents.length;
  const active = agents.filter((a) => a.status === "active").length;
  const errored = agents.filter((a) => a.status === "error").length;
  // Exclude offline agents from latency average (they report 0ms, skewing results)
  const respondingAgents = agents.filter((a) => a.status === "active" || a.status === "idle");
  const avgLatency = respondingAgents.length > 0
    ? respondingAgents.reduce((sum, a) => sum + parseLatencyMs(a.latency), 0) / respondingAgents.length
    : 0;

  const overallStatus: FleetHealth["overallStatus"] =
    errored > total / 3 ? "critical" :
    errored > 0 || active < total / 2 ? "degraded" : "healthy";

  return {
    totalAgents: total,
    activeAgents: active,
    errorAgents: errored,
    avgLatencyMs: Math.round(avgLatency),
    avgErrorRate: 0,
    overallStatus,
  };
}

export function useAgentGraph(agents: readonly Agent[]): UseAgentGraphReturn {
  const nodes: readonly AgentNode[] = useMemo(
    () =>
      agents.map((a) => ({
        id: a.id,
        label: a.name,
        provider: (a.provider ?? "codex") as AgentNode["provider"],
        role: a.role,
        status: a.status,
        latencyMs: parseLatencyMs(a.latency),
        errorRate: 0,
        taskCount: a.tasks,
      })),
    [agents]
  );

  const edges = useMemo(() => buildEdges(agents), [agents]);
  const health = useMemo(() => computeHealth(agents), [agents]);

  return { nodes, edges, health };
}
