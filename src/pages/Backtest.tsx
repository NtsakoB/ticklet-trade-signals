import React, { useState } from "react";
import { api } from "@/integrations/api";

export default function Backtest() {
  const [out, setOut] = useState<any>(null);

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Backtest</h1>
      <button className="border px-3 py-1" onClick={async()=>setOut(await api.backtestRun())}>
        Run Backtest
      </button>
      <pre className="bg-muted p-2 whitespace-pre-wrap">{out ? JSON.stringify(out,null,2) : "No results yet"}</pre>
    </div>
  );
}