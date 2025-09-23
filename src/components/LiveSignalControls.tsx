import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LiveSignalsApi } from "@/services/liveSignalsApi";
import { toast } from "sonner";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Database, TrendingUp } from "lucide-react";

export default function LiveSignalControls() {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Get system status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['signal-system-status'],
    queryFn: LiveSignalsApi.getStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Generate signals mutation
  const generateSignalsMutation = useMutation({
    mutationFn: LiveSignalsApi.generateSignals,
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (result) => {
      toast.success(`Generated ${result.signals_generated} new signals!`, {
        description: result.message,
      });
      // Refresh status and signals data
      queryClient.invalidateQueries({ queryKey: ['signal-system-status'] });
      queryClient.invalidateQueries({ queryKey: ['enhancedBinanceData'] });
      // Refresh all signal-related queries
      queryClient.invalidateQueries({ queryKey: ['signals'] });
    },
    onError: (error) => {
      toast.error("Failed to generate signals", {
        description: String(error),
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // Cleanup signals mutation
  const cleanupMutation = useMutation({
    mutationFn: LiveSignalsApi.cleanupExpiredSignals,
    onSuccess: (result) => {
      toast.success(`Cleaned up ${result.cleaned_signals} expired signals`);
      refetchStatus();
    },
    onError: (error) => {
      toast.error("Failed to cleanup signals", {
        description: String(error),
      });
    },
  });

  const getStatusColor = (systemStatus: string) => {
    switch (systemStatus) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (systemStatus: string) => {
    switch (systemStatus) {
      case 'connected': return <CheckCircle2 className="w-4 h-4" />;
      case 'disconnected': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Loader2 className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Live Signal Generator
        </CardTitle>
        <CardDescription>
          Generate and manage live trading signals from Binance market data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">System Status</h4>
          {statusLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Checking status...</span>
            </div>
          ) : status ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status.status)}`}></div>
                {getStatusIcon(status.status)}
                <span className="text-sm">
                  System: <Badge variant="outline">{status.status}</Badge>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="text-sm">
                  Database: <Badge variant="outline">{status.database}</Badge>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">
                  Active Signals: <Badge variant="secondary">{status.active_signals}</Badge>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-500">Failed to load status</div>
          )}
          
          {status?.last_generation && (
            <div className="text-xs text-muted-foreground">
              Last generation: {new Date(status.last_generation).toLocaleString()}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => generateSignalsMutation.mutate()}
            disabled={isGenerating || generateSignalsMutation.isPending}
            className="flex items-center gap-2"
          >
            {(isGenerating || generateSignalsMutation.isPending) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Generate Live Signals
          </Button>

          <Button
            variant="outline"
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
            className="flex items-center gap-2"
          >
            {cleanupMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            Cleanup Expired
          </Button>

          <Button
            variant="ghost"
            onClick={() => refetchStatus()}
            disabled={statusLoading}
            className="flex items-center gap-2"
          >
            {statusLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh Status
          </Button>
        </div>

        {/* Recent Generation Result */}
        {generateSignalsMutation.data && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800">
              ✅ {generateSignalsMutation.data.message}
            </p>
            {generateSignalsMutation.data.signals.length > 0 && (
              <div className="mt-2 text-xs text-green-700">
                Sample signals: {generateSignalsMutation.data.signals.map(s => s.symbol).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {status?.error && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-800">
              ❌ System Error: {status.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}