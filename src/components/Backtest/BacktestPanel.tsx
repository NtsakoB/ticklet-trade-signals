import { useState, useEffect } from "react";
import { runBacktest, getBacktestResult, listBacktestResults, BacktestSummary, BacktestResult, BacktestParams } from "@/services/backtestApi";
import { useTradeModeStore } from "@/state/tradeModeStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export default function BacktestPanel() {
  const strategy = useTradeModeStore((s) => s.strategy);
  
  // Backtest parameters
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [minVolume, setMinVolume] = useState(50000);
  const [minConfidence, setMinConfidence] = useState(30);
  const [maxSignals, setMaxSignals] = useState(100);
  
  // State
  const [running, setRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<BacktestSummary | null>(null);
  const [detailResult, setDetailResult] = useState<BacktestResult | null>(null);
  const [showTrades, setShowTrades] = useState(false);
  const [historicalResults, setHistoricalResults] = useState<BacktestSummary[]>([]);

  useEffect(() => {
    loadHistoricalResults();
  }, []);

  const loadHistoricalResults = async () => {
    try {
      const results = await listBacktestResults();
      setHistoricalResults(results);
    } catch (error) {
      console.error("Failed to load historical results:", error);
    }
  };

  const startBacktest = async () => {
    setRunning(true);
    setDetailResult(null);
    setShowTrades(false);
    
    const params: BacktestParams = {
      strategy,
      symbol,
      interval,
      min_volume: minVolume,
      min_confidence: minConfidence,
      max_signals: maxSignals,
    };

    try {
      const response = await runBacktest(params);
      setCurrentResult(response.summary);
      toast.success(`Backtest completed! ${response.summary.executed} trades, ${(response.summary.win_rate * 100).toFixed(1)}% win rate`);
      await loadHistoricalResults(); // Refresh historical results
    } catch (error) {
      console.error("Backtest failed:", error);
      toast.error(`Backtest failed: ${error}`);
    } finally {
      setRunning(false);
    }
  };

  const loadTradeDetails = async () => {
    if (!currentResult?.id) return;
    
    try {
      const fullResult = await getBacktestResult(currentResult.id);
      setDetailResult(fullResult);
      setShowTrades(true);
    } catch (error) {
      console.error("Failed to load trade details:", error);
      toast.error("Failed to load trade details");
    }
  };

  const loadHistoricalResult = async (resultId: string) => {
    try {
      const fullResult = await getBacktestResult(resultId);
      setCurrentResult(fullResult);
      setDetailResult(fullResult);
      setShowTrades(true);
    } catch (error) {
      console.error("Failed to load historical result:", error);
      toast.error("Failed to load historical result");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Backtest Configuration */}
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Backtest Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="BTCUSDT"
                className="bg-background/80"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interval">Timeframe</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger className="bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="30m">30m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-signals">Max Signals</Label>
              <Input
                id="max-signals"
                type="number"
                value={maxSignals}
                onChange={(e) => setMaxSignals(parseInt(e.target.value) || 100)}
                min="10"
                max="1000"
                className="bg-background/80"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Min Volume: {formatCurrency(minVolume)}</Label>
              <Slider
                value={[minVolume]}
                onValueChange={(value) => setMinVolume(value[0])}
                min={10000}
                max={500000}
                step={10000}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Min Confidence: {minConfidence}%</Label>
              <Slider
                value={[minConfidence]}
                onValueChange={(value) => setMinConfidence(value[0])}
                min={10}
                max={90}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={startBacktest} 
              disabled={running}
              className="flex-1"
            >
              {running ? "Running Backtest..." : "Run Backtest"}
            </Button>
            
            {currentResult && (
              <Button 
                variant="outline" 
                onClick={loadTradeDetails}
                disabled={showTrades}
              >
                {showTrades ? "Trades Loaded" : "View Trades"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {currentResult && (
        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Backtest Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              {currentResult.strategy} • {currentResult.symbol} • {currentResult.interval} • 
              {currentResult.leverage_used}x leverage
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Stat label="Executed" value={currentResult.executed} />
              <Stat label="Wins" value={currentResult.wins} color="text-green-400" />
              <Stat label="Losses" value={currentResult.losses} color="text-red-400" />
              <Stat 
                label="Win Rate" 
                value={formatPercentage(currentResult.win_rate)} 
                color={currentResult.win_rate > 0.6 ? "text-green-400" : currentResult.win_rate > 0.4 ? "text-yellow-400" : "text-red-400"}
              />
              <Stat 
                label="PnL" 
                value={formatCurrency(currentResult.pnl_abs)} 
                color={currentResult.pnl_abs > 0 ? "text-green-400" : "text-red-400"}
              />
              <Stat 
                label="Return" 
                value={`${currentResult.pnl_pct.toFixed(2)}%`} 
                color={currentResult.pnl_pct > 0 ? "text-green-400" : "text-red-400"}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Stat label="Profit Factor" value={currentResult.profit_factor.toFixed(2)} />
              <Stat label="Max Consecutive Wins" value={currentResult.max_consecutive_wins} />
              <Stat label="Max Consecutive Losses" value={currentResult.max_consecutive_losses} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Details Table */}
      {showTrades && detailResult && (
        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Trade Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-lg border border-border/50">
              <div className="grid grid-cols-9 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                <div>Side</div>
                <div>Entry</div>
                <div>Exit</div>
                <div>PnL</div>
                <div>PnL %</div>
                <div>Confidence</div>
                <div>ML Prob</div>
                <div>Exit Reason</div>
                <div>Hold</div>
              </div>
              
              {detailResult.trades.map((trade) => (
                <div key={trade.id} className="grid grid-cols-9 gap-2 px-4 py-2 text-sm border-b border-border/20 hover:bg-muted/30">
                  <div className={`font-medium ${trade.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.side.toUpperCase()}
                  </div>
                  <div>{trade.entry_price.toFixed(4)}</div>
                  <div>{trade.exit_price.toFixed(4)}</div>
                  <div className={trade.pnl_abs >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {formatCurrency(trade.pnl_abs)}
                  </div>
                  <div className={trade.pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {trade.pnl_pct.toFixed(2)}%
                  </div>
                  <div>{(trade.confidence * 100).toFixed(0)}%</div>
                  <div>{(trade.ml_win_probability * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">{trade.exit_reason}</div>
                  <div className="text-xs text-muted-foreground">{trade.hold_candles}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Results */}
      {historicalResults.length > 0 && (
        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Historical Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historicalResults.slice(0, 10).map((result) => (
                <div 
                  key={result.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => loadHistoricalResult(result.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">{result.strategy}</div>
                    <div className="text-xs text-muted-foreground">{result.symbol} • {result.interval}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(result.timestamp * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">{result.executed} trades</div>
                    <div className="text-sm">{formatPercentage(result.win_rate)} win rate</div>
                    <div className={`text-sm font-medium ${result.pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.pnl_pct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, color = "text-foreground" }: { label: string; value: any; color?: string }) {
  return (
    <div className="bg-muted/30 rounded-xl p-3 text-center">
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}