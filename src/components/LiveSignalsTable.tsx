import { useMemo, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { SignalsService, UnifiedSignal, SignalType } from "@/services/signalsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Filter } from "lucide-react";

export default function LiveSignalsTable({
  type,
  title,
  refreshInterval = 15000,
  maxHeight = "28rem",
  showFilters = true,
  onSignalClick
}: {
  type: SignalType; title?: string; refreshInterval?: number; maxHeight?: string; showFilters?: boolean; onSignalClick?: (signal: UnifiedSignal) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [volumeFilter, setVolumeFilter] = useState(0);

  const { data: signals = [], isLoading, isError, refetch } = useQuery<UnifiedSignal[]>({
    queryKey: ['signals', type],
    queryFn: () => SignalsService.fetchSignals(type),
    refetchInterval: refreshInterval,
    retry: 2,
    retryDelay: 1000,
  });

  const filtered = useMemo(() => {
    const safeSignals = Array.isArray(signals) ? signals : [];
    return safeSignals.filter(s => {
      const q = searchQuery.trim().toLowerCase();
      if (q && !(`${s.symbol} ${s.title} ${s.subtitle}`.toLowerCase().includes(q))) return false;
      if (confidenceFilter > 0 && s.confidence < confidenceFilter) return false;
      if (volumeFilter > 0 && s.volume < volumeFilter) return false;
      return true;
    });
  }, [signals, searchQuery, confidenceFilter, volumeFilter]);

  const displayTitle = title || ({
    active: 'Active Signals', recent: 'Recent Signals', missed: 'Missed Opportunities', lowest: 'Lowest Price Alerts',
    trade: 'Trade Signals', low_entry: 'Low Entry Opportunities', low_price: 'Price Drop Alerts'
  } as Record<SignalType,string>)[type] || type;

  if (isError) {
    return (
      <Card className="bg-red-900/20 border-red-800">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            {displayTitle} - Error
            <Button size="sm" variant="outline" onClick={() => refetch()} className="ml-auto">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent><p className="text-red-300 text-sm">Failed to load signals.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#111827] border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {displayTitle}
            <Badge variant="outline" className="ml-2">{isLoading ? "..." : filtered.length}</Badge>
            {!isLoading && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2"></div>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isLoading} className="h-8 w-8 p-0">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbols..." className="bg-gray-800 text-sm rounded px-2 py-1 flex-1 min-w-0 border-none focus:ring-1 focus:ring-blue-600" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(Number(e.target.value))}
                className="bg-gray-800 text-sm rounded px-2 py-1 border-none focus:ring-1 focus:ring-blue-600">
                <option value={0}>All Confidence</option>
                <option value={50}>50%+</option>
                <option value={70}>70%+</option>
                <option value={85}>85%+</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select value={volumeFilter} onChange={(e) => setVolumeFilter(Number(e.target.value))}
                className="bg-gray-800 text-sm rounded px-2 py-1 border-none focus:ring-1 focus:ring-blue-600">
                <option value={0}>All Volume</option>
                <option value={100000}>$100K+</option>
                <option value={500000}>$500K+</option>
                <option value={1000000}>$1M+</option>
              </select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-auto rounded-lg border border-gray-800 mx-4 mb-4" style={{ maxHeight }}>
          <div className="grid grid-cols-7 text-xs text-gray-400 px-3 py-2 sticky top-0 bg-[#0f172a] border-b border-gray-800">
            <div>Symbol</div><div>Type</div><div>Entry</div><div>Targets</div><div>Stop</div><div>Confidence</div><div>Change</div>
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading signals...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery || confidenceFilter || volumeFilter ? "No signals match your filters" : `No ${type} signals available`}
            </div>
          ) : (
            filtered.map(s => {
              const formattedEntry = s.entry_low && s.entry_high ? `$${s.entry_low.toFixed(4)} - $${s.entry_high.toFixed(4)}`
                : s.price ? `$${s.price.toFixed(4)}` : 'TBD';
              const targets = (s.targets || []).filter(t => t > 0);
              const formattedTargets = targets.length ? targets.slice(0,3).map((t,i)=>`T${i+1}: $${t.toFixed(4)}`).join(' • ') : 'TBD';
              const stop = s.stop_loss > 0 ? `$${s.stop_loss.toFixed(4)}` : 'TBD';
              const confClass = s.confidence >= 70 ? 'text-green-400' : s.confidence >= 50 ? 'text-yellow-400' : 'text-red-400';
              const chgClass = s.change_pct > 0 ? 'text-green-400' : s.change_pct < 0 ? 'text-red-400' : 'text-gray-400';

              return (
                <div key={s.id} className="grid grid-cols-7 px-3 py-3 text-sm border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <div className="font-medium flex items-center gap-2">
                    {s.symbol}
                    {s.tags?.includes('Low Risk Entry') && (
                      <span className="text-xs px-1 py-0 text-green-400 border border-green-400/30 rounded">LR</span>
                    )}
                  </div>
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${s.subtitle.includes('LONG') || s.subtitle.includes('BUY') ? 'border-green-400/40 text-green-300' : 'border-blue-400/30 text-blue-300'}`}>
                      {s.subtitle}
                    </span>
                  </div>
                  <div className="text-xs text-blue-300 truncate" title={formattedEntry}>{formattedEntry}</div>
                  <div className="text-xs text-green-300 truncate" title={formattedTargets}>{formattedTargets}</div>
                  <div className="text-xs text-red-300 truncate" title={stop}>{stop}</div>
                  <div className={`text-xs font-medium ${confClass}`}>{s.confidence}%</div>
                  <div className={`text-xs font-medium ${chgClass}`}>{s.change_pct > 0 ? '+' : ''}{s.change_pct.toFixed(2)}%</div>
                </div>
              );
            })
          )}
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="px-4 pb-3 text-xs text-muted-foreground flex justify-between items-center border-t border-gray-800 pt-2">
            <span>Showing {filtered.length} of {Array.isArray(signals) ? signals.length : 0} signals</span>
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}