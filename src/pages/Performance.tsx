import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TradeOutcomeCharts from "@/components/performance/TradeOutcomeCharts";
import AiLearningCharts from "@/components/performance/AiLearningCharts";

const Performance = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");

  const strategies = [
    { value: "all", label: "All Strategies" },
    { value: "ecosystem", label: "Ecosystem" },
    { value: "bull_strategy", label: "Bull Strategy" },
    { value: "bear_strategy", label: "Bear Strategy" },
    { value: "scalping", label: "Scalping" },
    { value: "swing", label: "Swing Trading" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📊 Performance Analytics</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Strategy Filter:</label>
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((strategy) => (
                <SelectItem key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="outcomes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="outcomes">Trade Outcomes</TabsTrigger>
          <TabsTrigger value="learning">AI Learning</TabsTrigger>
        </TabsList>

        <TabsContent value="outcomes" className="space-y-6">
          <TradeOutcomeCharts selectedStrategy={selectedStrategy} />
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <AiLearningCharts selectedStrategy={selectedStrategy} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Performance;