"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// MVP: Read-only Git status display

interface Branch {
  name: string;
  isCurrent: boolean;
  lastCommit: string;
  author: string;
  time: string;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  time: string;
  filesChanged: number;
}

interface ChangedFile {
  path: string;
  status: "modified" | "added" | "deleted";
  additions: number;
  deletions: number;
}

const branches: Branch[] = [
  { name: "main", isCurrent: true, lastCommit: "feat: Settings menu", author: "masayuki", time: "2h ago" },
  { name: "feature/git-page", isCurrent: false, lastCommit: "WIP: Git page layout", author: "masayuki", time: "1h ago" },
  { name: "fix/mobile-nav", isCurrent: false, lastCommit: "fix: MobileNav on all pages", author: "masayuki", time: "3h ago" },
  { name: "feature/dark-mode", isCurrent: false, lastCommit: "feat: Dark mode + notifications", author: "masayuki", time: "1d ago" },
];

const commits: Commit[] = [
  { hash: "91bdbcc", message: "feat: Settings menu (EXECUTION TIER replaced)", author: "masayuki", time: "2h ago", filesChanged: 3 },
  { hash: "f88e432", message: "fix: All pages MobileNav + mobile optimization", author: "masayuki", time: "4h ago", filesChanged: 8 },
  { hash: "6c2de8e", message: "feat: Logo redesign + notification detail modal", author: "masayuki", time: "6h ago", filesChanged: 5 },
  { hash: "f360bed", message: "feat: Mobile optimization + dark mode + notifications", author: "masayuki", time: "8h ago", filesChanged: 12 },
  { hash: "d199022", message: "feat: Persist chat history in localStorage", author: "masayuki", time: "1d ago", filesChanged: 2 },
  { hash: "d200460", message: "feat: Add PWA manifest and app icon", author: "masayuki", time: "1d ago", filesChanged: 4 },
];

const changedFiles: ChangedFile[] = [
  { path: "src/components/Sidebar.tsx", status: "modified", additions: 8, deletions: 32 },
  { path: "src/components/MobileNav.tsx", status: "modified", additions: 6, deletions: 30 },
  { path: "src/config/navigation.ts", status: "added", additions: 42, deletions: 0 },
  { path: "src/app/work/page.tsx", status: "added", additions: 210, deletions: 0 },
  { path: "src/app/git/page.tsx", status: "added", additions: 180, deletions: 0 },
  { path: "src/app/globals.css", status: "modified", additions: 1, deletions: 1 },
];

type GitTab = "branches" | "commits" | "changes";

export default function GitPage() {
  const [tab, setTab] = useState<GitTab>("commits");

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

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="git" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="git" />

          <div className="flex-1 p-4 lg:p-10 overflow-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-3">
              <div>
                <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                  Git
                </h1>
                <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
                  Repository status and history (read-only)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-xs">
                  <span className="material-symbols-sharp text-xs mr-1">commit</span>
                  main
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {branches.length} branches
                </Badge>
              </div>
            </div>

            {/* Working Tree Status */}
            <Card className="mb-4">
              <CardContent className="flex items-center gap-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-sharp text-[var(--color-warning-foreground)] text-lg">
                    pending
                  </span>
                  <span className="text-xs text-[var(--foreground)] font-primary">
                    {changedFiles.length} uncommitted changes
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
                  <span className="text-[var(--color-success-foreground)]">
                    +{changedFiles.reduce((sum, f) => sum + f.additions, 0)}
                  </span>
                  <span className="text-[var(--color-error-foreground)]">
                    -{changedFiles.reduce((sum, f) => sum + f.deletions, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tab Switcher */}
            <div className="flex gap-1 mb-4 bg-[var(--secondary)] rounded-full p-1 w-fit">
              {(["commits", "branches", "changes"] as GitTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-full text-xs font-primary font-medium transition-colors capitalize ${
                    tab === t
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Commits Tab */}
            {tab === "commits" && (
              <Card>
                <CardHeader>
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    Commit History
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {commits.map((commit) => (
                      <div
                        key={commit.hash}
                        className="flex flex-col lg:flex-row lg:items-center justify-between py-3 border-b border-[var(--border)] last:border-0 gap-2"
                      >
                        <div className="flex items-start gap-3">
                          <code className="text-[10px] lg:text-xs font-mono text-[var(--primary)] bg-[var(--secondary)] px-1.5 py-0.5 rounded flex-shrink-0">
                            {commit.hash}
                          </code>
                          <div>
                            <p className="text-xs lg:text-sm font-secondary text-[var(--foreground)]">
                              {commit.message}
                            </p>
                            <p className="text-[10px] text-[var(--muted-foreground)]">
                              {commit.author} · {commit.filesChanged} files
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] lg:text-xs text-[var(--muted-foreground)] flex-shrink-0">
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
                <CardHeader>
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    Branches
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {branches.map((branch) => (
                      <div
                        key={branch.name}
                        className="flex flex-col lg:flex-row lg:items-center justify-between py-3 border-b border-[var(--border)] last:border-0 gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-sharp text-lg text-[var(--muted-foreground)]">
                            {branch.isCurrent ? "radio_button_checked" : "radio_button_unchecked"}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-[var(--foreground)]">
                                {branch.name}
                              </code>
                              {branch.isCurrent && (
                                <Badge variant="success" className="text-[9px]">current</Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-[var(--muted-foreground)]">
                              {branch.lastCommit} · {branch.author}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] lg:text-xs text-[var(--muted-foreground)]">
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
                <CardHeader>
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    Uncommitted Changes
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {changedFiles.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`material-symbols-sharp text-sm ${statusColor[file.status]}`}>
                            {statusIcon[file.status]}
                          </span>
                          <code className="text-xs font-mono text-[var(--foreground)] truncate">
                            {file.path}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono flex-shrink-0 ml-2">
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
