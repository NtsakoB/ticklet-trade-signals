import React, { useEffect, useState } from "react";
import { api } from "@/integrations/api";

export default function Paper() {
  const [state, setState] = useState<any>({ cash: 0, positions: [], history: [] });

  const refresh = async () => setState(await api.paperState());

  useEffect(()=>{ refresh(); },[]);

  const place = async () => {
    await api.paperOrder({ symbol:"BTCUSDT", side:"LONG", qty:0.01, price:68000 });
    await refresh();
  };

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Paper Trading</h1>
      <button className="border px-3 py-1" onClick={place}>Place Sample Long</button>
      <pre className="bg-muted p-2 whitespace-pre-wrap">{JSON.stringify(state,null,2)}</pre>
    </div>
  );
}