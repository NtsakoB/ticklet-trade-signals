import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import MarketSummaryService, { MarketSummaryData } from "@/services/marketSummaryService";
import { RefreshCw, TrendingUp, TrendingDown, Copy } from "lucide-react";
import { toast } from "sonner";

const MarketSummary = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: marketSummary, isLoading, refetch } = useQuery({
    queryKey: ['marketSummary'],
    queryFn: MarketSummaryService.generateMarketSummary,
    refetchInterval: autoRefresh ? 300000 : false, // 5 minutes
    refetchOnWindowFocus: false
  });

  const handleRefresh = () => {
    refetch();
    toast.success("Market summary refreshed");
  };

  const copyToClipboard = () => {
    if (marketSummary) {
      const telegramText = MarketSummaryService.formatForTelegram(marketSummary);
      navigator.clipboard.writeText(telegramText);
      toast.success("Market summary copied to clipboard");
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Bullish": return "text-green-400";
      case "Bearish": return "text-red-400";
      default: return "text-yellow-400";
    }
  };

  const getSentimentBadgeVariant = (sentiment: string) => {
    switch (sentiment) {
      case "Bullish": return "default";
      case "Bearish": return "destructive";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-trading-card border-gray-800">
        <CardHeader>
          <CardTitle>Market Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!marketSummary) {
    return (
      <Card className="bg-trading-card border-gray-800">
        <CardHeader>
          <CardTitle>Market Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load market data</p>
            <Button onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card className="bg-trading-card border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Market Summary</CardTitle>
            <CardDescription>Real-time market overview and sentiment analysis</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy for Telegram
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Market Sentiment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Market Sentiment</h3>
              <div className="flex items-center gap-3">
                <Badge variant={getSentimentBadgeVariant(marketSummary.marketSentiment.overall)}>
                  {marketSummary.marketSentiment.overall}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {(marketSummary.marketSentiment.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {marketSummary.marketSentiment.description}
              </p>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">BTC Dominance</p>
                  <p className="text-lg font-semibold">{marketSummary.keyMetrics.btcDominance.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ETH Dominance</p>
                  <p className="text-lg font-semibold">{marketSummary.keyMetrics.ethDominance.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-lg font-semibold">${(marketSummary.keyMetrics.volume24h / 1e9).toFixed(1)}B</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <p className="text-lg font-semibold">${(marketSummary.keyMetrics.totalMarketCap / 1e12).toFixed(1)}T</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Movers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Gainers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold">Top Gainers</h3>
              </div>
              <div className="space-y-2">
                {marketSummary.topMovers.gainers.map((gainer, index) => (
                  <div key={gainer.symbol} className="flex items-center justify-between p-2 rounded bg-green-900/20 border border-green-800/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{gainer.symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">+{gainer.changePercent.toFixed(2)}%</p>
                      <p className="text-sm text-muted-foreground">${gainer.price.toFixed(4)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-semibold">Top Losers</h3>
              </div>
              <div className="space-y-2">
                {marketSummary.topMovers.losers.map((loser, index) => (
                  <div key={loser.symbol} className="flex items-center justify-between p-2 rounded bg-red-900/20 border border-red-800/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{loser.symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-semibold">{loser.changePercent.toFixed(2)}%</p>
                      <p className="text-sm text-muted-foreground">${loser.price.toFixed(4)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Events */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Key Market Events</h3>
            <div className="space-y-2">
              {marketSummary.keyEvents.map((event, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded bg-secondary/50">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p className="text-sm">{event}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketSummary;