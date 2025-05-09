
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CircleDollarSign } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface TotalBalanceProps {
  balance: number;
  startingBalance?: number;
  performanceHistory?: Array<{
    date: string;
    balance: number;
  }>;
}

const TotalBalance = ({ balance, startingBalance = 10000, performanceHistory = [] }: TotalBalanceProps) => {
  // Format data for chart
  const chartData = performanceHistory.length > 0 
    ? performanceHistory.map(day => ({
        date: day.date,
        balance: day.balance
      }))
    : Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        balance: 10000 + (i * 500) + (Math.random() * 1000 - 500)
      }));
  
  // Calculate change
  const changeAmount = balance - startingBalance;
  const changePercent = (changeAmount / startingBalance) * 100;
  
  // Tab state for timeframe selection
  const [timeframe, setTimeframe] = useState<"1w" | "1m" | "3m" | "ytd" | "all">("1m");
  
  // Filter data based on selected timeframe
  const getFilteredData = () => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeframe) {
      case "1w":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "1m":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "ytd":
        cutoffDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "all":
      default:
        return chartData;
    }
    
    // Filter data based on cutoff date
    return chartData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  };
  
  const filteredData = getFilteredData();
  
  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader className="pb-0">
        <Tabs defaultValue="1m" value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList className="bg-gray-800">
            <TabsTrigger value="1w">1W</TabsTrigger>
            <TabsTrigger value="1m">1M</TabsTrigger>
            <TabsTrigger value="3m">3M</TabsTrigger>
            <TabsTrigger value="ytd">YTD</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Balance</p>
            </div>
            <h3 className="text-2xl font-bold mt-1">${balance.toLocaleString()}</h3>
            <p className={`text-xs ${changeAmount >= 0 ? 'text-trading-positive' : 'text-trading-negative'} mt-1`}>
              {changeAmount >= 0 ? '+' : ''}{changeAmount.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Starting: ${startingBalance.toLocaleString()}
            </p>
          </div>
          <div className="h-24 w-2/3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <XAxis dataKey="date" hide={true} />
                <Tooltip 
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Balance']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke={changeAmount >= 0 ? "#10b981" : "#ef4444"} 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalBalance;
