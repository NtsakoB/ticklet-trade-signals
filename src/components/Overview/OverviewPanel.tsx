import { useEffect, useState } from "react";
import TradeSignalsTable from "./TradeSignalsTable";
import SignalList from "./SignalList";
import { fetchSignals, UISignal } from "@/services/signalsApi";

export default function OverviewPanel() {
  const [recent, setRecent] = useState<UISignal[]>([]);
  const [lowEntry, setLowEntry] = useState<UISignal[]>([]);
  const [missed, setMissed] = useState<UISignal[]>([]);
  const [lowPrice, setLowPrice] = useState<UISignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [b,c,d,e] = await Promise.all([
          fetchSignals("recent"),
          fetchSignals("low_entry"),
          fetchSignals("missed"),
          fetchSignals("low_price"),
        ]);
        if (!alive) return;
        setRecent(b); setLowEntry(c); setMissed(d); setLowPrice(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-gray-400">Loading overview…</div>;

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <TradeSignalsTable />
        </div>
        <div className="lg:col-span-1">
          <div className="mb-2 text-sm text-gray-400">Recent Signals</div>
          <SignalList items={recent} emptyText="No recent signals." />
        </div>
        <div className="lg:col-span-1">
          <div className="mb-2 text-sm text-gray-400">Low Entry Watchlist</div>
          <SignalList items={lowEntry} emptyText="No low-entry opportunities found." />
        </div>
      </div>

      {/* Row 2 — PAGE ENDS AFTER THIS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-2 text-sm text-gray-400">Missed Opportunities</div>
          <SignalList items={missed} emptyText="No missed opportunities detected." />
        </div>
        <div>
          <div className="mb-2 text-sm text-gray-400">Lowest Price</div>
          <SignalList items={lowPrice} emptyText="No symbols near lowest price detected." />
        </div>
      </div>
    </div>
  );
}