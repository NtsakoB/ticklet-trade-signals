import { apiFetch } from "@/lib/api";

export type ChatSession = { id: string; created_at: string; ended_at?: string | null; title?: string | null; meta?: any };
export type ChatMessageRow = { id: number; created_at: string; role: string; content: string; tool_name?: string | null; extra?: any };

export const ChatStore = {
  async createSession(title?: string, meta?: any): Promise<ChatSession> {
    return apiFetch("/api/chat/session", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ title, meta }) 
    });
  },
  async endSession(id: string): Promise<ChatSession> {
    return apiFetch(`/api/chat/session/${id}/end`, { method: "POST" });
  },
  async listSessions(): Promise<ChatSession[]> {
    return apiFetch("/api/chat/session");
  },
  async listMessages(id: string): Promise<ChatMessageRow[]> {
    return apiFetch(`/api/chat/session/${id}/messages`);
  },
};