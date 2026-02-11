"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useServerData } from "@/hooks/useServerData";
import type { ServerGitRepo } from "@/types";

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

const commitDetails: Record<string, { files: readonly { path: string; additions: number; deletions: number }[]; description: string }> = {
  a402d9d: {
    description: "Complete UI/UX overhaul inspired by Linear + Vercel. New color system, elevation tokens, glass effects, collapsible sidebar, and redesigned all pages.",
    files: [
      { path: "src/app/globals.css", additions: 107, deletions: 63 },
      { path: "src/components/Sidebar.tsx", additions: 95, deletions: 68 },
      { path: "src/components/Card.tsx", additions: 48, deletions: 22 },
      { path: "src/components/Badge.tsx", additions: 35, deletions: 18 },
      { path: "src/components/Button.tsx", additions: 62, deletions: 0 },
      { path: "src/app/page.tsx", additions: 180, deletions: 92 },
      { path: "src/components/MobileNav.tsx", additions: 42, deletions: 35 },
      { path: "src/app/layout.tsx", additions: 8, deletions: 3 },
    ],
  },
  "0669cbb": {
    description: "Information Architecture redesign. New Git, Work, Runs pages. Navigation SSOT via config/navigation.ts. Replaced old page structure.",
    files: [
      { path: "src/app/git/page.tsx", additions: 243, deletions: 0 },
      { path: "src/app/work/page.tsx", additions: 332, deletions: 0 },
      { path: "src/app/runs/page.tsx", additions: 177, deletions: 0 },
      { path: "src/config/navigation.ts", additions: 52, deletions: 0 },
      { path: "src/app/page.tsx", additions: 12, deletions: 180 },
    ],
  },
  "91bdbcc": {
    description: "Replaced EXECUTION TIER section in Settings with new organized menu structure.",
    files: [
      { path: "src/app/settings/account/page.tsx", additions: 45, deletions: 12 },
      { path: "src/app/settings/appearance/page.tsx", additions: 38, deletions: 8 },
      { path: "src/app/settings/help/page.tsx", additions: 52, deletions: 15 },
    ],
  },
  f88e432: {
    description: "Added MobileNav component to all pages. Responsive optimization for tablet and mobile viewports.",
    files: [
      { path: "src/components/MobileNav.tsx", additions: 120, deletions: 0 },
      { path: "src/app/page.tsx", additions: 5, deletions: 2 },
      { path: "src/app/work/page.tsx", additions: 5, deletions: 2 },
      { path: "src/app/runs/page.tsx", additions: 5, deletions: 2 },
    ],
  },
  "6c2de8e": {
    description: "New SVG logo with gradient. Added notification detail modal with type-based icons.",
    files: [
      { path: "src/components/Logo.tsx", additions: 48, deletions: 12 },
      { path: "src/app/notifications/page.tsx", additions: 85, deletions: 30 },
    ],
  },
  f360bed: {
    description: "Dark mode implementation with CSS custom properties. Mobile-first responsive layout across all pages.",
    files: [
      { path: "src/app/globals.css", additions: 95, deletions: 20 },
      { path: "src/app/layout.tsx", additions: 15, deletions: 5 },
      { path: "src/contexts/ThemeContext.tsx", additions: 45, deletions: 0 },
    ],
  },
};

type GitTab = "commits" | "branches" | "changes";

