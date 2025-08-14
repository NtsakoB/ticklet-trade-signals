import React, { useEffect, useState } from "react";
import { api } from "@/integrations/api";

export default function Settings() {
  const [s, setS] = useState<any>({ volume_filter: 100000, risk_per_trade: 0.01 });
  const [msg, setMsg] = useState("");

  useEffect(() => { 
    api.settingsGet().then(setS).catch(()=>{}); 
  }, []);

  const save = async () => {
    const r = await api.settingsPut(s); 
    setS(r); 
    setMsg("Saved");
    setTimeout(()=>setMsg(""), 1200);
  };

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="space-y-2">
        <label className="block text-sm">Volume filter</label>
        <input className="border p-2 w-64" type="number" value={s.volume_filter}
          onChange={e=>setS({...s, volume_filter: parseFloat(e.target.value)})}/>
      </div>
      <div className="space-y-2">
        <label className="block text-sm">Risk per trade</label>
        <input className="border p-2 w-64" type="number" step="0.001" value={s.risk_per_trade}
          onChange={e=>setS({...s, risk_per_trade: parseFloat(e.target.value)})}/>
      </div>
      <button className="border px-3 py-1" onClick={save}>Save</button>
      <div className="text-sm text-green-700">{msg}</div>
    </div>
  );
}