export type ChatSession = { id: string; created_at: string; ended_at?: string | null; title?: string | null; meta?: any };
export type ChatMessageRow = { id: number; created_at: string; role: string; content: string; tool_name?: string | null; extra?: any };

async function jfetch(url: string, init?: RequestInit) {
  const ctl = new AbortController();
  const t = setTimeout(()=>ctl.abort(), 20000);
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export const ChatStore = {
  async createSession(title?: string, meta?: any): Promise<ChatSession> {
    return jfetch("/api/chat/session", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ title, meta }) });
  },
  async endSession(id: string): Promise<ChatSession> {
    return jfetch(`/api/chat/session/${id}/end`, { method:"POST" });
  },
  async listSessions(): Promise<ChatSession[]> {
    return jfetch("/api/chat/session");
  },
  async listMessages(id: string): Promise<ChatMessageRow[]> {
    return jfetch(`/api/chat/session/${id}/messages`);
  },
};