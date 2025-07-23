import { useEffect, useState } from "react"
import axios from "axios"

interface Props {
  symbol: string
  strategy?: string
  theme?: string
  mock?: boolean
}

export default function ScoreChart({
  symbol,
  strategy = "ecosystem",
  theme = "plotly_dark",
  mock = true
}: Props) {
  const [imageData, setImageData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return
    fetchChart()
  }, [symbol, strategy, theme, mock])

  async function fetchChart() {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get("/dashboard/visualize", {
        params: { symbol, strategy, theme, mock }
      })

      if (response.data.chart_base64) {
        setImageData(`data:image/png;base64,${response.data.chart_base64}`)
      } else {
        setError("No chart data available.")
      }
    } catch (err: any) {
      setError("Unable to fetch chart. Check your network or input parameters.")
      console.error("Chart fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#1e293b] rounded-xl p-6 shadow-md border border-gray-800 text-white w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">
          📊 Signal Component Breakdown
        </h2>
        <div className="text-sm text-gray-400">{symbol.toUpperCase()} • {strategy}</div>
      </div>

      {loading && (
        <p className="text-gray-400" aria-live="polite">Loading breakdown chart...</p>
      )}

      {error && (
        <p className="text-red-400" aria-live="assertive">{error}</p>
      )}

      {imageData ? (
        <div className="flex justify-center">
          <img
            src={imageData}
            alt={`Score breakdown chart for ${symbol.toUpperCase()} (${strategy}).`}
            className="rounded-lg border border-gray-700 max-w-full"
          />
        </div>
      ) : (
        !loading && !error && (
          <div className="text-gray-400 text-center">
            No chart available for the given inputs.
          </div>
        )
      )}
    </div>
  )
}