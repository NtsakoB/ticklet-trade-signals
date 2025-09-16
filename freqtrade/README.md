# Freqtrade Workspace for Golden Hook X

## Quickstart
```bash
# 1) (Optional) create venv and install freqtrade
pip install freqtrade

# 2) Backtest (example with Bybit futures data)
freqtrade backtesting --config freqtrade/config.sample.json \
  --strategy GoldenHookX --timeframe 1h

# 3) Hyperopt example
freqtrade hyperopt --config freqtrade/config.sample.json \
  --strategy GoldenHookX -e 100

# 4) Dry run
freqtrade trade --config freqtrade/config.sample.json \
  --strategy GoldenHookX --dry-run
```

> Exchange and futures settings depend on your environment. 
> If using MEXC or Bybit futures, ensure your config sets the corresponding `exchange` and `futures_mode`.