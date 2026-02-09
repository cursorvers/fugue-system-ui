import type { InboxItem } from "@/types";

export const mockInboxItems: readonly InboxItem[] = [
  {
    id: 1,
    type: "review",
    title: "GLM: auth.ts review complete",
    body: "Score 6/7 — 2 suggestions",
    time: "2m",
    read: false,
    severity: "info",
  },
  {
    id: 2,
    type: "alert",
    title: "Codex: security warning",
    body: "Potential XSS in user input handler",
    time: "5m",
    read: false,
    severity: "major",
  },
  {
    id: 3,
    type: "info",
    title: "Build succeeded",
    body: "17 routes compiled, 0 errors",
    time: "8m",
    read: true,
    severity: "info",
  },
  {
    id: 4,
    type: "review",
    title: "Gemini: UI review done",
    body: "Layout approved with notes",
    time: "15m",
    read: true,
    severity: "minor",
  },
  {
    id: 5,
    type: "info",
    title: "Deploy preview ready",
    body: "fugue-system-ui-abc123.vercel.app",
    time: "20m",
    read: true,
    severity: "info",
  },
] as const;
