import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingDown } from "lucide-react";

export const LowEntryWatchlist = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-green-500" />
          🔻 Low Entry Watchlist
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          <div className="p-4 text-center text-muted-foreground">
            <div className="animate-pulse">
              Awaiting signal logic...
            </div>
            <div className="mt-2 text-xs">
              Pairs with likely re-entry conditions will appear here
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};