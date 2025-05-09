
import { Card, CardContent } from '@/components/ui/card';
import { CircleDollarSign } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// Mock balance history data
const balanceHistory = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  balance: 10000 + (i * 500) + (Math.random() * 1000 - 500)
}));

interface TotalBalanceProps {
  balance: number;
}

const TotalBalance = ({ balance }: TotalBalanceProps) => {
  // Calculate change
  const startBalance = balanceHistory[0].balance;
  const changeAmount = balance - startBalance;
  const changePercent = (changeAmount / startBalance) * 100;
  
  return (
    <Card className="bg-trading-card border-gray-800">
      <CardContent className="pt-6">
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
          </div>
          <div className="h-12 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceHistory}>
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
