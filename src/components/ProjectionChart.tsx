
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformancePoint } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ChartLine } from "lucide-react";

interface ProjectionChartProps {
  performanceHistory?: PerformancePoint[];
  projections?: PerformancePoint[];
  stats: any;
}

const ProjectionChart = ({ performanceHistory = [], projections = [], stats }: ProjectionChartProps) => {
  const [projectionDays, setProjectionDays] = useState<"30" | "60" | "90" | "100">("30");
  
  // Combine historical data with projections
  const historicalData = (performanceHistory || []).map(point => ({
    ...point,
    type: 'historical'
  }));
  
  const projectionData = (projections || []).map(point => ({
    ...point,
    type: 'projection'
  }));
  
  const chartData = [...historicalData, ...projectionData];
  
  const chartConfig = {
    historical: {
      label: "Historical",
      theme: {
        light: "#10b981",
        dark: "#10b981",
      },
    },
    projection: {
      label: "Projection",
      theme: {
        light: "#3b82f6",
        dark: "#3b82f6",
      },
    },
  };
  
  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartLine className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Performance Projection</CardTitle>
          </div>
          <Tabs 
            defaultValue="30" 
            value={projectionDays} 
            onValueChange={(v) => setProjectionDays(v as any)}
          >
            <TabsList className="bg-gray-800">
              <TabsTrigger value="30">30 Days</TabsTrigger>
              <TabsTrigger value="60">60 Days</TabsTrigger>
              <TabsTrigger value="90">90 Days</TabsTrigger>
              <TabsTrigger value="100">100 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  // Format the date for display
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${Math.round(value / 1000)}K`}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line 
                dataKey="balance" 
                strokeWidth={2}
                stroke="var(--color-historical)"
                activeDot={{ r: 6 }}
                dot={false}
                type="monotone"
                name="historical"
                connectNulls
              />
              <Line 
                dataKey="balance"
                strokeWidth={2}
                stroke="var(--color-projection)"
                strokeDasharray="5 5"
                dot={false}
                type="monotone"
                name="projection"
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectionChart;
