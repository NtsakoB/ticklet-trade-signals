import React, { useState } from 'react';
import TradingViewChart from "@/components/TradingViewChart";
import { SymbolSelector } from "@/components/SymbolSelector";

const Chart = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Trading Chart</h2>
        <SymbolSelector
          value={selectedSymbol}
          onValueChange={setSelectedSymbol}
        />
      </div>
      
      <TradingViewChart symbol={selectedSymbol} height={600} />
    </div>
  );
};

export default Chart;