# fugue-system-ui

FUGUE orchestrator dashboard -- a Next.js web UI for monitoring and controlling
multi-agent workflows in real time via WebSocket, backed by Supabase and
Cloudflare Workers.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 (CSS variables, light/dark)
- Supabase (auth, DB, RLS)
- Cloudflare Workers (WebSocket Durable Object backend)
- Sentry (error tracking, source maps)
- Vitest + Testing Library (unit tests)
- Zod (runtime schema validation)
- @xyflow/react (agent graph visualisation)

## Key directories

- src/app/        -- App Router pages (chat, work, runs, git, settings, ...)
- src/components/ -- shared UI (Button, Card, Sidebar, AgentCard, ...)
- src/hooks/      -- data hooks (useWebSocket, useDashboardData, useServerData, ...)
- src/lib/        -- utilities (auth, supabase client, chat orchestration, CSRF)
- src/types/      -- Zod-backed type definitions (agent, run, task, inbox, ...)
- src/contexts/   -- React contexts (Auth, Agents, Project, Conversation, Theme)
- src/data/       -- mock data for offline/dev fallback
- supabase/migrations/ -- SQL migrations (users, execution plans, RLS)
- scripts/        -- helper scripts (password hashing, production start)

## Commands

```
npm run dev          # local dev server
npm run build        # production build
npm run start        # start production server
npm run lint         # ESLint
npm run test         # vitest (single run)
npm run test:watch   # vitest (watch mode)
npm run test:coverage
```

## Environment variables

NEXT_PUBLIC_WS_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_CF_TEAM_NAME, NEXT_PUBLIC_ADMIN_EMAILS,
CF_ACCESS_AUD, AUTH_SECRET, AUTH_USERS, GLM_API_KEY, OPERATOR_EMAILS,
SENTRY_AUTH_TOKEN, SENTRY_DSN, ANALYZE (bundle analyzer toggle).

## Conventions

- Server/Client component boundary is explicit ("use client" directive).
- Mock data fallback when WS is not connected (NEXT_PUBLIC_WS_URL empty).
- Middleware does 2-tier JWT verification (CF Access JWKS or structure-only).
- DEMO_MODE env bypasses auth middleware for local development.
- All interactive elements target iOS HIG 44px minimum touch area.
- WCAG AA: skip-to-content link, aria-live regions, reduced-motion support.
