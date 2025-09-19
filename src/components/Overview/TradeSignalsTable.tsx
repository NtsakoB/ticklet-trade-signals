import { useEffect, useMemo, useState } from "react";
import { SignalsService, UnifiedSignal } from "@/services/signalsService";

export default function TradeSignalsTable() {
  const [rows, setRows] = useState<UnifiedSignal[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    SignalsService.fetchSignals("active").then((d) => { if (alive) setRows(d); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter(r =>
      r.symbol.toLowerCase().includes(qq) ||
      r.title.toLowerCase().includes(qq)
    );
  }, [rows, q]);

  return (
    <div className="bg-[#111827] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Trade Signals</div>
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Search symbols…"
          className="bg-gray-800 text-sm rounded px-2 py-1 w-56"
        />
      </div>
      {/* INTERNAL scroll area — keeps the page height fixed */}
      <div className="max-h-[28rem] overflow-auto rounded-lg border border-gray-800">
        <div className="grid grid-cols-6 text-xs text-gray-400 px-3 py-2 sticky top-0 bg-[#0f172a]">
          <div>Symbol</div><div>Type</div><div>Entry</div><div>Targets</div><div>Stop</div><div>Status</div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-4 text-gray-500">No trade signals.</div>
        ) : filtered.map((s) => (
          <div key={s.id} className="grid grid-cols-6 px-3 py-3 text-sm border-t border-gray-800">
            <div className="font-medium">{s.symbol}</div>
            <div>{s.subtitle}</div>
            <div>${s.price.toLocaleString()}</div>
            <div className="text-xs text-blue-300">{s.title}</div>
            <div className="text-xs text-red-300">${s.stop_loss > 0 ? s.stop_loss.toFixed(2) : '-'}</div>
            <div className="text-xs text-gray-300">{s.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
