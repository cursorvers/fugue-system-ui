"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const commands = [
  { command: "/work", description: "Plans.mdのタスクを実行開始" },
  { command: "/review", description: "コードレビューを実行" },
  { command: "/plan", description: "実装計画を作成" },
  { command: "/sync", description: "状況を確認し、次アクションを提案" },
  { command: "/vote", description: "3者合議制で自動承認" },
];

const tips = [
  "チャットで自然言語で指示すれば、Orchestratorが適切なエージェントに委譲します",
  "「Codexにレビューさせて」のように、特定のエージェントを指定することも可能です",
  "通知ページでシステムログやエラーを確認できます",
  "ダークモード/ライトモードは Appearance 設定で切り替えられます",
];

export default function HelpPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="settings" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="settings" />

          <div className="flex-1 p-4 lg:p-10 overflow-auto">
            <div className="mb-4 lg:mb-6">
              <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                ヘルプ & ガイド
              </h1>
              <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
                FUGUEの使い方ガイド
              </p>
            </div>

            <div className="space-y-4 max-w-2xl">
              <Card>
                <CardHeader>
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    クイックコマンド
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {commands.map((cmd) => (
                      <div key={cmd.command} className="flex items-start gap-3 py-2">
                        <code className="px-2 py-1 bg-[var(--sidebar)] rounded text-xs lg:text-sm font-mono text-[var(--primary)]">
                          {cmd.command}
                        </code>
                        <span className="text-xs lg:text-sm text-[var(--muted-foreground)]">
                          {cmd.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    ヒント
                  </h2>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs lg:text-sm text-[var(--foreground)]">
                        <span className="material-symbols-sharp text-[var(--primary)] text-base flex-shrink-0 mt-0.5">
                          lightbulb
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    アーキテクチャ
                  </h2>
                </CardHeader>
                <CardContent>
                  <pre className="text-[10px] lg:text-xs text-[var(--muted-foreground)] bg-[var(--sidebar)] p-3 rounded-lg overflow-x-auto font-mono">
{`User → Chat → Claude (Orchestrator)
                    ↓ Auto-delegate
         ┌─────────────────────────┐
         │ Execution Tier          │
         │ ├── Codex (Security)    │
         │ ├── GLM-4.7 (Review)    │
         │ ├── Gemini (UI/UX)      │
         │ └── Pencil (Design)     │
         └─────────────────────────┘
                    ↓
         Results → Claude → User`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
