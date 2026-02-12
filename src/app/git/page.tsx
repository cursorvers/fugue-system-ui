"use client";

import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useServerData } from "@/hooks/useServerData";
import type { ServerGitRepo } from "@/types";

// ─── Strategy-level branch data ─────────────────────────────────────────────

interface BranchStrategy {
  readonly name: string;
  readonly isCurrent: boolean;
  readonly status: "clean" | "dirty" | "conflict" | "stale";
  readonly uncommittedCount: number;
  readonly aheadCount: number;
  readonly behindCount: number;
  readonly lastActivity: string;
  readonly mergeReadiness: "ready" | "needs-review" | "blocked";
}

const fallbackBranches: readonly BranchStrategy[] = [
  { name: "main", isCurrent: true, status: "clean", uncommittedCount: 0, aheadCount: 0, behindCount: 0, lastActivity: "2m ago", mergeReadiness: "ready" },
  { name: "feature/git-page", isCurrent: false, status: "dirty", uncommittedCount: 3, aheadCount: 5, behindCount: 0, lastActivity: "1h ago", mergeReadiness: "needs-review" },
  { name: "fix/mobile-nav", isCurrent: false, status: "clean", uncommittedCount: 0, aheadCount: 2, behindCount: 1, lastActivity: "3h ago", mergeReadiness: "ready" },
  { name: "feature/dark-mode", isCurrent: false, status: "stale", uncommittedCount: 0, aheadCount: 0, behindCount: 8, lastActivity: "3d ago", mergeReadiness: "blocked" },
];

const statusConfig: Record<BranchStrategy["status"], { icon: string; color: string; label: string }> = {
  clean: { icon: "check_circle", color: "text-[var(--color-success-foreground)]", label: "Clean" },
  dirty: { icon: "edit_note", color: "text-[var(--color-warning-foreground)]", label: "Uncommitted" },
  conflict: { icon: "error", color: "text-[var(--color-error-foreground)]", label: "Conflict" },
  stale: { icon: "schedule", color: "text-[var(--muted-foreground)]", label: "Stale" },
};

const readinessConfig: Record<BranchStrategy["mergeReadiness"], { variant: "success" | "warning" | "error"; label: string }> = {
  ready: { variant: "success", label: "Merge Ready" },
  "needs-review": { variant: "warning", label: "Needs Review" },
  blocked: { variant: "error", label: "Blocked" },
};

function serverRepoToBranch(repo: ServerGitRepo, fallbackIsCurrent: boolean): BranchStrategy {
  // Prefer lastCommitAt for activity timing, fall back to lastChecked
  const activityTimestamp = repo.lastCommitAt ?? repo.lastChecked;
  const activityMs = activityTimestamp
    ? (typeof activityTimestamp === "number"
      ? (activityTimestamp < 1e12 ? activityTimestamp * 1000 : activityTimestamp)
      : Date.parse(String(activityTimestamp)))
    : Date.now();
  const minutesAgo = Math.round((Date.now() - activityMs) / 60000);
  const timeStr = minutesAgo < 1 ? "now" : minutesAgo < 60 ? `${minutesAgo}m ago` : minutesAgo < 1440 ? `${Math.round(minutesAgo / 60)}h ago` : `${Math.round(minutesAgo / 1440)}d ago`;

  const uncommitted = repo.uncommittedCount ?? 0;
  const ahead = repo.aheadCount ?? 0;
  const behind = repo.behindCount ?? 0;

  // Use lastCommitAt-based staleness when available (more accurate)
  const status: BranchStrategy["status"] =
    uncommitted > 0 ? "dirty" :
    minutesAgo > 4320 ? "stale" : "clean";

  const mergeReadiness: BranchStrategy["mergeReadiness"] =
    behind > 5 ? "blocked" :
    uncommitted > 0 || behind > 0 ? "needs-review" : "ready";

  return {
    name: repo.branch ?? repo.name,
    isCurrent: repo.isCurrent ?? fallbackIsCurrent,
    status,
    uncommittedCount: uncommitted,
    aheadCount: ahead,
    behindCount: behind,
    lastActivity: timeStr,
    mergeReadiness,
  };
}

