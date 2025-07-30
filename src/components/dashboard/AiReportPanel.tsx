import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000";

export default function AiReportPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/report/latest`);
      const json = await res.json();
      setData(json);
      setError(false);
    } catch (err) {
      console.error("Failed to fetch AI report:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 60000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          📄 AI Daily Report
        </CardTitle>
        <Button
          onClick={fetchReport}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          🔁 Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <p className="text-muted-foreground">Loading latest report...</p>
        )}

        {error && (
          <p className="text-destructive">
            ❌ Failed to fetch report. Is backend deployed?
          </p>
        )}

        {data ? (
          <>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              🕒 {data.timestamp || "Awaiting data"} —{" "}
              {data.status === "ready" ? "🟢 Ready" : "⏳ Pending"}
            </div>

            {data.trading || data.technician ? (
              <>
                {data.trading && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-blue-400">📣 Trading Summary</h3>
                    <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto">
                      {data.trading}
                    </pre>
                  </div>
                )}

                {data.technician && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-green-400">🧠 Technician Report</h3>
                    <pre className="bg-card border p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                      {data.technician}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="text-yellow-400 text-center py-6">
                ⚠️ No relevant data available. Please check back later!
              </div>
            )}
          </>
        ) : (
          !loading &&
          !error && (
            <div className="text-yellow-400 text-center py-6">
              ⚠️ No data available. Please ensure the backend is running and data is being generated.
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}