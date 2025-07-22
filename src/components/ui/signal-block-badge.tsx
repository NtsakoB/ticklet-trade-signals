import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface SignalBlockBadgeProps {
  reasons: string[];
  aiNotes?: string;
  symbol: string;
}

const SignalBlockBadge = ({ reasons, aiNotes, symbol }: SignalBlockBadgeProps) => {
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        🛑 Signal Rejected for {symbol}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <div>
            <strong>Rejection Reasons:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {reasons.map((reason, index) => (
                <li key={index} className="text-sm">{reason}</li>
              ))}
            </ul>
          </div>
          {aiNotes && (
            <div>
              <strong>AI Analysis:</strong>
              <p className="text-sm mt-1">{aiNotes}</p>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Badge variant="secondary">Risk Management</Badge>
            <Badge variant="outline">Safety Filter Active</Badge>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default SignalBlockBadge;