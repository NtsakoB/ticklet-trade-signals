import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import EnhancedBinanceApi from "@/services/enhancedBinanceApi";

interface SymbolSelectorProps {
  value: string;
  onValueChange: (symbol: string) => void;
  className?: string;
}

export function SymbolSelector({ value, onValueChange, className }: SymbolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSymbols = async () => {
      setLoading(true);
      try {
        const allSymbols = await EnhancedBinanceApi.fetchAllSymbols();
        setSymbols(allSymbols);
      } catch (error) {
        console.error('Failed to fetch symbols:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSymbols();
  }, []);

  const symbolOptions = useMemo(() => {
    return symbols.map(symbol => ({
      value: symbol.symbol,
      label: `${symbol.baseAsset}/${symbol.quoteAsset}`,
      symbol: symbol.symbol
    }));
  }, [symbols]);

  return (
    <div className={cn("flex items-center space-x-4", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {value
              ? symbolOptions.find((option) => option.value === value)?.label
              : "Select symbol..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search symbols..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading symbols..." : "No symbol found."}
              </CommandEmpty>
              <CommandGroup>
                {symbolOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}