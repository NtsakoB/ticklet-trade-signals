import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";

export const MissedOpportunities = () => {
  return (
    <Card className="h-full border-red-500/20">
      <CardHeader className="pb-2">
        <CardTitle>Missed Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          <div className="p-4 text-center text-muted-foreground">
            <div className="animate-pulse">
              Awaiting signal logic...
            </div>
            <div className="mt-2 text-xs">
              Overbought pairs with high-risk entries will appear here
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};