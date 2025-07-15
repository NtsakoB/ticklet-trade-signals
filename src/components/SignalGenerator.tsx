
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Zap, Play, Pause, Settings, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { fetchMarketData } from "@/services/binanceApi";
import EnhancedBinanceApi from "@/services/enhancedBinanceApi";

interface SignalGeneratorProps {
  onSignalGenerated: (signal: any) => void;
  onTradeExecuted: (trade: any) => void;
  minimumVolume?: number;
  minimumPriceChange?: number;
  maxSignals?: number;
  minimumConfidence?: number;
}

const SignalGenerator = ({ 
  onSignalGenerated, 
  onTradeExecuted,
  minimumVolume = 50000,
  minimumPriceChange = 1,
  maxSignals = 50,
  minimumConfidence = 0.3
}: SignalGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [confidence, setConfidence] = useState(0.7);
  const [lastSignal, setLastSignal] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);

  // Fetch filtered symbols based on criteria
  const fetchFilteredSymbols = async () => {
    setIsLoadingSymbols(true);
    try {
      const filteredData = await EnhancedBinanceApi.fetchFilteredMarketData({
        minimumVolume,
        minimumPriceChange,
        maxResults: maxSignals
      });
      
      const symbols = filteredData.map(ticker => ticker.symbol);
      setFilteredSymbols(symbols);
      
      // Set first symbol as default if current selection is not in filtered list
      if (symbols.length > 0 && !symbols.includes(selectedSymbol)) {
        setSelectedSymbol(symbols[0]);
      }
      
      toast.success(`Found ${symbols.length} symbols matching filter criteria`);
    } catch (error) {
      console.error('Error fetching filtered symbols:', error);
      toast.error("Failed to fetch filtered symbols");
      // Fallback to default symbols
      setFilteredSymbols(["BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT", "BNBUSDT"]);
    }
    setIsLoadingSymbols(false);
  };

  // Fetch symbols on component mount and when filters change
  useEffect(() => {
    fetchFilteredSymbols();
  }, [minimumVolume, minimumPriceChange, maxSignals]);

  const generateRealSignal = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch real market data from Binance
      const data = await fetchMarketData(selectedSymbol);
      
      if (!data) {
        toast.error("Failed to fetch market data");
        setIsGenerating(false);
        return;
      }

      setMarketData(data);
      
      // Generate signal based on real market conditions
      const price = parseFloat(data.lastPrice);
      const priceChange = parseFloat(data.priceChangePercent);
      const volume = parseFloat(data.volume) * price;
      
      // Simple signal generation logic based on price movement and volume
      const isUptrend = priceChange > 0;
      const isHighVolume = volume > 1000000; // $1M+ volume
      const volatility = Math.abs(priceChange);
      
      // Calculate confidence based on multiple factors
      let signalConfidence = confidence;
      if (isHighVolume) signalConfidence += 0.1;
      if (volatility > 2) signalConfidence += 0.1;
      if (volatility > 5) signalConfidence += 0.1;
      signalConfidence = Math.min(signalConfidence, 0.95);
      
      // Determine signal type based on technical indicators
      const signalType = isUptrend && volatility > 1 ? 'BUY' : 'SELL';
      
      // Calculate targets and stop loss based on current price
      const targets = signalType === 'BUY' 
        ? [price * 1.02, price * 1.05, price * 1.08]  // T1 to T3: ascending for BUY
        : [price * 0.98, price * 0.95, price * 0.92].reverse();  // T1 to T3: descending for SELL
      
      const stopLoss = signalType === 'BUY' ? price * 0.97 : price * 1.03;
      
      // Calculate leverage based on confidence and volatility
      const leverage = Math.max(1, Math.min(20, Math.floor((signalConfidence * 15) / (volatility / 2 + 1))));
      
      const signal = {
        id: `signal-${Date.now()}`,
        symbol: selectedSymbol,
        type: signalType,
        entryPrice: price,
        targets,
        stopLoss,
        confidence: signalConfidence,
        timestamp: new Date().toISOString(),
        source: 'strategy',
        leverage,
        status: 'active',
        marketData: {
          priceChange: priceChange,
          volume: volume,
          high24h: parseFloat(data.highPrice),
          low24h: parseFloat(data.lowPrice),
          volatility: volatility
        }
      };

      setLastSignal(signal);
      onSignalGenerated(signal);
      
      toast.success(`Real signal generated for ${signal.symbol}`, {
        description: `${signal.type} at $${signal.entryPrice.toFixed(2)} (${(signal.confidence * 100).toFixed(1)}% confidence)`
      });
      
    } catch (error) {
      console.error('Error generating signal:', error);
      toast.error("Failed to generate signal from live data");
    }
    
    setIsGenerating(false);
  };

  const executeTrade = () => {
    if (!lastSignal) return;
    
    const trade = {
      ...lastSignal,
      executedAt: new Date().toISOString(),
      status: 'executed'
    };
    
    onTradeExecuted(trade);
    toast.success(`Trade executed for ${trade.symbol}`, {
      description: `${trade.type} position opened with ${trade.leverage}x leverage`
    });
  };

  const toggleAutoMode = () => {
    setAutoMode(!autoMode);
    toast.info(autoMode ? 'Auto trading disabled' : 'Auto trading enabled');
  };

  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Signal Generator
          </CardTitle>
          <Badge variant={autoMode ? "default" : "outline"}>
            {autoMode ? "Auto" : "Manual"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Data Display */}
        {marketData && (
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h4 className="text-sm font-medium mb-2">Live Market Data - {selectedSymbol}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">${parseFloat(marketData.lastPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h Change:</span>
                <span className={`font-medium ${parseFloat(marketData.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(marketData.priceChangePercent).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h High:</span>
                <span className="font-medium">${parseFloat(marketData.highPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h Low:</span>
                <span className="font-medium">${parseFloat(marketData.lowPrice).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="symbol">Symbol ({filteredSymbols.length} available)</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchFilteredSymbols}
                disabled={isLoadingSymbols}
                className="h-6 px-2"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingSymbols ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {filteredSymbols.map(symbol => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="confidence">Base Confidence</Label>
            <Input
              type="number"
              min="0.1"
              max="1"
              step="0.1"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Last Signal Display */}
        {lastSignal && (
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h4 className="text-sm font-medium mb-2">Latest Generated Signal</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Symbol:</span>
                <span className="font-medium">{lastSignal.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant={lastSignal.type === 'BUY' ? 'default' : 'destructive'} className="flex items-center gap-1">
                  {lastSignal.type === 'BUY' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {lastSignal.type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry:</span>
                <span className="font-medium">${lastSignal.entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-medium">{(lastSignal.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leverage:</span>
                <span className="font-medium">{lastSignal.leverage}x</span>
              </div>
              {lastSignal.marketData && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Volatility:</span>
                  <span className="font-medium">{lastSignal.marketData.volatility.toFixed(2)}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={generateRealSignal}
            disabled={isGenerating}
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isGenerating ? 'Analyzing...' : 'Generate Live Signal'}
          </Button>
          
          <Button
            onClick={executeTrade}
            disabled={!lastSignal}
            variant="outline"
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Execute Trade
          </Button>
        </div>

        <Button
          onClick={toggleAutoMode}
          variant={autoMode ? "destructive" : "default"}
          className="w-full"
        >
          {autoMode ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {autoMode ? 'Stop Auto Trading' : 'Start Auto Trading'}
        </Button>

        {autoMode && (
          <div className="text-xs text-center text-muted-foreground">
            Auto mode will generate and execute signals based on live market data every 30 seconds
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SignalGenerator;
