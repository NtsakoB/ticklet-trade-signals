import { useEffect, useState } from "react";
import { useTradeModeStore } from "@/state/tradeModeStore";
import { getTradingSettings, updateTradingSettings, TradingSettings } from "@/services/settingsApi";

export default function LeverageControls() {
  const dynamicEnabled = useTradeModeStore((s) => s.dynamicLeverageEnabled);
  const manualLev = useTradeModeStore((s) => s.manualLeverage);
  const setDynamic = useTradeModeStore((s) => s.setDynamicLeverageEnabled);
  const setManual = useTradeModeStore((s) => s.setManualLeverage);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    getTradingSettings()
      .then((s) => {
        if (!live) return;
        setDynamic(s.dynamic_leverage_enabled);
        setManual(s.manual_leverage);
      })
      .catch(() => {
        // Fallback to current store values on error
      })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [setDynamic, setManual]);

  const persist = async (payload: TradingSettings) => {
    try {
      const saved = await updateTradingSettings(payload);
      setDynamic(saved.dynamic_leverage_enabled);
      setManual(saved.manual_leverage);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Update local state anyway for offline functionality
      setDynamic(payload.dynamic_leverage_enabled);
      setManual(payload.manual_leverage);
    }
  };

  const handleToggle = async () => {
    await persist({ dynamic_leverage_enabled: !dynamicEnabled, manual_leverage: manualLev });
  };

  const handleManualPick = async (x: number) => {
    if (x < 1) x = 1;
    if (x > 20) x = 20;
    await persist({ dynamic_leverage_enabled: false, manual_leverage: x });
  };

  if (loading) return <div className="text-muted-foreground">Loading leverage settings…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Leverage Control</div>
        <span className={`px-2 py-1 rounded-xl text-xs ${
          dynamicEnabled 
            ? "bg-amber-600/30 text-amber-300" 
            : "bg-blue-600/30 text-blue-200"
        }`}>
          {dynamicEnabled ? "Dynamic Enabled" : "Manual Enabled"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          className={`px-3 py-1 rounded-2xl transition-colors ${
            dynamicEnabled 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => dynamicEnabled ? null : handleToggle()}
          disabled={dynamicEnabled}
          title="Dynamic leverage follows strategy logic"
        >
          Dynamic
        </button>
        <button
          className={`px-3 py-1 rounded-2xl transition-colors ${
            !dynamicEnabled 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => !dynamicEnabled ? null : handleToggle()}
          disabled={!dynamicEnabled}
          title="Switch to manual leverage control"
        >
          Manual
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">Manual Leverage</div>
        <input
          type="range"
          min={1}
          max={20}
          value={manualLev}
          disabled={dynamicEnabled}
          onChange={(e) => handleManualPick(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4,5,10,15,20].map(x => (
            <button
              key={x}
              className={`px-3 py-1 rounded-xl transition-colors ${
                manualLev === x 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              disabled={dynamicEnabled}
              onClick={() => handleManualPick(x)}
            >
              {x}x
            </button>
          ))}
        </div>
        {dynamicEnabled ? (
          <div className="text-amber-300 text-xs">
            Dynamic Leverage is ON. Manual controls are disabled. Leverage follows the selected strategy's logic.
          </div>
        ) : (
          <div className="text-blue-300 text-xs">
            Manual Leverage is ON. Setting applies globally (Paper, Live, Backtesting).
          </div>
        )}
      </div>
    </div>
  );
}