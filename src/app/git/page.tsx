"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Branch {
  readonly name: string;
  readonly isCurrent: boolean;
  readonly lastCommit: string;
  readonly author: string;
  readonly time: string;
}

interface Commit {
  readonly hash: string;
  readonly message: string;
  readonly author: string;
  readonly time: string;
  readonly filesChanged: number;
}

interface ChangedFile {
  readonly path: string;
  readonly status: "modified" | "added" | "deleted";
  readonly additions: number;
  readonly deletions: number;
}

const branches: readonly Branch[] = [
  { name: "main", isCurrent: true, lastCommit: "feat: UI/UX redesign v2", author: "masayuki", time: "2m ago" },
  { name: "feature/git-page", isCurrent: false, lastCommit: "WIP: Git page layout", author: "masayuki", time: "1h ago" },
  { name: "fix/mobile-nav", isCurrent: false, lastCommit: "fix: MobileNav on all pages", author: "masayuki", time: "3h ago" },
  { name: "feature/dark-mode", isCurrent: false, lastCommit: "feat: Dark mode + notifications", author: "masayuki", time: "1d ago" },
];

const commits: readonly Commit[] = [
  { hash: "a402d9d", message: "feat: UI/UX redesign v2 — Linear + Vercel style", author: "masayuki", time: "2m ago", filesChanged: 8 },
  { hash: "0669cbb", message: "feat: IA redesign + Git/Work/Runs + nav SSOT", author: "masayuki", time: "15m ago", filesChanged: 16 },
  { hash: "91bdbcc", message: "feat: Settings menu (EXECUTION TIER replaced)", author: "masayuki", time: "2h ago", filesChanged: 3 },
  { hash: "f88e432", message: "fix: All pages MobileNav + mobile optimization", author: "masayuki", time: "4h ago", filesChanged: 8 },
  { hash: "6c2de8e", message: "feat: Logo redesign + notification detail modal", author: "masayuki", time: "6h ago", filesChanged: 5 },
  { hash: "f360bed", message: "feat: Mobile optimization + dark mode", author: "masayuki", time: "8h ago", filesChanged: 12 },
];

const changedFiles: readonly ChangedFile[] = [
  { path: "src/app/globals.css", status: "modified", additions: 120, deletions: 74 },
  { path: "src/components/Sidebar.tsx", status: "modified", additions: 95, deletions: 65 },
  { path: "src/components/MobileNav.tsx", status: "modified", additions: 42, deletions: 35 },
  { path: "src/app/page.tsx", status: "modified", additions: 180, deletions: 90 },
  { path: "src/components/Card.tsx", status: "modified", additions: 48, deletions: 30 },
  { path: "src/components/Badge.tsx", status: "modified", additions: 20, deletions: 12 },
];

const statusIcon: Record<string, string> = {
  modified: "edit",
  added: "add_circle",
  deleted: "remove_circle",
};

const statusColor: Record<string, string> = {
  modified: "text-[var(--color-warning-foreground)]",
  added: "text-[var(--color-success-foreground)]",
  deleted: "text-[var(--color-error-foreground)]",
};

type GitTab = "commits" | "branches" | "changes";

export default function GitPage() {
  const [tab, setTab] = useState<GitTab>("commits");

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="git" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="git" />

          <div className="flex-1 p-4 lg:p-8 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg lg:text-xl font-primary font-semibold text-[var(--foreground)]">
                  Git
                </h1>
                <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5">
                  Repository status and history
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" dot>main</Badge>
                <Badge variant="outline">{branches.length} branches</Badge>
              </div>
            </div>

            {/* Working tree status */}
            <Card className="mb-6">
              <CardContent className="flex items-center gap-4 py-2.5">
                <span className="material-symbols-sharp text-[18px] text-[var(--color-warning-foreground)]">pending</span>
                <span className="text-[13px] font-primary text-[var(--foreground)]">
                  {changedFiles.length} uncommitted changes
                </span>
                <div className="flex items-center gap-2 text-[11px] font-secondary">
                  <span className="text-[var(--color-success-foreground)]">
                    +{changedFiles.reduce((sum, f) => sum + f.additions, 0)}
                  </span>
                  <span className="text-[var(--color-error-foreground)]">
                    -{changedFiles.reduce((sum, f) => sum + f.deletions, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tabs — underline style */}
            <div className="flex gap-6 border-b border-[var(--border)] mb-6">
              {(["commits", "branches", "changes"] as GitTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2 text-[13px] font-primary font-medium transition-colors border-b-2 capitalize ${
                    tab === t
                      ? "border-[var(--primary)] text-[var(--foreground)]"
                      : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Commits Tab */}
            {tab === "commits" && (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-[var(--border)]">
                    {commits.map((commit) => (
                      <div
                        key={commit.hash}
                        className="flex items-center justify-between px-4 py-3 hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <code className="text-[11px] font-secondary text-[var(--primary)] bg-[var(--muted)] px-1.5 py-0.5 rounded-[var(--radius-xs)] flex-shrink-0">
                            {commit.hash}
                          </code>
                          <div className="min-w-0">
                            <p className="text-[13px] font-primary text-[var(--foreground)] truncate">
                              {commit.message}
                            </p>
                            <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                              {commit.author} · {commit.filesChanged} files
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-secondary text-[var(--muted-foreground)] flex-shrink-0 ml-4">
                          {commit.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Branches Tab */}
            {tab === "branches" && (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-[var(--border)]">
                    {branches.map((branch) => (
                      <div
                        key={branch.name}
                        className="flex items-center justify-between px-4 py-3 hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-sharp text-[18px] ${
                            branch.isCurrent ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                          }`}>
                            {branch.isCurrent ? "radio_button_checked" : "radio_button_unchecked"}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <code className="text-[13px] font-secondary text-[var(--foreground)]">
                                {branch.name}
                              </code>
                              {branch.isCurrent && (
                                <Badge variant="success" className="text-[9px]">current</Badge>
                              )}
                            </div>
                            <p className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                              {branch.lastCommit} · {branch.author}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                          {branch.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Changes Tab */}
            {tab === "changes" && (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-[var(--border)]">
                    {changedFiles.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`material-symbols-sharp text-[16px] ${statusColor[file.status]}`}>
                            {statusIcon[file.status]}
                          </span>
                          <code className="text-[13px] font-secondary text-[var(--foreground)] truncate">
                            {file.path}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-secondary flex-shrink-0 ml-4">
                          <span className="text-[var(--color-success-foreground)]">+{file.additions}</span>
                          <span className="text-[var(--color-error-foreground)]">-{file.deletions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
