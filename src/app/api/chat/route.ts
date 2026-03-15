import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

async function getSystemContext(): Promise<string> {
  const [agentsRes, tasksRes, runsRes] = await Promise.all([
    supabase?.from('fugue_agents').select('name, role, status').limit(20) ?? { data: null },
    supabase?.from('fugue_tasks').select('subject, status, priority').order('updated_at', { ascending: false }).limit(10) ?? { data: null },
    supabase?.from('fugue_runs').select('summary, status, agent, duration_ms').order('started_at', { ascending: false }).limit(10) ?? { data: null },
  ]);
  const agents = agentsRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const runs = runsRes.data ?? [];
  return [
    'あなたはFUGUEオーケストレーションシステムのアシスタントです。日本語で簡潔に答えてください。',
    '',
    '## 現在のシステム状態',
    '### エージェント',
    agents.length ? agents.map((a: any) => '- ' + a.name + ' (' + a.role + '): ' + a.status).join('\n') : 'データなし',
    '### 直近タスク',
    tasks.length ? tasks.map((t: any) => '- [' + t.status + '] ' + t.subject).join('\n') : 'データなし',
    '### 直近実行',
    runs.length ? runs.map((r: any) => '- [' + r.status + '] ' + r.summary + ' (' + r.agent + ')').join('\n') : 'データなし',
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
        model: 'glm-4.5-flash',
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
