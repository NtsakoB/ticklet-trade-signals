
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for AI/ML learning curve
const mockLearningData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  accuracy: 50 + Math.min(i * 1.5, 40) + Math.random() * 5,
  predictions: Math.min(10 + i * 3, 100) + Math.floor(Math.random() * 10),
}));

const AiLearningChart = () => {
  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle>AI/ML Learning Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={mockLearningData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" name="Day" stroke="#6B7280" label={{ value: 'Training Days', position: 'insideBottomRight', offset: -10, fill: '#9CA3AF' }} />
              <YAxis stroke="#6B7280" label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  borderColor: '#374151', 
                  color: '#E5E7EB' 
                }}
                labelStyle={{ color: '#E5E7EB' }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                name="Prediction Accuracy"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="predictions"
                name="Daily Predictions"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-md border border-gray-700 p-3">
            <p className="text-sm text-muted-foreground">Model Accuracy</p>
            <h4 className="text-2xl font-semibold text-trading-positive mt-1">
              {mockLearningData[mockLearningData.length-1].accuracy.toFixed(1)}%
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              +{(mockLearningData[mockLearningData.length-1].accuracy - mockLearningData[0].accuracy).toFixed(1)}% from start
            </p>
          </div>
          <div className="rounded-md border border-gray-700 p-3">
            <p className="text-sm text-muted-foreground">Daily Predictions</p>
            <h4 className="text-2xl font-semibold text-blue-500 mt-1">
              {mockLearningData[mockLearningData.length-1].predictions}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              +{mockLearningData[mockLearningData.length-1].predictions - mockLearningData[0].predictions} from start
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiLearningChart;
