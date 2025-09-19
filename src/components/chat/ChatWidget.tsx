import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { useChat } from "./ChatProvider";
import { askChat, ChatMessage } from "@/services/chatClient";
import { ChatStore } from "@/services/chatStoreClient";
import { apiFetch } from "@/lib/api";

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
  <div className={`bg-card border border-border rounded-2xl shadow-xl ${className}`} {...props} />
);

// global session id holder (simple)
declare global { interface Window { __CHAT_SESSION_ID?: string } }

type Msg = { role:"user"|"assistant"; content:string };

export const ChatWidget: React.FC<{ strategy?: string; mode?: "paper"|"live" }>= ({ strategy, mode }) => {
  // chat state
  const { open, fullscreen, closeChat, toggleFullscreen } = useChat();
  const [msgs, setMsgs] = React.useState<Msg[]>([
    { role:"assistant", content:"What would you like to do?" },
    { role:"assistant", content:"Ticklet is an advanced trading bot." },
  ]);
  const [busy, setBusy] = React.useState(false);
  const [input, setInput] = React.useState("");

  // history state
  const [showHistory, setShowHistory] = React.useState(false);
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [selSession, setSelSession] = React.useState<any | null>(null);
  const [histMsgs, setHistMsgs] = React.useState<any[]>([]);
  const [histLoading, setHistLoading] = React.useState(false);

  // session bootstrap for persistence
  React.useEffect(()=>{ (async ()=>{
    try {
      if (!(window as any).__CHAT_SESSION_ID) {
        const s = await ChatStore.createSession("Ticklet dashboard chat", { strategy, mode });
        (window as any).__CHAT_SESSION_ID = s.id;
      }
    } catch {}
  })(); }, [strategy, mode]);

  async function refreshHistory() {
    try {
      const s = await ChatStore.listSessions();
      setSessions(s);
      if (s.length && !selSession) {
        setSelSession(s[0]);
      }
    } catch {}
  }

  React.useEffect(()=>{ if (showHistory) { refreshHistory(); } }, [showHistory]);

  React.useEffect(()=>{ (async()=>{
    if (!showHistory || !selSession) return;
    setHistLoading(true);
    try {
      const m = await ChatStore.listMessages(selSession.id);
      setHistMsgs(m);
    } finally {
      setHistLoading(false);
    }
  })(); }, [showHistory, selSession]);

  async function handleSend(text: string) {
    const next = [...msgs, { role:"user" as const, content: text }];
    setMsgs(next);
    setBusy(true);
    try {
      // Check if chat service is available first
      const healthCheck = await apiFetch("/api/health/chat");
      if (!healthCheck.ok) {
        setMsgs([...next, { 
          role:"assistant" as const, 
          content: "Sorry, the chat service is not configured. OpenAI key is required for chat functionality." 
        }]);
        return;
      }
      
      const { content } = await askChat(
        [{ role:"system", content:"You are in the Ticklet dashboard." }, ...next as ChatMessage[]],
        { strategy, mode, session_id: (window as any).__CHAT_SESSION_ID }
      );
      setMsgs([...next, { role:"assistant" as const, content }]);
    } catch (e:any) {
      setMsgs([...next, { 
        role:"assistant" as const, 
        content: "Sorry, I couldn't reach the chat service. The OpenAI integration may not be configured." 
      }]);
    } finally {
      setBusy(false);
    }
  }


  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div 
          key="chat-overlay" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-[70] pointer-events-none"
        >
          {fullscreen && (
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" 
              onClick={toggleFullscreen} 
            />
          )}
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.98 }} 
            animate={{ y: 0, opacity: 1, scale: 1 }} 
            exit={{ y: 10, opacity: 0, scale: 0.98 }} 
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={`pointer-events-auto ${
              fullscreen 
                ? "fixed inset-4 sm:inset-10" 
                : "fixed top-20 right-8 w-[360px] sm:w-[420px] max-h-[70vh]"
            }`}
          >
            <Card className={`relative flex flex-col ${fullscreen ? "h-full" : "h-[560px]"} overflow-hidden`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/20 grid place-content-center text-sm font-semibold text-primary">
                    T
                  </div>
                  <div>
                    <p className="text-foreground font-semibold leading-none">Ticklet Bot</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={async ()=>{ try { if (window.__CHAT_SESSION_ID) { await ChatStore.endSession(window.__CHAT_SESSION_ID); } } catch(e){} finally { /* close like minimize */ closeChat(); }}} className="px-2 py-1 rounded-md hover:bg-accent text-xs border border-border">
                    End chat
                  </button>
                  <button 
                    onClick={toggleFullscreen} 
                    className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" 
                    aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
                  >
                    {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <button 
                    onClick={closeChat} 
                    className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" 
                    aria-label="Close chat"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {/* HISTORY OVERLAY (replaces chat content when showHistory) */}
                {showHistory ? (
                  <div className="absolute inset-0 bg-card">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <div className="text-foreground font-semibold">Chat History</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={()=>{ setShowHistory(false); }} 
                          className="px-3 py-2 rounded-md hover:bg-accent transition-colors border border-border text-sm"
                        >
                          Close History
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-[calc(100%-56px)]">
                      {/* Sessions */}
                      <div className="bg-muted border border-border rounded-xl overflow-hidden">
                        <div className="px-3 py-2 border-b border-border text-muted-foreground text-sm">Sessions</div>
                        <div className="max-h-full overflow-y-auto p-2 space-y-1">
                          {sessions.map(s=>(
                            <button key={s.id}
                              onClick={()=>setSelSession(s)}
                              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-accent ${selSession?.id===s.id?"bg-accent":""}`}>
                              <div className="text-foreground text-sm">{s.title || s.id.slice(0,8)}</div>
                              <div className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleString()} {s.ended_at?"• ended":""}</div>
                            </button>
                          ))}
                          {!sessions.length && <div className="text-muted-foreground text-sm px-2 py-3">No sessions yet.</div>}
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="lg:col-span-2 bg-muted border border-border rounded-xl overflow-hidden">
                        <div className="px-3 py-2 border-b border-border text-muted-foreground text-sm">
                          {selSession ? (selSession.title || selSession.id) : "Messages"}
                        </div>
                        <div className="h-full max-h-full overflow-y-auto p-3 space-y-3">
                          {histLoading && <div className="text-muted-foreground text-sm">Loading…</div>}
                          {!histLoading && selSession && histMsgs.map(m=>(
                            <div key={m.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role==="assistant"?"bg-muted text-foreground":"bg-primary text-primary-foreground"} ${m.role!=="assistant"?"ml-auto":""}`}>
                              <div className="text-xs opacity-70 mb-1">
                                {new Date(m.created_at).toLocaleString()} • {m.role}{m.tool_name?` • ${m.tool_name}`:""}
                              </div>
                              {m.content}
                            </div>
                          ))}
                          {!histLoading && selSession && !histMsgs.length && (
                            <div className="text-muted-foreground text-sm">No messages in this session.</div>
                          )}
                          {!selSession && <div className="text-muted-foreground text-sm">Select a session to view messages.</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {!showHistory && msgs.map((m, i) => (
                  <div 
                    key={i} 
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow ${
                      m.role==="assistant" 
                        ? "bg-muted text-foreground" 
                        : "bg-primary text-primary-foreground ml-auto"
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
              </div>

              <div className="border-t border-border p-3">
                <form 
                  onSubmit={(e)=>{ 
                    e.preventDefault(); 
                    if(showHistory) return; 
                    if(!input.trim()) return; 
                    const v=input.trim(); 
                    setInput(""); 
                    handleSend(v); 
                  }} 
                  className="flex items-center gap-2" style={{ alignItems:'stretch' }}
                >
                  <input 
                    name="q" 
                    value={input} 
                    onChange={(e)=>setInput(e.target.value)} 
                    placeholder="Ask me anything" 
                    className="flex-1 rounded-xl bg-background border border-border px-3 py-2 text-sm outline-none focus:border-primary" 
                  />
                  <button 
                    disabled={busy} 
                    type="submit" 
                    className="rounded-xl px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {busy ? "..." : "Send"}
                  </button>
                </form>
                <div className="mt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={()=>{ setShowHistory(true); if(!fullscreen) toggleFullscreen(); }}
                    className="rounded-xl px-3 py-2 text-sm bg-muted hover:bg-accent transition-colors border border-border"
                  >
                    History
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};