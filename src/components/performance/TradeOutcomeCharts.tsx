import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TradeOutcomeChartsProps {
  selectedStrategy: string;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

export default function TradeOutcomeCharts({ selectedStrategy }: TradeOutcomeChartsProps) {
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    tp1: 0,
    tp2: 0,
    tp3: 0,
    sl: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    
    let query = supabase
      .from("trade_history_log")
      .select("tp1_hit, tp2_hit, tp3_hit, stop_loss_hit");

    if (selectedStrategy !== "all") {
      query = query.eq("strategy", selectedStrategy);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch trade stats:", error.message);
      setLoading(false);
      return;
    }

    let wins = 0,
      losses = 0,
      tp1 = 0,
      tp2 = 0,
      tp3 = 0,
      sl = 0;

    data?.forEach((row) => {
      const { tp1_hit, tp2_hit, tp3_hit, stop_loss_hit } = row;
      if (tp3_hit) tp3++;
      if (tp2_hit) tp2++;
      if (tp1_hit) tp1++;
      if (stop_loss_hit) sl++;
    });

    wins = tp1 + tp2 + tp3;
    losses = sl;

    setStats({ wins, losses, tp1, tp2, tp3, sl });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 120000); // refresh every 2min
    return () => clearInterval(interval);
  }, [selectedStrategy]);

  const pieData = [
    { name: "Wins", value: stats.wins },
    { name: "Losses", value: stats.losses },
  ];

  const barData = [
    { level: "TP1", count: stats.tp1 },
    { level: "TP2", count: stats.tp2 },
    { level: "TP3", count: stats.tp3 },
    { level: "Stop Loss", count: stats.sl },
  ];

  if (loading) {
    return <p className="text-muted-foreground">Loading charts...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🟢 Wins vs ❌ Losses</h2>
          <div className="bg-card rounded-lg border p-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🎯 Take-Profit & SL Hits</h2>
          <div className="bg-card rounded-lg border p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="level" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
          <div className="text-sm text-muted-foreground">Total Wins</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
          <div className="text-sm text-muted-foreground">Total Losses</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.wins + stats.losses > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-muted-foreground">Win Rate</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.wins + stats.losses}</div>
          <div className="text-sm text-muted-foreground">Total Trades</div>
        </div>
      </div>
    </div>
  );
}