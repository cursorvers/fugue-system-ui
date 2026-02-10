# FUGUE Dashboard UI/UX Completion Plan

## Overview
- **Goal**: Mock UIを完成度の高いUI/UXに仕上げ、その後実運用API接続へ移行
- **Strategy**: UI-first + Contract-first (3者合議承認: Codex APPROVE条件付き / Gemini APPROVE / GLM APPROVE)
- **Project**: `/Users/masayuki/Dev/fugue-system-ui/`
- **Stack**: Next.js 15 + React 19 + Tailwind CSS 4 + TypeScript 5

## Tech Stack
- Frontend: Next.js 15 (App Router) + React 19
- Styling: Tailwind CSS 4 + CSS Variables (Light/Dark)
- Icons: Material Symbols Sharp
- Fonts: Geist (UI) + JetBrains Mono (data)
- Backend: Cloudflare Workers (WebSocket Durable Object)
- Deploy: Vercel (frontend) + Cloudflare (backend)

---

## Phase 0: Contract-first — 型定義・API契約先行確定 `cc:完了`

> **Purpose**: UI実装前にデータ構造を固定し、後工程の統合リスクを排除

### 0-1. API型定義（Zodスキーマ + TypeScript Interface） `[feature:tdd]`
- [x] `src/types/agent.ts` — Agent型定義（name, role, status, tasks, latency, lastSeen）
- [x] `src/types/run.ts` — Run型定義（id, name, status, duration, agent, startedAt, completedAt, error?）
- [x] `src/types/task.ts` — Task型定義（id, title, status, priority, assignee, createdAt, blockedBy?）
- [x] `src/types/inbox.ts` — InboxItem型定義（id, type, title, body, time, read, severity?）
- [x] `src/types/metrics.ts` — DashboardMetrics型定義（activeAgents, totalTasks, successRate, avgLatency）
- [x] `src/types/ws-events.ts` — WebSocketイベント型（agent-update, run-update, task-update, metric-update, error）
- [x] `src/types/index.ts` — 全型のバレルエクスポート

### 0-2. RSC / Client Component 境界設計
- [x] `src/app/layout.tsx` → Server Component維持（Providers はClient boundary）
- [x] 各ページの Server/Client 境界を `"use client"` ディレクティブで明示
- [x] WebSocket接続ポイント = Client Component として分離

### 0-3. モックデータを型準拠に統一
- [x] `src/data/mock-agents.ts` — Agent[] 型準拠のモックデータ
- [x] `src/data/mock-runs.ts` — Run[] 型準拠
- [x] `src/data/mock-tasks.ts` — Task[] 型準拠
- [x] `src/data/mock-inbox.ts` — InboxItem[] 型準拠
- [x] `src/data/mock-metrics.ts` — DashboardMetrics 型準拠
- [x] page.tsx からハードコードデータを `src/data/` へ移行

### 0-4. 認証モック強化
- [x] AuthContext に `role: 'admin' | 'viewer'` 追加
- [x] `isLoading` / `error` 状態のUI出し分けパターン定義
- [ ] ProtectedRoute に権限チェック追加（admin only ページ等）

---

## Phase 1: UI/UX仕上げ — デザインシステム + 状態パターン + A11y `cc:完了`

> **Purpose**: 全画面をプロダクション品質に引き上げ

### 1-1. 状態パターンコンポーネント（Empty / Loading / Error / Reconnecting） `[feature:a11y]`
- [x] `src/components/Skeleton.tsx` — ローディングスケルトン（Card, Table, MetricCard, AgentList用）
- [x] `src/components/EmptyState.tsx` — 空データ表示（icon + message + action CTA）
- [x] `src/components/ErrorState.tsx` — エラー表示（retry button + error message）
- [x] `src/components/ConnectionStatus.tsx` — WebSocket接続状態バー（connected/connecting/disconnected/error）

### 1-2. デザインシステム整理 `[feature:a11y]`
- [x] `prefers-reduced-motion` 対応（全アニメーション無効化）
- [x] `.sr-only` ユーティリティクラス追加
- [x] `.skip-to-content` スキップリンク
- [x] focus-visible スタイルはButton既存（ring-2 + ring-offset-1）

### 1-3. コンポーネント品質改善 `[feature:a11y]`
- [x] Inbox drawer — `role="dialog"` + `aria-label` + `aria-modal`
- [x] Table（Recent Runs） — `<caption>` + `scope` 属性追加
- [x] Inbox button — `aria-label` with unread count
- [x] Agent status dot — `aria-label` 追加
- [x] Agent items — `<button>` + `aria-expanded` に変更
- [x] Inbox list — `role="list"` + `role="listitem"`

