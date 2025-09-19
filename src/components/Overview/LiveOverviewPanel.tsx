import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import LiveSignalsTable from "../LiveSignalsTable";
import { LiveStatsCards } from "../LiveStatsCards";
import { SignalsService, UnifiedSignal } from "@/services/signalsService";

export default function LiveOverviewPanel() {
  const [selectedSignal, setSelectedSignal] = useState<UnifiedSignal | null>(null);
  const [activeTab, setActiveTab] = useState<'active'|'recent'|'missed'|'lowest'>('active');

  const handleGenerateSignal = async () => {
    try {
      const r = await SignalsService.generateSignal();
      const msg = r.emitted.length ? `New signal generated for ${r.emitted.join(', ')}` :
                r.missed.length ? `Signal for ${r.missed.join(', ')} didn't pass filters` :
                'No signals generated';
      alert(msg);
    } catch {
      alert('Failed to generate signal');
    }
  };

  return (
    <div className="space-y-6">
      <LiveStatsCards refreshInterval={30000} />

      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" /> Signal Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Generate a new trading signal using current market data</p>
            <p className="text-xs text-muted-foreground">Signals are filtered through volume, confidence, and risk parameters</p>
          </div>
          <Button onClick={handleGenerateSignal} className="shrink-0">
            <TrendingUp className="w-4 h-4 mr-2" /> Generate Signal
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="active" className="flex items-center gap-2"><Activity className="w-4 h-4" />Active</TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Recent</TabsTrigger>
          <TabsTrigger value="missed" className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Missed</TabsTrigger>
          <TabsTrigger value="lowest" className="flex items-center gap-2"><TrendingDown className="w-4 h-4" />Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <LiveSignalsTable type="active" refreshInterval={15000} onSignalClick={setSelectedSignal} showFilters />
        </TabsContent>
        <TabsContent value="recent" className="space-y-4">
          <LiveSignalsTable type="recent" refreshInterval={30000} onSignalClick={setSelectedSignal} showFilters />
        </TabsContent>
        <TabsContent value="missed" className="space-y-4">
          <LiveSignalsTable type="missed" refreshInterval={60000} onSignalClick={setSelectedSignal} showFilters={false} />
        </TabsContent>
        <TabsContent value="lowest" className="space-y-4">
          <LiveSignalsTable type="lowest" refreshInterval={30000} onSignalClick={setSelectedSignal} showFilters />
        </TabsContent>
      </Tabs>

      {selectedSignal && (
        <Card className="bg-gradient-to-r from-gray-900/60 to-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Signal Details: {selectedSignal.symbol}
                <span className="text-xs px-2 py-0.5 rounded border border-gray-600">{selectedSignal.subtitle}</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSignal(null)}>×</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Current Price</p>
                <p className="text-lg font-bold">${selectedSignal.price.toFixed(4)}</p>
                <p className={`text-sm ${selectedSignal.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedSignal.change_pct >= 0 ? '+' : ''}{selectedSignal.change_pct.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Entry Range</p>
                <p className="text-sm font-medium">
                  ${selectedSignal.entry_low.toFixed(4)} - ${selectedSignal.entry_high.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stop Loss</p>
                <p className="text-sm font-medium text-red-400">
                  {selectedSignal.stop_loss > 0 ? `$${selectedSignal.stop_loss.toFixed(4)}` : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">{selectedSignal.confidence}%</p>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${
                      selectedSignal.confidence >= 70 ? 'bg-green-500' :
                      selectedSignal.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{ width: `${selectedSignal.confidence}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {(selectedSignal.targets || []).filter(t => t > 0).length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Take Profit Targets</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSignal.targets.filter(t => t > 0).map((t, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded border border-green-400/30 text-green-400">TP{i+1}: ${t.toFixed(4)}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}