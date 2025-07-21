from freqtrade.configuration import Configuration
from freqtrade.optimize.backtesting import Backtesting
from strategies.bull_strategy import BullStrategy

# Base config
base_config = {
    "stake_currency": "USDT",
    "stake_amount": 1000,
    "exchange": {"name": "binance", "ccxt_config": {}, "ccxt_async_config": {}},
    "datadir": "user_data/data/binance",
    "timeframe": "5m",
    "dry_run": True,
    "verbose": False,
}

def run_backtest(macd_enabled: bool):
    config = base_config.copy()
    config['strategy'] = BullStrategy
    config['strategy_parameters'] = {"macd_enabled": macd_enabled}

    bt = Backtesting(config)
    results = bt.start()
    return results

if __name__ == "__main__":
    print("Running Bull Strategy without MACD...")
    no_macd = run_backtest(False)
    print(no_macd)

    print("\nRunning Bull Strategy with MACD...")
    with_macd = run_backtest(True)
    print(with_macd)