function serverRepoToBranch(repo: ServerGitRepo): Branch {
  const lastCheckedMs = repo.lastChecked ? (typeof repo.lastChecked === "number" ? repo.lastChecked * 1000 : Date.parse(String(repo.lastChecked))) : Date.now();
  const minutesAgo = Math.round((Date.now() - lastCheckedMs) / 60000);
  const timeStr = minutesAgo < 1 ? "now" : minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.round(minutesAgo / 60)}h ago`;
  return {
    name: repo.branch ?? repo.name,
    isCurrent: false,
    lastCommit: `${repo.status ?? "unknown"} — ${repo.uncommittedCount ?? 0} uncommitted`,
    author: "local",
    time: timeStr,
  };
}

function serverRepoToChangedFiles(repo: ServerGitRepo): readonly ChangedFile[] {
  return (repo.modifiedFiles ?? []).map((path) => ({
    path,
    status: "modified" as const,
    additions: 0,
    deletions: 0,
  }));
}

export default function GitPage() {
  const [tab, setTab] = useState<GitTab>("commits");
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  const { gitRepos, isConnected, isConnecting, error, refresh } = useServerData();
  const activeBranches: readonly Branch[] = gitRepos.length > 0
    ? [{ ...serverRepoToBranch(gitRepos[0]), isCurrent: true }, ...gitRepos.slice(1).map(serverRepoToBranch)]
    : branches;
  const activeChangedFiles: readonly ChangedFile[] = gitRepos.length > 0
    ? gitRepos.flatMap(serverRepoToChangedFiles)
    : changedFiles;

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
                  Git
                </h1>
                <p className="text-xs font-secondary text-[var(--muted-foreground)] mt-0.5">
                  リポジトリの状態と履歴
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" dot>{activeBranches.find((b) => b.isCurrent)?.name ?? "main"}</Badge>
                <Badge variant="outline">{activeBranches.length} ブランチ</Badge>
              </div>
            </div>

            {/* Working tree status */}
            <Card className="mb-6">
              <CardContent className="flex items-center gap-4 py-2.5">
                <span className="material-symbols-sharp text-[18px] text-[var(--color-warning-foreground)]">pending</span>
                <span className="text-[13px] font-primary text-[var(--foreground)]">
                  {activeChangedFiles.length} 件の未コミット変更
                </span>
                <div className="flex items-center gap-2 text-[11px] font-secondary">
                  <span className="text-[var(--color-success-foreground)]">
                    +{activeChangedFiles.reduce((sum, f) => sum + f.additions, 0)}
                  </span>
                  <span className="text-[var(--color-error-foreground)]">
                    -{activeChangedFiles.reduce((sum, f) => sum + f.deletions, 0)}
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
                  className={`pb-2 min-h-[44px] text-[13px] font-primary font-medium transition-colors border-b-2 capitalize ${
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
                        onClick={() => setSelectedCommit(commit.hash === selectedCommit ? null : commit.hash)}
                        className={`flex items-center justify-between px-4 py-3 hover:bg-[var(--secondary)] transition-colors cursor-pointer ${
                          commit.hash === selectedCommit ? "bg-[var(--secondary)]" : ""
                        }`}
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
                    {activeBranches.map((branch) => (
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
                                <Badge variant="success" className="text-[10px]">現在</Badge>
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
                    {activeChangedFiles.map((file) => (
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

        {/* Commit Detail Panel */}
        {selectedCommit && (() => {
          const commit = commits.find((c) => c.hash === selectedCommit);
          const detail = commitDetails[selectedCommit];
          if (!commit) return null;
          const totalAdd = detail?.files.reduce((s, f) => s + f.additions, 0) ?? 0;
          const totalDel = detail?.files.reduce((s, f) => s + f.deletions, 0) ?? 0;
          return (
            <div
              className="fixed inset-0 z-40 lg:relative lg:inset-auto"
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedCommit(null); }}
            >
              <div className="absolute inset-0 bg-black/30 lg:hidden" />
              <aside className="absolute right-0 top-0 h-full w-[380px] bg-[var(--card)] border-l border-[var(--border)] shadow-[var(--shadow-l)] flex flex-col z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-sharp text-[18px] text-[var(--primary)]">commit</span>
                    <code className="text-[13px] font-secondary text-[var(--primary)]">{commit.hash}</code>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCommit(null)}>
                    <span className="material-symbols-sharp text-[18px]">close</span>
                  </Button>
                </div>

                <div className="flex-1 overflow-auto">
                  {/* Commit info */}
                  <div className="px-4 py-3 border-b border-[var(--border)] space-y-2">
                    <p className="text-[13px] font-primary font-medium text-[var(--foreground)]">{commit.message}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">作成者</p>
                        <p className="text-[12px] font-secondary text-[var(--foreground)] mt-0.5">{commit.author}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider">時刻</p>
                        <p className="text-[12px] font-secondary text-[var(--foreground)] mt-0.5">{commit.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-secondary">
                      <span className="text-[var(--foreground)]">{commit.filesChanged} files</span>
                      <span className="text-[var(--color-success-foreground)]">+{totalAdd}</span>
                      <span className="text-[var(--color-error-foreground)]">-{totalDel}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {detail && (
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider mb-1">説明</p>
                      <p className="text-[12px] font-primary text-[var(--foreground)] leading-relaxed">{detail.description}</p>
                    </div>
                  )}

                  {/* Files changed */}
                  {detail && (
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-primary text-[var(--muted-foreground)] uppercase tracking-wider mb-2">変更ファイル</p>
                      <div className="space-y-1">
                        {detail.files.map((file, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-[var(--radius-s)] hover:bg-[var(--secondary)] transition-colors">
                            <code className="text-[11px] font-secondary text-[var(--foreground)] truncate flex-1 min-w-0">{file.path}</code>
                            <div className="flex items-center gap-2 text-[10px] font-secondary flex-shrink-0 ml-2">
                              <span className="text-[var(--color-success-foreground)]">+{file.additions}</span>
                              <span className="text-[var(--color-error-foreground)]">-{file.deletions}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!detail && (
                    <div className="px-4 py-8 text-center">
                      <span className="text-[12px] font-secondary text-[var(--muted-foreground)]">詳細データがありません</span>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          );
        })()}
      </div>
    </ProtectedRoute>
  );
}