### 1-5. 各画面の仕上げ
- [x] `/` — Overview: 型付きモックデータ移行、A11y改善完了
- [x] `/work` — Work: Agents + Tasks タブ、詳細パネル付き（既存で高品質）
- [x] `/runs` — Runs: テーブル + ログビューア + 詳細パネル（既存で高品質）
- [x] `/chat` — Chat: WebSocket接続、メッセージバブル、クイックコマンド（既存で高品質）
- [x] `/git` — Git: Commits/Branches/Changes タブ、詳細パネル（既存で高品質）
- [x] `/settings` — 4サブページ完成

### 1-6. キーボードナビゲーション + アクセシビリティ
- [x] Skip to main content リンク追加（layout.tsx）
- [x] `aria-live="polite"` リージョン（ConnectionStatus）

---

## Phase 2: 縦切りスライス — 最重要フロー1-2本の実接続 `cc:完了`

> **Purpose**: 最小限の実データ接続で統合リスクを早期発見

### 2-1. Overview ダッシュボード実データ接続
- [x] `src/types/ws-events.ts` — 実DOプロトコル対応（ServerTask, ServerGitRepo, ServerAlert, ServerProviderHealth, ack, task_created）
- [x] `src/hooks/useDashboardData.ts` — WS接続+状態管理+mockフォールバック（220行）
- [x] `src/app/page.tsx` — useDashboardData統合、ConnectionStatus表示、Live/Offline表示、リフレッシュ機能
- [x] WebSocket経由でリアルタイムメトリクス取得（status-request → tasks/git-status/alert/observability-sync）
- [x] Agent状態のリアルタイム更新（provider-health → metrics派生）
- [x] Recent Runs のリアルタイム更新（ServerTask → Run型マッピング）
- [x] Inbox のリアルタイム通知（ServerAlert → InboxItem型マッピング）
- [x] 再接続時の自動status-request（状態復旧）

### 2-2. Chat → Orchestration API 接続
- [x] Worker側: CockpitGateway経由ルーティング実装済み（既存DO）
- [x] UI側: ack → task_created → chat-response フロー完全対応
- [x] Workers AI フォールバック対応（エージェント未接続時）
- [x] エラーハンドリング（error構造化対応、再試行可能）
- [x] routing情報表示（suggestedAgent + confidence）

**Codex architect レビュー**: 案B（Transport抽象+Domain Store分割）を推奨。Phase 3でリファクタ検討。

---

## Phase 3: 全画面API接続 + 認証本格化 `cc:完了（認証スキップ）`

> **Purpose**: 全画面を実データに接続し、ターミナル代替として機能させる

### 3-1. WebSocket経由リアルタイムデータ連携 ✅
- [x] `src/hooks/useServerData.ts` — 共通サーバー接続フック（Work/Runs/Git共用）
- [x] Work ページ: ServerTask → WorkTask マッピング、ConnectionStatus統合
- [x] Runs ページ: ServerTask → Run マッピング、時間計算・フォーマット、ConnectionStatus統合
- [x] Git ページ: ServerGitRepo → Branch/ChangedFile マッピング、Branches/Changes/Header全タブ統合
- [x] 全ページ: サーバーデータ利用時は動的切替、未接続時はstaticデータフォールバック
- [x] ビルド検証: 全17ルートコンパイル成功

### 3-2. 認証本格化（スキップ — ユーザー指示）
- [ ] Cloudflare Access (Google SSO) 統合
- [ ] デモ認証からの移行
- [ ] Role-based access control

### 3-3. 全画面のリアルタイム接続 ✅
- [x] Overview（Phase 2で完了）: useDashboardData → メトリクス/Runs/Inbox/Agents
- [x] Chat（Phase 2で完了）: ack/task_created/chat-response/error 対応
- [x] Work: tasks WSメッセージ → WorkTask変換
- [x] Runs: tasks WSメッセージ → Run変換（duration/time計算付き）
- [x] Git: git-status WSメッセージ → Branch/ChangedFile変換（Branches/Changes/Working Tree）
- [ ] 双方向同期（CLI実行結果 → UI反映）— Phase 4以降

---

## Phase 4: Chat UI リアーキテクチャ `cc:完了`

> **Purpose**: 4コマンド廃止 → 自然言語チャット統一、会話タブ管理

### 4-1. 型定義・Context 基盤
- [x] `src/types/project.ts` — Project, Conversation 型定義
- [x] `src/types/chat.ts` — Message 型定義（projectId, conversationId追加）
- [x] `src/types/index.ts` — バレルエクスポート追加
- [x] `src/contexts/ProjectContext.tsx` — プロジェクト管理（localStorage永続化）
- [x] `src/contexts/ConversationContext.tsx` — 会話管理（タイトル自動生成）

