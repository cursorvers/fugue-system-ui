"use client";

import { useMemo } from "react";
import { Badge } from "@/components/Badge";
import type { Agent } from "@/types/agent";

interface PerformanceHeatmapProps {
  readonly agents: readonly Agent[];
  readonly className?: string;
}

// Parse latency string to numeric ms
function parseLatency(latency: string): number {
  const match = latency.match(/([\d.]+)\s*(ms|s|m)/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  if (match[2] === "s") return value * 1000;
  if (match[2] === "m") return value * 60000;
  return value;
}

// Percentile rank of a value within a sorted array
function percentileRank(value: number, allValues: readonly number[]): number {
  if (allValues.length <= 1) return 0;
  let count = 0;
  for (const v of allValues) {
    if (v < value) count++;
  }
  return count / (allValues.length - 1);
}

// Map value to heat color using percentile-based ranking
// Prevents outliers from crushing the color range
function heatColor(value: number, allValues: readonly number[]): string {
  if (allValues.length <= 1) return "var(--color-success-foreground)";
  const rank = percentileRank(value, allValues);
  if (rank < 0.33) return "var(--color-success-foreground)";
  if (rank < 0.66) return "var(--color-warning-foreground)";
  return "var(--color-error-foreground)";
}

const statusOrder: Record<string, number> = {
  active: 0,
  idle: 1,
  error: 2,
  offline: 3,
};

export function PerformanceHeatmap({
  agents,
  className = "",
}: PerformanceHeatmapProps) {
  const sortedAgents = useMemo(
    () =>
      [...agents].sort(
        (a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4)
      ),
    [agents]
  );

  const latencies = useMemo(
    () => sortedAgents.map((a) => parseLatency(a.latency)),
    [sortedAgents]
  );

  const sortedLatencies = useMemo(
    () => [...latencies].sort((a, b) => a - b),
    [latencies],
  );

  const taskCounts = useMemo(
    () => sortedAgents.map((a) => a.tasks),
    [sortedAgents]
  );
  const maxTasks = Math.max(...taskCounts, 1);

  if (sortedAgents.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full text-[13px] font-secondary text-[var(--muted-foreground)] ${className}`}>
        No agents available
      </div>
    );
  }

  // Grid columns: adapt to agent count
  const cols = Math.min(Math.max(Math.ceil(Math.sqrt(sortedAgents.length)), 2), 6);

  return (
    <div className={`p-4 overflow-auto h-full ${className}`}>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-[11px] font-secondary text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: "var(--color-success-foreground)", opacity: 0.7 }} />
          Low latency
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: "var(--color-warning-foreground)", opacity: 0.7 }} />
          Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: "var(--color-error-foreground)", opacity: 0.7 }} />
          High latency
        </span>
      </div>

      {/* Heatmap Grid */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {sortedAgents.map((agent, idx) => {
          const latencyMs = latencies[idx];
          const heat = heatColor(latencyMs, sortedLatencies);
          const taskRatio = maxTasks > 0 ? taskCounts[idx] / maxTasks : 0;

          return (
            <div
              key={agent.id}
              className="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-3 relative overflow-hidden"
            >
              {/* Heat bar (background indicator) */}
              <div
                className="absolute bottom-0 left-0 right-0 opacity-15 transition-all"
                style={{
                  height: `${Math.max(taskRatio * 100, 4)}%`,
                  backgroundColor: heat,
                }}
              />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-primary font-medium text-[var(--foreground)] truncate">
                    {agent.name}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        agent.status === "active"
                          ? "var(--color-success-foreground)"
                          : agent.status === "error"
                            ? "var(--color-error-foreground)"
                            : "var(--muted-foreground)",
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-secondary">
                    <span className="text-[var(--muted-foreground)]">Latency</span>
                    <span style={{ color: heat }}>{agent.latency}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-secondary">
                    <span className="text-[var(--muted-foreground)]">Tasks</span>
                    <span className="text-[var(--foreground)]">{agent.tasks}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-secondary">
                    <span className="text-[var(--muted-foreground)]">Provider</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {agent.provider ?? "—"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
