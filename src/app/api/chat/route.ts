import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';

const anthropic = new Anthropic();

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
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });
    const reply = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error('[api/chat]', err);
    return NextResponse.json({ reply: 'システムに接続できませんでした。しばらくしてから再試行してください。' }, { status: 200 });
  }
}
