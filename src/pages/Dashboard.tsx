import { useState, useEffect } from "react";
import ScoreChart from "@/components/dashboard/ScoreChart";
import axios from "axios";

interface LearningEntry {
  id: string;
  strategy: string;
  timestamp: string;
  instruction: string;
  response: string;
}

export default function Dashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [strategy, setStrategy] = useState("ecosystem");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insights, setInsights] = useState<LearningEntry[]>([]);

  // Fetch learning entries from Supabase
  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    setLoadingInsights(true);
    try {
      const response = await axios.get("https://gjtetfgujpcyhjenudnb.supabase.co/functions/v1/learning-entries");
      if (response.data?.status === "ok") {
        setInsights(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  }

  function getInsightType(instruction: string): string {
    if (instruction.toLowerCase().includes("error") || instruction.toLowerCase().includes("mistake")) {
      return "Mistake";
    }
    if (instruction.toLowerCase().includes("success") || instruction.toLowerCase().includes("good")) {
      return "Success";
    }
    return "Improvement";
  }

  function getInsightTitle(instruction: string): string {
    return instruction.length > 50 ? instruction.substring(0, 50) + "..." : instruction;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🧠 Ticklet AI Dashboard</h1>
        <div className="space-x-2">
          <input
            type="text"
            className="bg-gray-800 text-white px-3 py-1 rounded"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Symbol (e.g. BTCUSDT)"
          />
          <select
            className="bg-gray-800 text-white px-3 py-1 rounded"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
            <option value="ecosystem">Ecosystem</option>
            <option value="growth">Growth</option>
            <option value="performance">Performance</option>
          </select>
        </div>
      </div>

      {/* 📊 Score Breakdown */}
      <div className="relative">
        <ScoreChart symbol={symbol} strategy={strategy} />
        <button
          onClick={() => fetchInsights()}
          className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* 📈 AI/ML Learning Curve */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
        <h2 className="text-lg font-semibold mb-2">📈 AI/ML Learning Curve</h2>
        <p className="text-gray-400 mb-2">
          Coming soon: Visualize how Ticklet's accuracy improves over time
          through learning entries.
        </p>
        <div className="h-[200px] bg-gray-900 rounded-md flex items-center justify-center text-gray-500 text-sm">
          [Placeholder Chart]
        </div>
      </div>

      {/* 📊 Performance Projection */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
        <h2 className="text-lg font-semibold mb-2">📊 Performance Projection</h2>
        <p className="text-gray-400 mb-2">
          Projection based on historical success rate and daily prediction
          volume.
        </p>
        <div className="h-[200px] bg-gray-900 rounded-md flex items-center justify-center text-gray-500 text-sm">
          [Projection Line Chart Placeholder]
        </div>
      </div>

      {/* 🧠 AI Learning Insights */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">🧠 AI Learning Insights</h2>
        {loadingInsights && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin border-t-2 border-white rounded-full w-6 h-6"></div>
            <p className="text-gray-400 ml-2">Loading insights...</p>
          </div>
        )}
        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight) => (
              <Insight
                key={insight.id}
                type={getInsightType(insight.instruction)}
                title={getInsightTitle(insight.instruction)}
                date={new Date(insight.timestamp).toLocaleDateString()}
                text={insight.response}
              />
            ))
          ) : (
            !loadingInsights && (
              <div className="text-gray-400 text-center py-8">
                No learning insights available yet.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Insight card component
function Insight({
  type,
  title,
  date,
  text,
}: {
  type: string;
  title: string;
  date: string;
  text: string;
}) {
  return (
    <div className="bg-gray-900 p-4 rounded-md border border-gray-800">
      <div className="flex justify-between items-center mb-2">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            type === "Success"
              ? "bg-green-500"
              : type === "Mistake"
              ? "bg-red-500"
              : "bg-yellow-500"
          }`}
        >
          {type}
        </span>
        <span className="text-sm text-gray-400">{date}</span>
      </div>
      <h3 className="text-md font-semibold text-white">{title}</h3>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}