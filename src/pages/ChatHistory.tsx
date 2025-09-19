import React from "react";
import { ChatStore, ChatSession, ChatMessageRow } from "@/services/chatStoreClient";

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
  <div className={`bg-card border border-border rounded-2xl shadow-xl ${className}`} {...props} />
);

export default function ChatHistory() {
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [sel, setSel] = React.useState<ChatSession | null>(null);
  const [msgs, setMsgs] = React.useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(()=>{ (async()=> setSessions(await ChatStore.listSessions()))(); }, []);
  React.useEffect(()=>{ (async()=> { if(sel){ setLoading(true); setMsgs(await ChatStore.listMessages(sel.id)); setLoading(false);} })(); }, [sel]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-foreground text-2xl font-semibold">Chat History</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <h2 className="text-foreground font-medium mb-3">Sessions</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {sessions.map(s => (
              <button key={s.id} onClick={()=>setSel(s)} className={`w-full text-left px-3 py-2 rounded-lg hover:bg-accent ${sel?.id===s.id ? "bg-accent" : ""}`}>
                <div className="text-foreground text-sm">{s.title || s.id.slice(0,8)}</div>
                <div className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleString()} {s.ended_at ? "• ended" : ""}</div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4 lg:col-span-2">
          <h2 className="text-foreground font-medium mb-3">Messages</h2>
          {!sel && <div className="text-muted-foreground text-sm">Select a session to view messages.</div>}
          {sel && (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {loading && <div className="text-muted-foreground text-sm">Loading…</div>}
              {!loading && msgs.map(m=>(
                <div key={m.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role==="assistant"?"bg-muted text-foreground":"bg-primary text-primary-foreground"} ${m.role!=="assistant"?"ml-auto":""}`}>
                  <div className="text-xs opacity-70 mb-1">{new Date(m.created_at).toLocaleString()} • {m.role}{m.tool_name?` • ${m.tool_name}`:""}</div>
                  {m.content}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}