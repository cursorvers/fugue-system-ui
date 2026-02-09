import type { Run } from "@/types";

export const mockRuns: readonly Run[] = [
  {
    id: "run-042",
    name: "Security audit: payments.ts",
    status: "completed",
    duration: "12s",
    agent: "Codex",
    startedAt: "2026-02-10T00:58:00Z",
    completedAt: "2026-02-10T00:58:12Z",
  },
  {
    id: "run-041",
    name: "Code review: auth refactor",
    status: "completed",
    duration: "8s",
    agent: "GLM-4.7",
    startedAt: "2026-02-10T00:55:00Z",
    completedAt: "2026-02-10T00:55:08Z",
  },
  {
    id: "run-040",
    name: "UI review: Settings page",
    status: "running",
    duration: "3s",
    agent: "Gemini",
    startedAt: "2026-02-10T01:00:00Z",
  },
  {
    id: "run-039",
    name: "Plan review: API v2",
    status: "completed",
    duration: "15s",
    agent: "Codex",
    startedAt: "2026-02-10T00:52:00Z",
    completedAt: "2026-02-10T00:52:15Z",
  },
  {
    id: "run-038",
    name: "Design: Inbox drawer",
    status: "failed",
    duration: "2s",
    agent: "Pencil",
    startedAt: "2026-02-10T00:48:00Z",
    completedAt: "2026-02-10T00:48:02Z",
    error: "Template not found: inbox-drawer-v2",
  },
] as const;
