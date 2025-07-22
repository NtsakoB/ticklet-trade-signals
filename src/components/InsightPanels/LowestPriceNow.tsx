import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDown } from "lucide-react";

export const LowestPriceNow = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ArrowDown className="h-4 w-4 text-blue-500" />
          📉 Lowest Price Now (Top 5)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          <div className="p-4 text-center text-muted-foreground">
            <div className="animate-pulse">
              Awaiting signal logic...
            </div>
            <div className="mt-2 text-xs">
              Top 5 pairs near local lows will appear here
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};