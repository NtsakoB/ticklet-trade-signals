import React, { useState } from "react";
import { api } from "@/integrations/api";

export default function Chat() {
  const [msg, setMsg] = useState(""); 
  const [reply, setReply] = useState("");

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Chat</h1>
      <textarea className="w-full border p-2" rows={4} value={msg} onChange={e=>setMsg(e.target.value)} />
      <button className="border px-3 py-1" onClick={async()=>{
        const r = await api.chat(msg); setReply(r.reply);
      }}>Send</button>
      <pre className="bg-muted p-2">{reply}</pre>
    </div>
  );
}