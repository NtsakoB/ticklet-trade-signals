import { useEffect, useState } from "react";
import TradeSignalsTable from "./TradeSignalsTable";
import SignalList from "./SignalList";
import { SignalsService, UnifiedSignal, SignalType } from "@/services/signalsService";

export default function OverviewPanel() {
  const [recent, setRecent] = useState<UnifiedSignal[]>([]);
  const [lowEntry, setLowEntry] = useState<UnifiedSignal[]>([]);
  const [missed, setMissed] = useState<UnifiedSignal[]>([]);
  const [lowPrice, setLowPrice] = useState<UnifiedSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [b,c,d,e] = await Promise.all([
          SignalsService.fetchSignals("recent"),
          SignalsService.fetchSignals("low_entry"),
          SignalsService.fetchSignals("missed"),
          SignalsService.fetchSignals("lowest"),
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
          <SignalList items={recent} scroll={true} height="max-h-80" emptyText="No recent signals." />
        </div>
        <div className="lg:col-span-1">
          <div className="mb-2 text-sm text-gray-400">Low Entry Watchlist</div>
          <SignalList items={lowEntry} scroll={true} height="max-h-80" emptyText="No low-entry opportunities found." />
        </div>
      </div>

      {/* Row 2 — PAGE ENDS AFTER THIS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-2 text-sm text-gray-400">Missed Opportunities</div>
          <SignalList items={missed} scroll={true} height="max-h-80" emptyText="No missed opportunities detected." />
        </div>
        <div>
          <div className="mb-2 text-sm text-gray-400">Lowest Price</div>
          <SignalList items={lowPrice} scroll={true} height="max-h-80" emptyText="No symbols near lowest price detected." />
        </div>
      </div>
    </div>
  );
}