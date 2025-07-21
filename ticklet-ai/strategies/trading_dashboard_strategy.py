from freqtrade.strategy import IStrategy, DecimalParameter, IntParameter, BooleanParameter
import talib.abstract as ta
import pandas as pd
from pandas import DataFrame


class TradingDashboardStrategy(IStrategy):
    """
    Trading Dashboard Strategy - Frontend Visualization Mirror of Ticklet Alpha:
    - Short trades are allowed only with confidence >= 70% on sell signals.
    - Dynamic position sizing adjusts trade sizes based on risk level and account balance.
    - Ensures total open positions do not exceed 50% of the total balance.
    - UI-compatible signal formatting for React components
    """

    INTERFACE_VERSION = 3
    timeframe = '5m'
    can_short = True  # Enable shorting

    # ROI tiers
    minimal_roi = {
        "0": 0.10,
        "30": 0.05,
        "60": 0.02,
        "120": 0.01
    }

    # Stoploss
    stoploss = -0.04  # 4% stoploss
    trailing_stop = True
    trailing_stop_positive = 0.01
    trailing_stop_positive_offset = 0.02
    trailing_only_offset_is_reached = True

    # Parameters
    rsi_period = IntParameter(10, 30, default=14, space='buy', optimize=True)
    rsi_buy_threshold = IntParameter(20, 40, default=30, space='buy', optimize=True)
    rsi_sell_threshold = IntParameter(60, 80, default=70, space='sell', optimize=True)
    ema_short_period = IntParameter(5, 15, default=9, space='buy', optimize=True)
    ema_long_period = IntParameter(20, 50, default=21, space='buy', optimize=True)
    confidence_threshold = DecimalParameter(0.7, 1.0, default=0.70, space='sell', optimize=True)

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Populate indicators in the dataframe.
        """
        if dataframe.empty or 'close' not in dataframe.columns:
            self.logger.warning("Dataframe is empty or missing 'close' column.")
            return dataframe

        # EMA
        dataframe['ema_short'] = ta.EMA(dataframe['close'], timeperiod=self.ema_short_period.value)
        dataframe['ema_long'] = ta.EMA(dataframe['close'], timeperiod=self.ema_long_period.value)

        # RSI
        dataframe['rsi'] = ta.RSI(dataframe['close'], timeperiod=self.rsi_period.value)

        # Confidence (Simulated: Derived from volatility and volume)
        dataframe['confidence'] = 1 - (dataframe['rsi'] / 100)  # Example confidence metric
        self.logger.debug("Confidence indicators calculated.")

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Populate entry trend signals in the dataframe for long and short trades.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping entry trend population.")
            return dataframe

        # Long entry conditions
        dataframe['enter_long'] = (
            (dataframe['close'] > dataframe['ema_short']) &
            (dataframe['ema_short'] > dataframe['ema_long']) &
            (dataframe['rsi'] < self.rsi_buy_threshold.value)
        )

        # Short entry conditions (only with confidence >= 70%)
        dataframe['enter_short'] = (
            (dataframe['close'] < dataframe['ema_short']) &
            (dataframe['ema_short'] < dataframe['ema_long']) &
            (dataframe['confidence'] >= self.confidence_threshold.value) &
            (dataframe['rsi'] > self.rsi_sell_threshold.value)
        )

        # Debug: Log the number of entry signals
        self.logger.debug(f"Long entry signals: {dataframe['enter_long'].sum()} | Short entry signals: {dataframe['enter_short'].sum()}")
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Populate exit trend signals in the dataframe for long and short trades.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping exit trend population.")
            return dataframe

        # Long exit conditions
        dataframe['exit_long'] = (
            (dataframe['rsi'] > self.rsi_sell_threshold.value) |
            (dataframe['close'] < dataframe['ema_short'])
        )

        # Short exit conditions (only if confidence >= 70%)
        dataframe['exit_short'] = (
            (dataframe['rsi'] < self.rsi_buy_threshold.value) |
            ((dataframe['close'] > dataframe['ema_short']) & (dataframe['confidence'] >= self.confidence_threshold.value))
        )

        # Debug: Log the number of exit signals
        self.logger.debug(f"Long exit signals: {dataframe['exit_long'].sum()} | Short exit signals: {dataframe['exit_short'].sum()}")
        return dataframe

    def custom_position_size(self, pair: str, current_time: pd.Timestamp, proposed_amount: float, **kwargs) -> float:
        """
        Dynamic position sizing based on risk and account balance:
        - Risk up to 10% of total balance per trade.
        - Ensure total open positions do not exceed 50% of total balance.
        """
        total_balance = self.wallets.get_total_balance(pair)
        open_positions_value = self.wallets.get_open_position_value(pair)

        # Limit total open positions to 50% of total balance
        available_balance = max(0, (total_balance * 0.5) - open_positions_value)
        if available_balance <= 0:
            self.logger.warning("No available balance for new positions.")
            return 0.0

        # Risk-based position sizing (10% of total balance per trade)
        risk_percentage = 0.10  # Dynamic risk percentage
        risk_amount = total_balance * risk_percentage

        # Calculate position size based on stoploss distance
        stoploss_distance = abs(self.stoploss)
        position_size = risk_amount / stoploss_distance

        # Ensure position size does not exceed available balance or proposed amount
        final_position_size = min(position_size, proposed_amount, available_balance)
        self.logger.debug(
            f"Dynamic position size calculated: {final_position_size} | Available balance: {available_balance} | Total balance: {total_balance}"
        )
        return final_position_size

    def get_signal_summary(self, dataframe: DataFrame) -> dict:
        """
        Generate signal summary for dashboard display.
        This method provides UI-friendly signal information.
        """
        if dataframe.empty:
            return {"error": "No data available"}
        
        latest = dataframe.iloc[-1]
        
        return {
            "current_price": float(latest['close']),
            "rsi": float(latest['rsi']),
            "ema_short": float(latest['ema_short']),
            "ema_long": float(latest['ema_long']),
            "confidence": float(latest['confidence']),
            "trend": "bullish" if latest['ema_short'] > latest['ema_long'] else "bearish",
            "rsi_zone": self._get_rsi_zone(latest['rsi']),
            "entry_signals": {
                "long": bool(latest.get('enter_long', False)),
                "short": bool(latest.get('enter_short', False))
            },
            "exit_signals": {
                "long": bool(latest.get('exit_long', False)),
                "short": bool(latest.get('exit_short', False))
            }
        }

    def _get_rsi_zone(self, rsi_value: float) -> str:
        """Get human-readable RSI zone for dashboard"""
        if rsi_value < 30:
            return "oversold"
        elif rsi_value > 70:
            return "overbought"
        elif rsi_value < 40:
            return "buy_zone"
        elif rsi_value > 60:
            return "sell_zone"
        else:
            return "neutral"