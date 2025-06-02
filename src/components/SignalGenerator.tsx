
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Zap, Play, Pause, Settings } from "lucide-react";

interface SignalGeneratorProps {
  onSignalGenerated: (signal: any) => void;
  onTradeExecuted: (trade: any) => void;
}

const SignalGenerator = ({ onSignalGenerated, onTradeExecuted }: SignalGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [confidence, setConfidence] = useState(0.7);
  const [lastSignal, setLastSignal] = useState<any>(null);

  const symbols = [
    "BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT", "BNBUSDT",
    "ADAUSDT", "DOGEUSDT", "DOTUSDT", "MATICUSDT", "LINKUSDT"
  ];

  const generateSignal = async () => {
    setIsGenerating(true);
    
    // Simulate signal generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const signal = {
      id: `signal-${Date.now()}`,
      symbol: selectedSymbol,
      type: Math.random() > 0.5 ? 'BUY' : 'SELL',
      entryPrice: 45000 + (Math.random() * 10000),
      targets: [46000, 47000, 48000],
      stopLoss: 43000,
      confidence: confidence + (Math.random() * 0.2 - 0.1),
      timestamp: new Date().toISOString(),
      source: 'strategy',
      leverage: Math.floor(Math.random() * 10) + 1,
      status: 'active'
    };

    setLastSignal(signal);
    onSignalGenerated(signal);
    setIsGenerating(false);
    
    toast.success(`Signal generated for ${signal.symbol}`, {
      description: `${signal.type} at $${signal.entryPrice.toFixed(2)} (${(signal.confidence * 100).toFixed(1)}% confidence)`
    });
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
      description: `${trade.type} position opened`
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
            Signal Generator
          </CardTitle>
          <Badge variant={autoMode ? "default" : "outline"}>
            {autoMode ? "Auto" : "Manual"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="symbol">Symbol</Label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {symbols.map(symbol => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="confidence">Min Confidence</Label>
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
            <h4 className="text-sm font-medium mb-2">Last Generated Signal</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Symbol:</span>
                <span className="font-medium">{lastSignal.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant={lastSignal.type === 'BUY' ? 'success' : 'destructive'}>
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
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={generateSignal}
            disabled={isGenerating}
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Signal'}
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
            Auto mode will generate and execute signals automatically
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SignalGenerator;
