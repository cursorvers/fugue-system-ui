import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mockAgents } from '@/data/mock-agents';
import { mockRuns } from '@/data/mock-runs';
import { mockTasks } from '@/data/mock-tasks';
import type { Agent, Run, Task } from '@/types';

const GLM_API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';

type SupabaseAgentRow = Pick<Agent, 'name' | 'role' | 'status'>;
type SupabaseTaskRow = { subject: string; status: Task['status']; priority: Task['priority'] };
type SupabaseRunRow = { summary: string; status: Run['status']; agent?: string | null; duration_ms?: number | null };

function formatDuration(durationMs?: number | null): string {
  if (typeof durationMs !== 'number' || Number.isNaN(durationMs)) {
    return '時間不明';
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(durationMs % 1000 === 0 ? 0 : 1)}s`;
}

function useFallbackData<T>(data: T[] | null | undefined, error: unknown, fallback: readonly T[]): T[] {
  if (error || !data || data.length === 0) {
    return [...fallback];
  }

  return data;
}

async function getSystemContext(): Promise<string> {
  const [agentsRes, tasksRes, runsRes] = await Promise.all([
    supabase?.from('fugue_agents').select('name, role, status').limit(20) ?? { data: null, error: new Error('Supabase client unavailable') },
    supabase?.from('fugue_tasks').select('subject, status, priority').order('updated_at', { ascending: false }).limit(10) ?? { data: null, error: new Error('Supabase client unavailable') },
    supabase?.from('fugue_runs').select('summary, status, agent, duration_ms').order('started_at', { ascending: false }).limit(10) ?? { data: null, error: new Error('Supabase client unavailable') },
  ]);

  const agents = useFallbackData<SupabaseAgentRow | Agent>(agentsRes.data, agentsRes.error, mockAgents);
  const tasks = useFallbackData<SupabaseTaskRow | Task>(tasksRes.data, tasksRes.error, mockTasks);
  const runs = useFallbackData<SupabaseRunRow | Run>(runsRes.data, runsRes.error, mockRuns);

  return [
    'あなたはFUGUEオーケストレーションシステムのアシスタントです。日本語で簡潔に答えてください。',
    '',
    '## 現在のシステム状態',
    '### エージェント',
    agents.length
      ? agents
          .map((a) => {
            const tasksLabel = 'tasks' in a ? `, ${a.tasks}タスク` : '';
            const latencyLabel = 'latency' in a ? `, レイテンシ ${a.latency}` : '';
            return '- ' + a.name + ' (' + a.role + '): ' + a.status + tasksLabel + latencyLabel;
          })
          .join('\n')
      : 'データなし',
    '### 直近タスク',
    tasks.length
      ? tasks
          .map((t) => {
            const subject = 'subject' in t ? t.subject : t.title;
            return '- [' + t.status + '] ' + subject + ' (priority: ' + t.priority + ')';
          })
          .join('\n')
      : 'データなし',
    '### 直近実行',
    runs.length
      ? runs
          .map((r) => {
            const summary = 'summary' in r ? r.summary : r.name;
            const duration = 'duration_ms' in r ? formatDuration(r.duration_ms) : r.duration;
            const agent = r.agent ?? 'unknown';
            return '- [' + r.status + '] ' + summary + ' (' + agent + ', ' + duration + ')';
          })
          .join('\n')
      : 'データなし',
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    const systemPrompt = await getSystemContext();
    const res = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (process.env.GLM_API_KEY || ''),
      },
      body: JSON.stringify({
        model: 'glm-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GLM API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error('[api/chat]', err);
    return NextResponse.json({ reply: 'システムに接続できませんでした。しばらくしてから再試行してください。' }, { status: 200 });
  }
}
