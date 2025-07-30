import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

interface LearningCurveChartProps {
  strategy?: string; // Allow dynamic strategy support
}

export default function LearningCurveChart({
  strategy = "ecosystem",
}: LearningCurveChartProps) {
  const [curveData, setCurveData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertTriggered, setAlertTriggered] = useState(false);

  useEffect(() => {
    fetchCurve();
  }, [strategy]); // Re-fetch data when strategy changes

  async function fetchCurve() {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`/api/accuracy_snapshots?strategy=${strategy}`);
      const entries = res.data.data || [];

      // Validate and flatten curve arrays from multiple snapshots
      if (Array.isArray(entries)) {
        const mergedCurve = entries.flatMap((entry: any) => entry.accuracy_curve || []);
        setCurveData(mergedCurve);
        setAlertTriggered(res.data.metadata?.alert_triggered || false);
      } else {
        throw new Error("Invalid data format received from API.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // Memoize labels and data to optimize performance
  const chartData = useMemo(() => {
    const labels = curveData.map((_, i) => `Snapshot ${i + 1}`);
    return {
      labels,
      datasets: [
        {
          label: "Model Accuracy (%)",
          data: curveData,
          fill: true,
          borderColor: "#10b981",
          backgroundColor: "rgba(16,185,129,0.2)",
          tension: 0.3,
        },
      ],
    };
  }, [curveData]);

  return (
    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
      <h2 className="text-lg font-semibold mb-2" aria-live="polite">
        📈 AI/ML Accuracy Curve (Historical)
      </h2>

      {alertTriggered && (
        <div className="bg-yellow-900/20 border border-yellow-600 text-yellow-400 px-4 py-2 rounded mb-4" role="alert">
          ⚠️ Low accuracy detected: Some snapshots show accuracy below 50%
        </div>
      )}

      {loading && (
        <p className="text-gray-400" role="status">
          Loading accuracy data...
        </p>
      )}

      {error && (
        <p className="text-red-600 mt-2" role="alert">
          Error: {error}
        </p>
      )}

      {!loading && !error && curveData.length === 0 && (
        <p className="text-gray-400">No accuracy history found.</p>
      )}

      {!loading && !error && curveData.length > 0 && (
        <Line
          data={chartData}
          options={{ maintainAspectRatio: false }}
          height={400}
          aria-label="Line chart showing historical accuracy curve"
        />
      )}
    </div>
  );
}