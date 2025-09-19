import React from "react";
import BacktestPanel from "@/components/Backtest/BacktestPanel";

export default function Backtest() {
  return (
    <div className="min-h-screen bg-gradient-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Comprehensive Backtesting</h1>
          <p className="text-white/80">
            Test your strategies with real historical data, AI/ML integration, and comprehensive metrics
          </p>
        </div>
        
        <BacktestPanel />
      </div>
    </div>
  );
}