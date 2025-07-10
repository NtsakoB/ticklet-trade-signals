import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import AIStrategyOptimizer, { StrategyOptimization, ParameterSuggestion } from '@/services/aiStrategyOptimizer';

const AiStrategyOptimization = () => {
  const [optimization, setOptimization] = useState<StrategyOptimization | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadOptimizationData();
  }, []);

  const loadOptimizationData = () => {
    try {
      const report = AIStrategyOptimizer.generateOptimizationReport();
      setOptimization(report);
      setLastUpdate(new Date(report.lastAnalysisDate).toLocaleString());
    } catch (error) {
      console.error('Error generating optimization report:', error);
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis time for better UX
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    loadOptimizationData();
    setIsAnalyzing(false);
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'hsl(var(--chart-2))';
    if (confidence >= 0.5) return 'hsl(var(--chart-3))';
    return 'hsl(var(--chart-4))';
  };

  const renderSuggestionCard = (suggestion: ParameterSuggestion) => (
    <Card key={suggestion.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(suggestion.priority)}>
              {suggestion.priority}
            </Badge>
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getConfidenceColor(suggestion.confidence) }}
              />
              <span className="text-sm text-muted-foreground">
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
        <CardDescription>{suggestion.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current</p>
              <p className="text-sm">{suggestion.currentValue}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Suggested</p>
              <p className="text-sm font-medium text-primary">{suggestion.suggestedValue}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Reasoning</p>
            <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-chart-2" />
            <span className="font-medium text-chart-2">{suggestion.expectedImprovement}</span>
          </div>
          
          <Progress value={suggestion.confidence * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );

  if (!optimization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Strategy Optimization
          </CardTitle>
          <CardDescription>
            Analyzing trading performance to suggest improvements...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { performanceMetrics, parameterSuggestions, strategicRefinements } = optimization;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Strategy Optimization
              </CardTitle>
              <CardDescription>
                AI-powered analysis of your trading performance with actionable suggestions
              </CardDescription>
            </div>
            <Button onClick={runAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {lastUpdate}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{performanceMetrics.totalTrades}</div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-2">
                {performanceMetrics.winRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-3">
                {performanceMetrics.profitFactor.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Profit Factor</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-4">
                {performanceMetrics.averageTradeDuration.toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Best Performing Pair:</span>
              <span className="ml-2 font-medium">{performanceMetrics.bestPerformingPair}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Worst Performing Pair:</span>
              <span className="ml-2 font-medium">{performanceMetrics.worstPerformingPair}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sharpe Ratio:</span>
              <span className="ml-2 font-medium">{performanceMetrics.sharpeRatio.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Drawdown:</span>
              <span className="ml-2 font-medium">{performanceMetrics.maxDrawdown.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      <Tabs defaultValue="parameters" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parameters" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Parameter Tweaks ({parameterSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="strategic" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Strategic Refinements ({strategicRefinements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Parameter Optimization Suggestions
              </CardTitle>
              <CardDescription>
                Specific parameter adjustments based on historical performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parameterSuggestions.length > 0 ? (
                <div>
                  {parameterSuggestions.map(renderSuggestionCard)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-chart-2 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Parameters Look Good!</h3>
                  <p className="text-muted-foreground">
                    No immediate parameter optimizations suggested based on current performance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Strategic Refinements
              </CardTitle>
              <CardDescription>
                Broader strategy improvements for enhanced performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strategicRefinements.length > 0 ? (
                <div>
                  {strategicRefinements.map(renderSuggestionCard)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-chart-2 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Strategy is Well-Optimized!</h3>
                  <p className="text-muted-foreground">
                    No immediate strategic refinements suggested based on current performance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AiStrategyOptimization;