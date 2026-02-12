"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AgentsProvider, useAgents } from "@/contexts/AgentsContext";
import { PerformanceHeatmap } from "@/components/agent-fleet/PerformanceHeatmap";
import { FleetHealthIndicator } from "@/components/agent-fleet/FleetHealthIndicator";
import { FleetErrorBoundary } from "@/components/agent-fleet/FleetErrorBoundary";
import { useAgentGraph } from "@/hooks/useAgentGraph";
import { Skeleton } from "@/components/Skeleton";

// Lazy-load the dependency graph (heavy @xyflow/react dependency)
const DependencyGraph = dynamic(
  () => import("@/components/agent-fleet/DependencyGraph"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    ),
  }
);

type FleetView = "graph" | "heatmap";

export default function AgentsPage() {
  return (
    <ProtectedRoute>
      <AgentsProvider>
        <AgentsContent />
      </AgentsProvider>
    </ProtectedRoute>
  );
}

function AgentsContent() {
  const [view, setView] = useState<FleetView>("graph");
  const { agents } = useAgents();
  const { nodes, edges, health } = useAgentGraph(agents);

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar activePage="work" />
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <MobileNav activePage="work" />

        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg lg:text-xl font-primary font-semibold text-[var(--foreground)]">
                Agent Fleet
              </h1>
              <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5">
                エージェントの依存関係とパフォーマンス
              </p>
            </div>
            <FleetHealthIndicator health={health} />
          </div>

          {/* Metrics Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-[22px] font-primary font-semibold text-[var(--foreground)]">{health.totalAgents}</p>
                <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-[22px] font-primary font-semibold text-[var(--color-success-foreground)]">{health.activeAgents}</p>
                <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-[22px] font-primary font-semibold text-[var(--color-error-foreground)]">{health.errorAgents}</p>
                <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">Errors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-[22px] font-primary font-semibold text-[var(--foreground)]">{health.avgLatencyMs}ms</p>
                <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">Avg Latency</p>
              </CardContent>
            </Card>
          </div>

          {/* View Tabs */}
          <div className="flex gap-6 border-b border-[var(--border)] mb-6">
            {(["graph", "heatmap"] as FleetView[]).map((t) => (
              <button
                key={t}
                onClick={() => setView(t)}
                className={`pb-2 min-h-[44px] text-[13px] font-primary font-medium transition-colors border-b-2 ${
                  view === t
                    ? "border-[var(--primary)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t === "graph" ? "Dependency Graph" : "Performance Heatmap"}
              </button>
            ))}
          </div>

          {/* Visualization */}
          <Card className="overflow-hidden">
            <CardContent className="p-0 h-[500px]">
              {view === "graph" ? (
                <FleetErrorBoundary>
                  <DependencyGraph agentNodes={nodes} edges={edges} />
                </FleetErrorBoundary>
              ) : (
                <PerformanceHeatmap agents={agents} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