### 4-2. Chat コンポーネント分割
- [x] `src/hooks/useChatHistory.ts` — 会話別メッセージ管理（100件上限、レガシーマイグレーション）
- [x] `src/components/chat/ConversationTabs.tsx` — タブバー（横スクロール、アクティブハイライト）
- [x] `src/components/chat/MessageBubble.tsx` — コードブロック検出、ルーティングバッジ、ステータス表示
- [x] `src/components/chat/ChatInput.tsx` — テキストエリア（自動リサイズ、44px タッチターゲット）
- [x] `src/components/chat/WelcomeScreen.tsx` — サジェスションチップ（自然言語）

### 4-3. Chat ページ書き換え
- [x] `src/app/chat/page.tsx` — 533行→280行に縮小、quickCommands削除、sendChat統一
- [x] `src/app/layout.tsx` — ProjectProvider + ConversationProvider 追加

---

## Phase 5: モバイル A11y (iOS HIG) `cc:完了`

> **Purpose**: 全インタラクティブ要素を iOS HIG 44px タッチターゲット準拠に

- [x] `src/components/Button.tsx` — 全サイズ min-h-[44px] 追加
- [x] `src/components/MobileNav.tsx` — ハンバーガー/検索ボタン min-h/min-w [44px]
- [x] `src/app/page.tsx` — Agent リスト min-h-[44px]、badge 9→10px、latency 10→11px
- [x] `src/app/runs/page.tsx` — ログ py-2→py-3、badge 9→10px
- [x] `src/app/git/page.tsx` — badge 9→10px、タブ min-h-[44px]
- [x] `src/app/work/page.tsx` — タブ min-h-[44px]

---

## Phase 6: プロダクション強化 `cc:完了`

> **Purpose**: Vercel + Cloudflare Access デプロイ対応

### 6-1. Edge Runtime Middleware
- [x] `src/middleware.ts` — 2-tier JWT検証（jose JWKS + structure fallback）
- [x] CF_ACCESS_AUD 設定時: Tier 2（署名検証）、未設定時: Tier 1（構造+期限）
- [x] DEMO_MODE bypass、30s clock skew buffer

### 6-2. フォント最適化
- [x] `src/app/layout.tsx` — next/font (Geist, JetBrains_Mono) self-hosted
- [x] `src/app/globals.css` — CSS variable fonts (var(--font-geist), var(--font-jetbrains-mono))
- [x] CDN font links 3本削除（Material Symbols Sharpのみ残留）
- [x] viewport export（themeColor deprecation 対応）

### 6-3. WebSocket 本番対応
- [x] WS URL: `process.env.NEXT_PUBLIC_WS_URL ?? ""` — ステージングフォールバック削除（3ファイル）
- [x] `src/hooks/useWebSocket.ts` — console.log/warn 削除、空URL guard追加
- [x] `src/hooks/useDashboardData.ts` — task-result ハンドラ追加（冪等更新）
- [x] `src/hooks/useServerData.ts` — task-result ハンドラ追加（冪等更新）

### 6-4. 認証・権限
- [x] Settings 4ページ — `requiredRole="admin"` 追加
- [x] `jose` パッケージ追加（Edge Runtime JWT検証）

---

## Priority Matrix

| Feature | Priority | Reason |
|---------|----------|--------|
| Phase 0: 型定義 | **Must** ✅ | 全フェーズの前提条件 |
| Phase 1-1: 状態パターン | **Must** ✅ | UXの根幹 |
| Phase 1-2: デザインシステム | **Must** ✅ | 一貫性の担保 |
| Phase 1-3: A11y | **Must** ✅ | WCAG AA準拠 |
| Phase 1-5: 各画面仕上げ | **Should** ✅ | 完成度向上 |
| Phase 1-6: キーボード操作 | **Should** (部分) | Skip link + aria-live 完了 |
| Phase 2: 縦切りスライス | **Must** ✅ | 統合リスク早期発見 |
| Phase 3: 全接続 | **Must** ✅ | 認証以外完了 |
| Phase 4: Chat UI | **Should** ✅ | UX統一 |
| Phase 5: Mobile A11y | **Must** ✅ | iOS HIG準拠 |
| Phase 6: Production | **Must** ✅ | デプロイ対応 |

---

*Created: 2026-02-10*
*Phase 0-1 completed: 2026-02-10*
*Phase 2 completed: 2026-02-10*
*Phase 3 completed: 2026-02-10 (auth skipped per user instruction)*
*Phase 4 completed: 2026-02-10 (Chat UI rearchitecture)*
*Phase 5 completed: 2026-02-10 (Mobile A11y)*
*Phase 6 completed: 2026-02-10 (Production hardening)*
*Recovery: 2026-02-10 (git filter-repo revert → full re-application)*
*Approved by: 3-party vote (Claude + Codex + Gemini + GLM)*
