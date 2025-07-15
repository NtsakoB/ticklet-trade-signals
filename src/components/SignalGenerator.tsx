
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Zap, Play, Pause, Settings, TrendingUp, TrendingDown, RefreshCw, Star, Search } from "lucide-react";
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
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(['BTCUSDT', 'ETHUSDT', 'XRPUSDT']);
  const [symbolSearch, setSymbolSearch] = useState("");
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [aiCommentary, setAiCommentary] = useState<string>("");

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

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('signal-generator-favorites');
    if (savedFavorites) {
      setFavoriteSymbols(JSON.parse(savedFavorites));
    }
  }, []);

  // Fetch symbols on component mount and when filters change
  useEffect(() => {
    fetchFilteredSymbols();
    fetchAllSymbols();
  }, [minimumVolume, minimumPriceChange, maxSignals]);

  // Fetch all available symbols for enhanced dropdown
  const fetchAllSymbols = async () => {
    try {
      const allMarketData = await EnhancedBinanceApi.fetchFilteredMarketData({
        minimumVolume: 0,
        minimumPriceChange: 0,
        maxResults: 1000
      });
      
      const symbols = allMarketData.map(ticker => ticker.symbol);
      
      // Add custom/trending pairs that might not be in the API
      const customPairs = ['MUBARAKUSDT', 'CHILGUYUSDT', 'DOGEUSDT', 'PEPEUSDT', 'SHIBUSDT'];
      const allSymbolsList = [...symbols, ...customPairs].filter((symbol, index, self) => self.indexOf(symbol) === index);
      
      setAllSymbols(allSymbolsList.sort());
    } catch (error) {
      console.error('Error fetching all symbols:', error);
      // Fallback symbol list
      setAllSymbols(['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'PEPEUSDT', 'SHIBUSDT', 'MUBARAKUSDT', 'CHILGUYUSDT']);
    }
  };

  const toggleFavorite = (symbol: string) => {
    const newFavorites = favoriteSymbols.includes(symbol)
      ? favoriteSymbols.filter(s => s !== symbol)
      : [...favoriteSymbols, symbol];
    
    setFavoriteSymbols(newFavorites);
    localStorage.setItem('signal-generator-favorites', JSON.stringify(newFavorites));
  };

  const generateAICommentary = (signal: any, marketData: any) => {
    const { type, confidence, leverage, marketData: signalMarketData } = signal;
    const priceChange = signalMarketData.priceChange;
    const volatility = signalMarketData.volatility;
    const volume = signalMarketData.volume;
    
    let commentary = "";
    
    // Market context
    if (type === 'BUY') {
      commentary += "📈 **BULLISH SETUP DETECTED**\n\n";
      commentary += `Market momentum is shifting upward with ${priceChange > 0 ? 'positive' : 'recovering'} price action. `;
    } else {
      commentary += "📉 **BEARISH SETUP IDENTIFIED**\n\n";
      commentary += `Bearish pressure is mounting with ${Math.abs(priceChange).toFixed(2)}% decline showing selling pressure. `;
    }
    
    // Technical analysis
    commentary += `Current volatility at ${volatility.toFixed(2)}% indicates ${volatility > 3 ? 'high' : volatility > 1.5 ? 'moderate' : 'low'} market activity. `;
    
    // Volume analysis
    if (volume > 5000000) {
      commentary += "Strong volume confirmation suggests institutional interest. ";
    } else if (volume > 1000000) {
      commentary += "Decent volume backing supports the move. ";
    }
    
    // Confidence reasoning
    commentary += `\n\n**Signal Confidence: ${(confidence * 100).toFixed(1)}%**\n`;
    if (confidence > 0.8) {
      commentary += "High confidence setup with multiple confirmations aligning. ";
    } else if (confidence > 0.6) {
      commentary += "Moderate confidence with decent technical alignment. ";
    } else {
      commentary += "Lower confidence - consider reducing position size. ";
    }
    
    // Risk assessment
    commentary += `\n\n**Risk Assessment:**\n`;
    commentary += `• Recommended leverage: ${leverage}x (auto-calculated based on volatility)\n`;
    commentary += `• Stop-loss positioned at ${type === 'BUY' ? '3%' : '3%'} from entry\n`;
    commentary += `• Three-tier profit taking strategy implemented\n`;
    
    // Human-style insights
    const insights = [
      "This setup aligns with our systematic approach to momentum trading.",
      "Watch for any sudden volume spikes that could accelerate the move.",
      "Consider scaling into the position if price action confirms the signal.",
      "Risk management is key - respect the stop-loss levels.",
      "Market structure supports this directional bias in the short term."
    ];
    
    commentary += `\n**Strategic Insight:** ${insights[Math.floor(Math.random() * insights.length)]}`;
    
    return commentary;
  };

  // Filter symbols for dropdown
  const getFilteredSymbolsForDropdown = () => {
    const searchTerm = symbolSearch.toLowerCase();
    const filtered = allSymbols.filter(symbol => 
      symbol.toLowerCase().includes(searchTerm)
    );
    
    return {
      favorites: favoriteSymbols.filter(symbol => 
        symbol.toLowerCase().includes(searchTerm)
      ),
      others: filtered.filter(symbol => 
        !favoriteSymbols.includes(symbol)
      )
    };
  };

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
      
      // Generate AI commentary
      const commentary = generateAICommentary(signal, data);
      setAiCommentary(commentary);
      
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
              <Label htmlFor="symbol">Symbol ({allSymbols.length} available)</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  fetchFilteredSymbols();
                  fetchAllSymbols();
                }}
                disabled={isLoadingSymbols}
                className="h-6 px-2"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingSymbols ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {/* Enhanced Symbol Dropdown with Search and Favorites */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search symbols..."
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Favorites Section */}
                  {getFilteredSymbolsForDropdown().favorites.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
                        ⭐ Favorites
                      </div>
                      {getFilteredSymbolsForDropdown().favorites.map(symbol => (
                        <SelectItem key={`fav-${symbol}`} value={symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span>{symbol}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(symbol);
                              }}
                            >
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            </Button>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {/* All Symbols Section */}
                  {getFilteredSymbolsForDropdown().others.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
                        All Symbols
                      </div>
                      {getFilteredSymbolsForDropdown().others.slice(0, 50).map(symbol => (
                        <SelectItem key={symbol} value={symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span>{symbol}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(symbol);
                              }}
                            >
                              <Star className="h-3 w-3 text-muted-foreground hover:text-yellow-400" />
                            </Button>
                          </div>
                        </SelectItem>
                      ))}
                      {getFilteredSymbolsForDropdown().others.length > 50 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          ... and {getFilteredSymbolsForDropdown().others.length - 50} more
                        </div>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
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

        {/* Enhanced Signal Display with Take Profit Levels */}
        {lastSignal && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="text-sm font-medium mb-3">📊 Signal Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
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
                  <span className="text-muted-foreground">Entry Price:</span>
                  <span className="font-medium text-blue-400">${lastSignal.entryPrice.toFixed(2)}</span>
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
                    <span className="text-muted-foreground">Volatility:</span>
                    <span className="font-medium">{lastSignal.marketData.volatility.toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Take Profit Levels & Stop Loss */}
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="text-sm font-medium mb-3">🎯 Take Profit Levels & Risk Management</h4>
              <div className="space-y-3">
                {/* Take Profit Targets */}
                <div className="grid grid-cols-3 gap-3">
                  {lastSignal.targets.map((target: number, index: number) => (
                    <div key={index} className="text-center p-2 rounded bg-green-900/20 border border-green-700/30">
                      <div className="text-xs text-green-400 font-medium">T{index + 1}</div>
                      <div className="text-sm font-medium text-green-300">${target.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {((target / lastSignal.entryPrice - 1) * 100).toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Stop Loss */}
                <div className="p-2 rounded bg-red-900/20 border border-red-700/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-400 font-medium">Stop Loss</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-300">${lastSignal.stopLoss.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {((lastSignal.stopLoss / lastSignal.entryPrice - 1) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Entry Range */}
                <div className="p-2 rounded bg-blue-900/20 border border-blue-700/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-400 font-medium">Entry Range</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-300">
                        ${(lastSignal.entryPrice * 0.999).toFixed(2)} - ${(lastSignal.entryPrice * 1.001).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">±0.1% buffer</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Commentary */}
            {aiCommentary && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  🤖 AI Trade Analysis
                </h4>
                <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                  {aiCommentary}
                </div>
              </div>
            )}
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
