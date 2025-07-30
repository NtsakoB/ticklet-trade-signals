import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AiPage() {
  const [accuracyData, setAccuracyData] = useState<any[]>([]);
  const [learningEntries, setLearningEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAiData = async () => {
    setLoading(true);
    
    // Fetch accuracy snapshots for the learning curve
    const { data: accuracySnapshots, error: accuracyError } = await supabase
      .from("accuracy_snapshots")
      .select("timestamp, max_accuracy, strategy")
      .order("timestamp", { ascending: true });

    if (accuracyError) {
      console.error("Accuracy fetch error:", accuracyError.message);
    } else {
      // Process accuracy data for chart
      const chartData = accuracySnapshots?.map(item => ({
        timestamp: new Date(item.timestamp).toLocaleDateString(),
        accuracy: item.max_accuracy || 0,
        strategy: item.strategy
      })) || [];
      setAccuracyData(chartData);
    }

    // Fetch recent learning entries
    const { data: entries, error: entriesError } = await supabase
      .from("learning_entries")
      .select("timestamp, strategy, instruction, response")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (entriesError) {
      console.error("Learning entries fetch error:", entriesError.message);
    } else {
      setLearningEntries(entries || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAiData();
    const interval = setInterval(fetchAiData, 60000); // Refresh data every 60 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🧠 AI Strategy Learning</h1>
        <Button
          onClick={fetchAiData}
          variant="outline"
          size="sm"
        >
          🔁 Refresh
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading AI data...</p>}

      {/* Accuracy Learning Curve */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Learning Curve</CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && accuracyData.length === 0 && (
            <p className="text-muted-foreground">No accuracy data found.</p>
          )}

          {!loading && accuracyData.length > 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fill: "hsl(var(--muted-foreground))" }} 
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))" }} 
                  domain={[0, 100]} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Learning Entries */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Recent Learning Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && learningEntries.length === 0 && (
            <p className="text-muted-foreground">No learning entries found.</p>
          )}

          <div className="space-y-4">
            {learningEntries.map((entry) => (
              <div key={entry.timestamp} className="border border-border p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-primary">
                    {entry.strategy}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm mb-2">
                  <strong>Instruction:</strong> {entry.instruction}
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Response:</strong> {entry.response}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}