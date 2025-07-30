
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ExportSignalScores() {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const { toast } = useToast();

  const triggerDownload = async (url: string, fileName: string) => {
    try {
      setLoading(true);

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `Signal scores exported as ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const url = `/api/signal_score_log?format=${format}`;
    const fileName = `signal_scores.${format}`;
    triggerDownload(url, fileName);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="export-format" className="text-sm font-medium">
          Export format:
        </label>
        <Select value={format} onValueChange={(value) => setFormat(value as "csv" | "json")}>
          <SelectTrigger id="export-format" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleDownload}
        disabled={loading}
        size="sm"
        className="gap-2"
        aria-label={`Download signal scores as ${format.toUpperCase()}`}
      >
        <Download className="h-4 w-4" />
        {loading ? `Downloading...` : `Export ${format.toUpperCase()}`}
      </Button>
    </div>
  );
}
