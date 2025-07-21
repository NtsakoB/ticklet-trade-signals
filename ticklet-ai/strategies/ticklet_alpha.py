from freqtrade.strategy import DecimalParameter, IntParameter, BooleanParameter
import talib.abstract as ta
import pandas as pd
from pandas import DataFrame
from ticklet_ai.strategies.base_strategy import BaseStrategy


class TickletAlphaStrategy(BaseStrategy):
    """
    Ticklet Alpha Strategy with long and short trading logic:
    - Short trades are allowed only with confidence >= 70% on sell signals.
    - Dynamic position sizing adjusts trade sizes based on risk level and account balance.
    - Ensures total open positions do not exceed 50% of the total balance.
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
        Enhanced entry trend with multi-timeframe analysis and AI decision making.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping entry trend population.")
            return dataframe

        # Get multi-timeframe signals
        pair = metadata.get('pair', 'UNKNOWN')
        mtf_signals = self.multi_timeframe_analysis(dataframe, pair)
        ai_decision = self.ai_decision(mtf_signals)

        # Base entry conditions
        base_long = (
            (dataframe['close'] > dataframe['ema_short']) &
            (dataframe['ema_short'] > dataframe['ema_long']) &
            (dataframe['rsi'] < self.rsi_buy_threshold.value)
        )

        base_short = (
            (dataframe['close'] < dataframe['ema_short']) &
            (dataframe['ema_short'] < dataframe['ema_long']) &
            (dataframe['confidence'] >= self.confidence_threshold.value) &
            (dataframe['rsi'] > self.rsi_sell_threshold.value)
        )

        # Apply AI weighting to entry signals
        dataframe['enter_long'] = base_long & (ai_decision['buy'] > 0.6)
        dataframe['enter_short'] = base_short & (ai_decision['sell'] > 0.6)

        self.logger.debug(f"AI Decision - Buy: {ai_decision['buy']:.2f}, Sell: {ai_decision['sell']:.2f}")
        return super().populate_entry_trend(dataframe, metadata)

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Enhanced exit trend with multi-timeframe analysis and AI decision making.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping exit trend population.")
            return dataframe

        # Get multi-timeframe signals for exit
        pair = metadata.get('pair', 'UNKNOWN')
        mtf_signals = self.multi_timeframe_analysis(dataframe, pair)
        ai_decision = self.ai_decision(mtf_signals)

        # Base exit conditions
        base_long_exit = (
            (dataframe['rsi'] > self.rsi_sell_threshold.value) |
            (dataframe['close'] < dataframe['ema_short'])
        )

        base_short_exit = (
            (dataframe['rsi'] < self.rsi_buy_threshold.value) |
            ((dataframe['close'] > dataframe['ema_short']) & (dataframe['confidence'] >= self.confidence_threshold.value))
        )

        # Apply AI weighting to exit signals
        dataframe['exit_long'] = base_long_exit | (ai_decision['sell'] > 0.7)
        dataframe['exit_short'] = base_short_exit | (ai_decision['buy'] > 0.7)

        return super().populate_exit_trend(dataframe, metadata)