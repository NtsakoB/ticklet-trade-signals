export type ChatMessage = { role: "system"|"user"|"assistant"; content: string };

async function retryFetch(url: string, init: RequestInit, attempts = 2, backoff = 300): Promise<Response> {
  let lastErr: any;
  for (let i=0;i<=attempts;i++){
    try {
      const ctl = new AbortController();
      const t = setTimeout(()=>ctl.abort(), 20000);
      const res = await fetch(url, { ...init, signal: ctl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise(r=>setTimeout(r, backoff*(i+1)));
    }
  }
  throw lastErr;
}

export async function askChat(messages: ChatMessage[], opts?: { strategy?: string; mode?: "paper"|"live"; session_id?: string }) {
  const res = await retryFetch("/api/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, strategy: opts?.strategy, mode: opts?.mode, allow_general: true, session_id: opts?.session_id }),
  });
  return res.json() as Promise<{ content: string; tool_calls: string[] }>;
}