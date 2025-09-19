import { useEffect, useState } from "react";
import TradeSignalsTable from "./TradeSignalsTable";
import SignalList from "./SignalList";
import { fetchSignals, UISignal } from "@/services/signalsApi";

export default function OverviewPanel() {
  const [recent, setRecent] = useState<UISignal[]>([]);
  const [lowest, setLowest] = useState<UISignal[]>([]);
  const [missed, setMissed] = useState<UISignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [recentData, lowestData, missedData] = await Promise.all([
          fetchSignals("recent"),
          fetchSignals("lowest"), // Updated from "low_entry"
          fetchSignals("missed"),
        ]);
        if (!alive) return;
        setRecent(recentData); 
        setLowest(lowestData); 
        setMissed(missedData);
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
          <SignalList items={lowest} emptyText="No low-entry opportunities found." />
        </div>
      </div>

      {/* Row 2 — PAGE ENDS AFTER THIS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-2 text-sm text-gray-400">Missed Opportunities</div>
          <SignalList items={missed} emptyText="No missed opportunities detected." />
        </div>
        <div>
          <div className="mb-2 text-sm text-gray-400">Lowest Price Opportunities</div>
          <SignalList items={lowest} emptyText="No symbols near lowest price detected." />
        </div>
      </div>
    </div>
  );
}