export default function GitPage() {
  const [filter, setFilter] = useState<"all" | "active" | "stale">("all");
  const { gitRepos, isConnected, isConnecting, error, refresh } = useServerData();

  const branches: readonly BranchStrategy[] = gitRepos.length > 0
    ? gitRepos.map((r, i) => serverRepoToBranch(r, i === 0))
    : fallbackBranches;

  const filteredBranches = useMemo(() => {
    if (filter === "all") return branches;
    if (filter === "active") return branches.filter((b) => b.status !== "stale");
    return branches.filter((b) => b.status === "stale");
  }, [branches, filter]);

  // Strategy-level metrics
  const totalBranches = branches.length;
  const readyCount = branches.filter((b) => b.mergeReadiness === "ready").length;
  const blockedCount = branches.filter((b) => b.mergeReadiness === "blocked").length;
  const totalUncommitted = branches.reduce((sum, b) => sum + b.uncommittedCount, 0);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="git" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="git" />

          <ConnectionStatus
            state={isConnected ? "connected" : isConnecting ? "connecting" : error ? "error" : "disconnected"}
            error={error}
            onReconnect={refresh}
          />

          <div className="flex-1 p-4 lg:p-8 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg lg:text-xl font-primary font-semibold text-[var(--foreground)]">
                  Branch Strategy
                </h1>
                <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5">
                  ブランチの健全性とマージ戦略
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" dot>
                  {branches.find((b) => b.isCurrent)?.name ?? "main"}
                </Badge>
              </div>
            </div>

            {/* Strategy Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <Card>
                <CardContent className="py-3 text-center">
                  <p className="text-[22px] font-primary font-semibold text-[var(--foreground)]">{totalBranches}</p>
                  <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">Total Branches</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-center">
                  <p className="text-[22px] font-primary font-semibold text-[var(--color-success-foreground)]">{readyCount}</p>
                  <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">Merge Ready</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-center">
                  <p className="text-[22px] font-primary font-semibold text-[var(--color-error-foreground)]">{blockedCount}</p>
                  <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">Blocked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-center">
                  <p className="text-[22px] font-primary font-semibold text-[var(--color-warning-foreground)]">{totalUncommitted}</p>
                  <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">Uncommitted</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-6 border-b border-[var(--border)] mb-6">
              {(["all", "active", "stale"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`pb-2 min-h-[44px] text-[13px] font-primary font-medium transition-colors border-b-2 capitalize ${
                    filter === t
                      ? "border-[var(--primary)] text-[var(--foreground)]"
                      : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {t === "all" ? `All (${totalBranches})` : t === "active" ? `Active (${totalBranches - branches.filter((b) => b.status === "stale").length})` : `Stale (${branches.filter((b) => b.status === "stale").length})`}
                </button>
              ))}
            </div>

            {/* Branch List — Strategy View */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border)]">
                  {filteredBranches.map((branch) => {
                    const sc = statusConfig[branch.status];
                    const rc = readinessConfig[branch.mergeReadiness];
                    return (
                      <div
                        key={branch.name}
                        className="flex items-center justify-between px-4 py-3.5 hover:bg-[var(--secondary)] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`material-symbols-sharp text-[20px] ${sc.color}`}>
                            {sc.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="text-[13px] font-secondary text-[var(--foreground)]">
                                {branch.name}
                              </code>
                              {branch.isCurrent && (
                                <Badge variant="success" className="text-[10px]">HEAD</Badge>
                              )}
                              <Badge variant={rc.variant} className="text-[10px]">{rc.label}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] font-secondary text-[var(--muted-foreground)]">
                              <span>{sc.label}</span>
                              {branch.aheadCount > 0 && (
                                <span className="text-[var(--color-success-foreground)]">
                                  +{branch.aheadCount} ahead
                                </span>
                              )}
                              {branch.behindCount > 0 && (
                                <span className="text-[var(--color-error-foreground)]">
                                  -{branch.behindCount} behind
                                </span>
                              )}
                              {branch.uncommittedCount > 0 && (
                                <span className="text-[var(--color-warning-foreground)]">
                                  {branch.uncommittedCount} uncommitted
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-secondary text-[var(--muted-foreground)] flex-shrink-0 ml-4">
                          {branch.lastActivity}
                        </span>
                      </div>
                    );
                  })}

                  {filteredBranches.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <span className="text-[13px] font-secondary text-[var(--muted-foreground)]">
                        該当するブランチがありません
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
