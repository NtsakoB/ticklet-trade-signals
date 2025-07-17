import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StrategyType, Strategy } from '@/types/strategy';
import { TrendingUp, Zap, Settings, Info } from 'lucide-react';

interface StrategySelectorProps {
  activeStrategy: StrategyType;
  strategies: Strategy[];
  onStrategyChange: (strategy: StrategyType) => void;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

const strategyIcons = {
  'ticklet-alpha': Zap,
  'bull-strategy': TrendingUp
} as const;

const riskColors = {
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20'
} as const;

export function StrategySelector({ 
  activeStrategy, 
  strategies, 
  onStrategyChange, 
  variant = 'full',
  className = '' 
}: StrategySelectorProps) {
  const activeStrategyConfig = strategies.find(s => s.id === activeStrategy);

  if (variant === 'minimal') {
    return (
      <Select value={activeStrategy} onValueChange={onStrategyChange}>
        <SelectTrigger className={`w-full ${className}`}>
          <SelectValue placeholder="Select strategy" />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          {strategies.map((strategy) => {
            const Icon = strategyIcons[strategy.id];
            return (
              <SelectItem key={strategy.id} value={strategy.id}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{strategy.displayName}</span>
                  <Badge className={`text-xs ${riskColors[strategy.riskLevel]}`}>
                    {strategy.riskLevel}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-muted-foreground">Strategy:</span>
        <Select value={activeStrategy} onValueChange={onStrategyChange}>
          <SelectTrigger className="w-auto min-w-[180px]">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {strategies.map((strategy) => {
              const Icon = strategyIcons[strategy.id];
              return (
                <SelectItem key={strategy.id} value={strategy.id}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{strategy.displayName}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {activeStrategyConfig && (
          <Badge className={riskColors[activeStrategyConfig.riskLevel]}>
            {activeStrategyConfig.riskLevel} risk
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Trading Strategy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Select value={activeStrategy} onValueChange={onStrategyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select trading strategy" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {strategies.map((strategy) => {
                const Icon = strategyIcons[strategy.id];
                return (
                  <SelectItem key={strategy.id} value={strategy.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{strategy.displayName}</span>
                      </div>
                      <Badge className={`ml-2 ${riskColors[strategy.riskLevel]}`}>
                        {strategy.riskLevel}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {activeStrategyConfig && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = strategyIcons[activeStrategyConfig.id];
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                  <span className="font-medium">{activeStrategyConfig.displayName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{activeStrategyConfig.version}</Badge>
                  <Badge className={riskColors[activeStrategyConfig.riskLevel]}>
                    {activeStrategyConfig.riskLevel} risk
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {activeStrategyConfig.description}
              </p>
              
              <div className="flex flex-wrap gap-1">
                {activeStrategyConfig.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StrategyBadge({ 
  strategy, 
  strategyName, 
  className = '' 
}: { 
  strategy: StrategyType; 
  strategyName?: string;
  className?: string;
}) {
  const Icon = strategyIcons[strategy];
  const displayName = strategyName || (strategy === 'ticklet-alpha' ? 'Ticklet ALPHA' : 'Bull Strategy');
  
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      <span className="text-xs">{displayName}</span>
    </Badge>
  );
}