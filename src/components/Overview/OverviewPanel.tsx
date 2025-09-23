import { useQuery } from "@tanstack/react-query";
import TradeSignalsTable from "./TradeSignalsTable";
import SignalList from "./SignalList";
import { SignalsService, UnifiedSignal, SignalType } from "@/services/signalsService";

export default function OverviewPanel() {
  // Use React Query for unified data pipeline with caching/invalidation
  const { data: recent = [], isLoading: recentLoading } = useQuery({
    queryKey: ['signals', 'recent'],
    queryFn: () => SignalsService.fetchSignals("recent"),
    staleTime: 30_000,
    refetchInterval: 60_000, // Refetch every minute
  });

  const { data: lowEntry = [], isLoading: lowEntryLoading } = useQuery({
    queryKey: ['signals', 'low_entry'],
    queryFn: () => SignalsService.fetchSignals("low_entry"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: missed = [], isLoading: missedLoading } = useQuery({
    queryKey: ['signals', 'missed'],
    queryFn: () => SignalsService.fetchSignals("missed"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: lowPrice = [], isLoading: lowPriceLoading } = useQuery({
    queryKey: ['signals', 'lowest'],
    queryFn: () => SignalsService.fetchSignals("lowest"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const loading = recentLoading || lowEntryLoading || missedLoading || lowPriceLoading;

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