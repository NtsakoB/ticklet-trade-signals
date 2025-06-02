
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Settings2, TrendingUp, AlertTriangle } from "lucide-react";

interface LeverageControlProps {
  currentLeverage: number;
  onLeverageChange: (leverage: number) => void;
  maxLeverage?: number;
}

const LeverageControl = ({ 
  currentLeverage, 
  onLeverageChange, 
  maxLeverage = 20 
}: LeverageControlProps) => {
  const [tempLeverage, setTempLeverage] = useState(currentLeverage);

  const handleApplyLeverage = () => {
    onLeverageChange(tempLeverage);
  };

  const presetLeverages = [1, 2, 5, 10, 15, 20];

  const getRiskLevel = (leverage: number) => {
    if (leverage <= 2) return { level: 'Low', color: 'text-green-400', bg: 'bg-green-400/10' };
    if (leverage <= 5) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    if (leverage <= 10) return { level: 'High', color: 'text-orange-400', bg: 'bg-orange-400/10' };
    return { level: 'Extreme', color: 'text-red-400', bg: 'bg-red-400/10' };
  };

  const risk = getRiskLevel(tempLeverage);

  return (
    <Card className="bg-trading-card border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Leverage Control
          </CardTitle>
          <Badge variant="outline" className={`${risk.color} ${risk.bg} border-current`}>
            {risk.level} Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current vs New Leverage */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Leverage</p>
            <p className="text-2xl font-bold">{currentLeverage}x</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">New Leverage</p>
            <p className="text-2xl font-bold text-blue-400">{tempLeverage}x</p>
          </div>
        </div>

        {/* Leverage Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Leverage</span>
            <span className="text-sm font-medium">{tempLeverage}x</span>
          </div>
          <Slider
            value={[tempLeverage]}
            onValueChange={(value) => setTempLeverage(value[0])}
            max={maxLeverage}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1x</span>
            <span>{maxLeverage}x</span>
          </div>
        </div>

        {/* Preset Leverage Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {presetLeverages.filter(lev => lev <= maxLeverage).map((leverage) => (
            <Button
              key={leverage}
              variant={tempLeverage === leverage ? "default" : "outline"}
              size="sm"
              onClick={() => setTempLeverage(leverage)}
              className="text-xs"
            >
              {leverage}x
            </Button>
          ))}
        </div>

        {/* Risk Warning */}
        {tempLeverage > 5 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <div className="text-xs text-yellow-400">
              <p className="font-medium">High leverage warning</p>
              <p>Leverage above 5x significantly increases risk. Trade responsibly.</p>
            </div>
          </div>
        )}

        {/* Position Size Calculator */}
        <div className="space-y-2 pt-4 border-t border-gray-800">
          <h4 className="text-sm font-medium">Position Impact</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Buying Power</p>
              <p className="font-medium text-green-400">
                ${(10000 * tempLeverage).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Risk per 1%</p>
              <p className="font-medium text-red-400">
                ${(100 * tempLeverage).toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <Button 
          onClick={handleApplyLeverage}
          disabled={tempLeverage === currentLeverage}
          className="w-full"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Apply Leverage ({tempLeverage}x)
        </Button>
      </CardContent>
    </Card>
  );
};

export default LeverageControl;
