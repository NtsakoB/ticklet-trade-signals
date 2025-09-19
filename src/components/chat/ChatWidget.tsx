import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { useChat } from "./ChatProvider";
import { askChat, ChatMessage } from "@/services/chatClient";

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
  <div className={`bg-card border border-border rounded-2xl shadow-xl ${className}`} {...props} />
);

export const ChatWidget: React.FC<{ strategy?: string; mode?: "paper"|"live" }>= ({ strategy, mode }) => {
  const { open, fullscreen, closeChat, toggleFullscreen } = useChat();
  const [msgs, setMsgs] = React.useState<{role:"user"|"assistant"; content:string}[]>([
    { role:"assistant" as const, content:"What would you like to do?" },
    { role:"assistant" as const, content:"Ticklet is an advanced trading bot." },
  ]);
  const [busy, setBusy] = React.useState(false);

  async function handleSend(text: string) {
    const next = [...msgs, { role:"user" as const, content: text }];
    setMsgs(next);
    setBusy(true);
    try {
      const { content } = await askChat(
        [{ role:"system", content:"You are in the Ticklet dashboard." }, ...next as ChatMessage[]],
        { strategy, mode }
      );
      setMsgs([...next, { role:"assistant" as const, content }]);
    } catch (e:any) {
      setMsgs([...next, { role:"assistant" as const, content: "Sorry, I couldn't reach the chat service. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  const [input, setInput] = React.useState("");

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
                    <p className="text-xs text-muted-foreground leading-none mt-1">
                      {busy ? "Thinking..." : "Happy to help"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                {msgs.map((m, i) => (
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
                    if(!input.trim()) return; 
                    const v=input.trim(); 
                    setInput(""); 
                    handleSend(v); 
                  }} 
                  className="flex items-center gap-2"
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
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};