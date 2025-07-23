import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from "chart.js"

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend)

interface LearningCurveChartProps {
  accuracyData: number[]
}

export default function LearningCurveChart({ accuracyData }: LearningCurveChartProps) {
  const labels = accuracyData.map((_, i) => `Day ${i + 1}`)
  
  const data = {
    labels,
    datasets: [
      {
        label: "Model Accuracy (%)",
        data: accuracyData,
        fill: true,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.2)",
        tension: 0.3
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#ffffff"
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Accuracy: ${context.raw}%`
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: "#9ca3af"
        },
        grid: {
          color: "rgba(156, 163, 175, 0.2)"
        }
      },
      y: {
        ticks: {
          color: "#9ca3af"
        },
        grid: {
          color: "rgba(156, 163, 175, 0.2)"
        }
      }
    },
    maintainAspectRatio: false
  }

  return (
    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
      <h2 className="text-lg font-semibold mb-4 text-white">📈 AI/ML Learning Curve</h2>
      {accuracyData.length === 0 ? (
        <p className="text-gray-400">No accuracy data available.</p>
      ) : (
        <div style={{ height: accuracyData.length > 10 ? "400px" : "200px" }}>
          <Line
            data={data}
            options={options}
            aria-label="AI/ML Learning Curve showing model accuracy over time."
          />
        </div>
      )}
    </div>
  )
}