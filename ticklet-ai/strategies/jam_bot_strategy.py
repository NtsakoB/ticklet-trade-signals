from freqtrade.strategy import IStrategy, DecimalParameter, IntParameter, BooleanParameter
import talib.abstract as ta
import pandas as pd
from pandas import DataFrame
from functools import reduce


class JamBotStrategy(IStrategy):
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
        Populate entry trend signals in the dataframe.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping entry trend population.")
            return dataframe

        # Entry conditions
        dataframe['enter_long'] = (
            (dataframe['close'] > dataframe['ema_short']) &
            (dataframe['ema_short'] > dataframe['ema_long']) &
            (dataframe['rsi'] < self.rsi_buy_threshold.value)
        )

        # MACD filter
        if self.macd_enabled.value:
            dataframe['enter_long'] &= (
                (dataframe['macd'] > dataframe['macdsignal']) &
                (dataframe['macdhist'] > 0)
            )
            self.logger.debug("MACD filtering applied in entry conditions.")

        # ATR filter
        if self.atr_enabled.value:
            dataframe['enter_long'] &= (dataframe['atr'] > self.atr_threshold.value)
            self.logger.debug("ATR filtering applied in entry conditions.")

        # Debug: Log the number of entry signals
        self.logger.debug(f"Entry signals generated for {metadata.get('pair', 'unknown pair')}: {dataframe['enter_long'].sum()} signals.")
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Populate exit trend signals in the dataframe.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping exit trend population.")
            return dataframe

        # Exit conditions
        dataframe['exit_long'] = (
            (dataframe['rsi'] > self.rsi_sell_threshold.value) |
            (dataframe['close'] < dataframe['ema_short'])
        )

        # Debug: Log the number of exit signals
        self.logger.debug(f"Exit signals generated for {metadata.get('pair', 'unknown pair')}: {dataframe['exit_long'].sum()} signals.")
        return dataframe