import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface AiLearningChartsProps {
  selectedStrategy: string;
}

export default function AiLearningCharts({ selectedStrategy }: AiLearningChartsProps) {
  const [accuracyData, setAccuracyData] = useState<any[]>([]);
  const [learningEntries, setLearningEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch accuracy snapshots
      let accuracyQuery = supabase
        .from("accuracy_snapshots")
        .select("*")
        .order("timestamp", { ascending: true });

      if (selectedStrategy !== "all") {
        accuracyQuery = accuracyQuery.eq("strategy", selectedStrategy);
      }

      const { data: accuracySnapshots, error: accuracyError } = await accuracyQuery;

      if (accuracyError) {
        console.error("Failed to fetch accuracy data:", accuracyError.message);
      } else {
        setAccuracyData(accuracySnapshots || []);
      }

      // Fetch learning entries
      let learningQuery = supabase
        .from("learning_entries")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(10);

      if (selectedStrategy !== "all") {
        learningQuery = learningQuery.eq("strategy", selectedStrategy);
      }

      const { data: entries, error: learningError } = await learningQuery;

      if (learningError) {
        console.error("Failed to fetch learning entries:", learningError.message);
      } else {
        setLearningEntries(entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch AI learning data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [selectedStrategy]);

  if (loading) {
    return <p className="text-muted-foreground">Loading AI learning data...</p>;
  }

  return (
    <div className="space-y-8">
      {accuracyData.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🧠 AI Accuracy Over Time</h2>
          <div className="bg-card rounded-lg border p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))" }} 
                  domain={[0, 100]} 
                />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: any) => [`${value?.toFixed(2)}%`, "Accuracy"]}
                />
                <Area
                  type="monotone"
                  dataKey="max_accuracy"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="min_accuracy"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">📝 Recent Learning Entries</h2>
        <div className="space-y-4">
          {learningEntries.length > 0 ? (
            learningEntries.map((entry) => (
              <div key={entry.id} className="bg-card rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {entry.strategy}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-blue-400">Instruction:</span>
                    <p className="text-sm mt-1">{entry.instruction}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-400">Response:</span>
                    <p className="text-sm mt-1">{entry.response}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No learning entries found for {selectedStrategy === "all" ? "any strategy" : selectedStrategy}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}