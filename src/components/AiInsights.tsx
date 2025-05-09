
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";

interface InsightItem {
  id: string;
  category: 'success' | 'mistake' | 'improvement';
  title: string;
  description: string;
  timestamp: string;
}

// Mock data for AI insights
const mockInsights: InsightItem[] = [
  {
    id: '1',
    category: 'success',
    title: 'Pattern Recognition Optimized',
    description: 'Successfully identified recurring reversal patterns in high-volume altcoins, resulting in 3.2% higher accuracy in trade entries.',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    category: 'mistake',
    title: 'Premature Position Exits',
    description: 'Model exited BNB positions too early due to volatility misclassification. Adjusting risk tolerance parameters.',
    timestamp: new Date().toISOString()
  },
  {
    id: '3',
    category: 'improvement',
    title: 'Volume Analysis Enhancement',
    description: 'Implemented weighted volume analysis to prioritize high liquidity markets, filtering out 15% of false signals.',
    timestamp: new Date().toISOString()
  },
  {
    id: '4',
    category: 'success',
    title: 'Sentiment Analysis Integration',
    description: 'Successfully integrated real-time social media sentiment scoring, improving entry timing by 12%.',
    timestamp: new Date().toISOString()
  },
  {
    id: '5',
    category: 'improvement',
    title: 'Leverage Optimization',
    description: 'Dynamic leverage scaling implemented based on volatility metrics. Position sizing now adjusts automatically to market conditions.',
    timestamp: new Date().toISOString()
  },
  {
    id: '6',
    category: 'mistake',
    title: 'False Correlation Detected',
    description: 'Model incorrectly associated BTC movement with specific altcoin patterns. Correlation thresholds adjusted.',
    timestamp: new Date().toISOString()
  },
];

const AiInsights = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'success' | 'mistake' | 'improvement'>('all');
  
  const filteredInsights = mockInsights.filter(insight => 
    selectedCategory === 'all' || insight.category === selectedCategory
  );

  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-muted-foreground" />
            <CardTitle>AI Learning Insights</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge 
              variant={selectedCategory === 'all' ? 'default' : 'outline'} 
              className="cursor-pointer" 
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Badge>
            <Badge 
              variant={selectedCategory === 'success' ? 'success' : 'outline'} 
              className="cursor-pointer" 
              onClick={() => setSelectedCategory('success')}
            >
              Success
            </Badge>
            <Badge 
              variant={selectedCategory === 'mistake' ? 'destructive' : 'outline'} 
              className="cursor-pointer" 
              onClick={() => setSelectedCategory('mistake')}
            >
              Mistakes
            </Badge>
            <Badge 
              variant={selectedCategory === 'improvement' ? 'secondary' : 'outline'} 
              className="cursor-pointer" 
              onClick={() => setSelectedCategory('improvement')}
            >
              Improvements
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredInsights.map(insight => (
            <div 
              key={insight.id} 
              className="border border-gray-800 rounded-md p-4 bg-gray-900"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      insight.category === 'success' ? 'success' :
                      insight.category === 'mistake' ? 'destructive' : 'secondary'
                    }
                  >
                    {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                  </Badge>
                  <h4 className="font-medium">{insight.title}</h4>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(insight.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{insight.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AiInsights;
