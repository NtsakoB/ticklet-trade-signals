from freqtrade.strategy import DecimalParameter, IntParameter, BooleanParameter
import talib.abstract as ta
import pandas as pd
from pandas import DataFrame
from functools import reduce
from ticklet_ai.strategies.base_strategy import BaseStrategy


class JamBotStrategy(BaseStrategy):
    """
    JAM Bot Strategy: A momentum-based strategy using EMA, RSI, and optional MACD and ATR filtering.
    Adopts Ticklet Alpha ROI and stop-loss logic for bullish market conditions.
    """

    INTERFACE_VERSION = 3
    timeframe = '5m'
    can_short = False

    # ROI tiers (Ticklet Alpha style)
    minimal_roi = {
        "0": 0.10,  # 10% ROI immediately
        "30": 0.05,  # 5% ROI after 30 mins
        "60": 0.02,  # 2% ROI after 1 hr
        "120": 0.01  # 1% emergency exit after 2 hrs
    }

    # Stoploss
    stoploss = -0.04  # 4% stoploss
    trailing_stop = True
    trailing_stop_positive = 0.01  # Start trailing after 1% profit
    trailing_stop_positive_offset = 0.02  # Only activate trailing stop after 2% profit
    trailing_only_offset_is_reached = True

    # Parameters
    rsi_period = IntParameter(10, 30, default=14, space='buy', optimize=True)
    rsi_buy_threshold = IntParameter(20, 40, default=30, space='buy', optimize=True)
    rsi_sell_threshold = IntParameter(60, 80, default=70, space='sell', optimize=True)
    ema_short_period = IntParameter(5, 15, default=10, space='buy', optimize=True)
    ema_long_period = IntParameter(20, 50, default=25, space='buy', optimize=True)
    macd_enabled = BooleanParameter(default=True, space='buy', optimize=True)
    atr_enabled = BooleanParameter(default=True, space='buy', optimize=True)
    atr_period = IntParameter(10, 30, default=14, space='buy', optimize=True)
    atr_threshold = DecimalParameter(0.5, 5.0, default=2.5, space='buy', optimize=True)

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

        # MACD (optional)
        if self.macd_enabled.value:
            macd = ta.MACD(dataframe['close'])
            dataframe['macd'] = macd['macd']
            dataframe['macdsignal'] = macd['macdsignal']
            dataframe['macdhist'] = macd['macdhist']
            self.logger.debug("MACD indicators calculated.")

        # ATR (optional)
        if self.atr_enabled.value:
            dataframe['atr'] = ta.ATR(dataframe, timeperiod=self.atr_period.value)
            self.logger.debug("ATR indicator calculated.")

        # Debug: Log indicator calculations
        self.logger.debug(f"Indicators populated for {metadata.get('pair', 'unknown pair')}.")
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
        base_conditions = (
            (dataframe['close'] > dataframe['ema_short']) &
            (dataframe['ema_short'] > dataframe['ema_long']) &
            (dataframe['rsi'] < self.rsi_buy_threshold.value)
        )

        # MACD filter
        if self.macd_enabled.value:
            base_conditions &= (
                (dataframe['macd'] > dataframe['macdsignal']) &
                (dataframe['macdhist'] > 0)
            )

        # ATR filter
        if self.atr_enabled.value:
            base_conditions &= (dataframe['atr'] > self.atr_threshold.value)

        # Apply AI weighting to entry signals
        dataframe['enter_long'] = base_conditions & (ai_decision['buy'] > 0.6)

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
        base_exit = (
            (dataframe['rsi'] > self.rsi_sell_threshold.value) |
            (dataframe['close'] < dataframe['ema_short'])
        )

        # Apply AI weighting to exit signals
        dataframe['exit_long'] = base_exit | (ai_decision['sell'] > 0.7)

        return super().populate_exit_trend(dataframe, metadata)