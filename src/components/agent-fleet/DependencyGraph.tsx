"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { AgentNode, DependencyEdge } from "@/types/fleet";

// ─── Custom Node ────────────────────────────────────────────────────────────

const statusColors: Record<AgentNode["status"], string> = {
  active: "var(--color-success-foreground)",
  idle: "var(--muted-foreground)",
  offline: "var(--color-error-foreground)",
  error: "var(--color-error-foreground)",
};

const providerColors: Record<string, string> = {
  codex: "#3b82f6",
  glm: "#8b5cf6",
  gemini: "#f59e0b",
  claude: "#d97706",
  pencil: "#10b981",
  grok: "#ef4444",
};

function AgentNodeComponent({ data }: NodeProps) {
  const agent = data as AgentNode;
  const borderColor = statusColors[agent.status];
  const providerColor = providerColors[agent.provider] ?? "#6b7280";

  return (
    <div
      className="rounded-[var(--radius-m)] bg-[var(--card)] border-2 px-3 py-2 min-w-[140px] shadow-sm"
      style={{ borderColor }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--muted-foreground)]" />

      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: borderColor }}
        />
        <span className="text-[12px] font-primary font-medium text-[var(--foreground)] truncate">
          {agent.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-secondary">
        <span
          className="px-1.5 py-0.5 rounded-[var(--radius-xs)]"
          style={{ backgroundColor: `${providerColor}20`, color: providerColor }}
        >
          {agent.provider}
        </span>
        <span className="text-[var(--muted-foreground)]">{agent.role}</span>
      </div>

      {(agent.latencyMs !== undefined || agent.taskCount > 0) && (
        <div className="flex items-center gap-2 mt-1 text-[10px] font-secondary text-[var(--muted-foreground)]">
          {agent.latencyMs !== undefined && <span>{agent.latencyMs}ms</span>}
          {agent.taskCount > 0 && <span>{agent.taskCount} tasks</span>}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[var(--muted-foreground)]" />
    </div>
  );
}

const nodeTypes = { agentNode: AgentNodeComponent };

// ─── Layout ─────────────────────────────────────────────────────────────────

function layoutNodes(
  agentNodes: readonly AgentNode[]
): readonly Node[] {
  // Simple layered layout: orchestrators top, workers middle, security bottom
  const orchestrators = agentNodes.filter(
    (n) => n.role === "architect" || n.role === "general-reviewer"
  );
  const workers = agentNodes.filter(
    (n) => n.role !== "architect" && n.role !== "general-reviewer" && n.role !== "security-analyst"
  );
  const security = agentNodes.filter((n) => n.role === "security-analyst");

  const layers = [orchestrators, workers, security];
  const nodes: Node[] = [];

  layers.forEach((layer, layerIdx) => {
    const y = layerIdx * 160;
    const xOffset = -(layer.length - 1) * 100;
    layer.forEach((agent, idx) => {
      nodes.push({
        id: agent.id,
        type: "agentNode",
        position: { x: xOffset + idx * 200, y },
        data: agent,
      });
    });
  });

  return nodes;
}

function toFlowEdges(edges: readonly DependencyEdge[]): readonly Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.weight >= 3,
    style: {
      stroke: e.weight >= 3
        ? "var(--color-warning-foreground)"
        : "var(--muted-foreground)",
      strokeWidth: Math.min(e.weight, 3),
      opacity: 0.6,
    },
  }));
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface DependencyGraphProps {
  readonly agentNodes: readonly AgentNode[];
  readonly edges: readonly DependencyEdge[];
  readonly className?: string;
}

export default function DependencyGraph({
  agentNodes,
  edges,
  className = "",
}: DependencyGraphProps) {
  const flowNodes = useMemo(() => layoutNodes(agentNodes), [agentNodes]);
  const flowEdges = useMemo(() => toFlowEdges(edges), [edges]);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    instance.fitView();
  }, []);

  if (agentNodes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full text-[13px] font-secondary text-[var(--muted-foreground)] ${className}`}>
        No agents available
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <ReactFlow
        nodes={flowNodes as Node[]}
        edges={flowEdges as Edge[]}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
