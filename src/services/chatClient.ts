import { apiFetch } from "@/lib/api";

export type ChatMessage = { role: "system"|"user"|"assistant"; content: string };

export async function askChat(messages: ChatMessage[], opts?: { strategy?: string; mode?: "paper"|"live"; session_id?: string }) {
  return apiFetch("/api/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      messages, 
      strategy: opts?.strategy, 
      mode: opts?.mode, 
      allow_general: true, 
      session_id: opts?.session_id 
    }),
  }) as Promise<{ content: string; tool_calls: string[] }>;
}