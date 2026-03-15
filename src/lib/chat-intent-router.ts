import { generateMockResponse } from './mock-chat-responder';

export async function routeChatIntent(userMessage: string): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage }),
    });
    const data = await res.json();
    return data.reply || 'エラーが発生しました。';
  } catch {
    return generateMockResponse(userMessage);
  }
}
