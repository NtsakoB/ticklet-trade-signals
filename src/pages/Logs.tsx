import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("report_failures")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase fetch error:", error.message);
    } else {
      setLogs(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📕 AI Report Failures</h1>
        <Button
          onClick={fetchLogs}
          variant="destructive"
          size="sm"
        >
          🔁 Refresh
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading logs...</p>}

      {!loading && logs.length === 0 && (
        <p className="text-green-400">✅ No recent failures found.</p>
      )}

      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id} className="border-destructive/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-bold text-yellow-400">
                  ⚙️ {log.component}
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  🕒 {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-destructive">{log.detail}</div>
              {log.meta && (
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.meta, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}