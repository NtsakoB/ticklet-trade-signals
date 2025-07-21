from freqtrade.strategy import IStrategy, DecimalParameter, IntParameter, BooleanParameter
import talib.abstract as ta
import pandas as pd
from pandas import DataFrame


class BullStrategy(IStrategy):
    """
    Bull Strategy with multi-timeframe support and AI-ready indicator collection:
    - Optimized for bullish market conditions with EMA, RSI, MACD, and ATR
    - Clean indicator collection for AI input evaluation
    - Dynamic position sizing based on risk level and confidence
    - Ready to connect with ai_signal_evaluator.py
    """

    INTERFACE_VERSION = 3
    timeframe = '5m'
    can_short = False

    # ROI tiers (Ticklet Alpha style)
    minimal_roi = {
        "0": 0.08,
        "30": 0.05,
        "60": 0.02,
        "120": 0.01
    }

    # Stoploss
    stoploss = -0.03
    trailing_stop = True
    trailing_stop_positive = 0.01
    trailing_stop_positive_offset = 0.015
    trailing_only_offset_is_reached = True

    # Parameters
    rsi_period = IntParameter(10, 30, default=14, space='buy', optimize=True)
    rsi_buy_threshold = IntParameter(20, 40, default=30, space='buy', optimize=True)
    rsi_sell_threshold = IntParameter(60, 80, default=70, space='sell', optimize=True)
    ema_short_period = IntParameter(5, 15, default=9, space='buy', optimize=True)
    ema_long_period = IntParameter(20, 50, default=21, space='buy', optimize=True)
    macd_enabled = BooleanParameter(default=False, space='buy', optimize=True)
    atr_enabled = BooleanParameter(default=False, space='buy', optimize=True)
    atr_period = IntParameter(10, 30, default=14, space='buy', optimize=True)
    atr_threshold = DecimalParameter(0.5, 5.0, default=2.0, space='buy', optimize=True)
    confidence_threshold = DecimalParameter(0.6, 1.0, default=0.75, space='buy', optimize=True)

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Populate indicators with clean structure for AI evaluation.
        Multi-timeframe ready with comprehensive technical analysis features.
        """
        if dataframe.empty or 'close' not in dataframe.columns:
            self.logger.warning("Dataframe is empty or missing 'close' column.")
            return dataframe

        # EMA indicators for trend analysis
        dataframe['ema_short'] = ta.EMA(dataframe['close'], timeperiod=self.ema_short_period.value)
        dataframe['ema_long'] = ta.EMA(dataframe['close'], timeperiod=self.ema_long_period.value)
        dataframe['ema_trend'] = dataframe['ema_short'] - dataframe['ema_long']

        # RSI for momentum analysis
        dataframe['rsi'] = ta.RSI(dataframe['close'], timeperiod=self.rsi_period.value)

        # MACD for trend confirmation (optional)
        if self.macd_enabled.value:
            macd = ta.MACD(dataframe['close'])
            dataframe['macd'] = macd['macd']
            dataframe['macdsignal'] = macd['macdsignal']
            dataframe['macdhist'] = macd['macdhist']
            self.logger.debug("MACD indicators calculated.")

        # ATR for volatility assessment (optional)
        if self.atr_enabled.value:
            dataframe['atr'] = ta.ATR(dataframe, timeperiod=self.atr_period.value)
            dataframe['atr_normalized'] = dataframe['atr'] / dataframe['close']
            self.logger.debug("ATR indicators calculated.")

        # Confidence metric (bull market strength indicator)
        dataframe['bull_strength'] = (
            (dataframe['close'] / dataframe['ema_short'] - 1) * 100 +
            (100 - dataframe['rsi']) / 100
        ) / 2
        dataframe['confidence'] = dataframe['bull_strength'].rolling(window=5).mean()

        # Volume-based indicators for confirmation
        if 'volume' in dataframe.columns:
            dataframe['volume_sma'] = ta.SMA(dataframe['volume'], timeperiod=20)
            dataframe['volume_ratio'] = dataframe['volume'] / dataframe['volume_sma']

        self.logger.debug(f"Bull strategy indicators populated for {metadata.get('pair', 'unknown pair')}.")
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        AI-ready entry trend with confidence-based filtering for bull market conditions.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping entry trend population.")
            return dataframe

        # Core bull market entry conditions
        base_conditions = (
            (dataframe['close'] > dataframe['ema_short']) &
            (dataframe['ema_short'] > dataframe['ema_long']) &
            (dataframe['rsi'] < self.rsi_buy_threshold.value) &
            (dataframe['confidence'] >= self.confidence_threshold.value)
        )

        dataframe['enter_long'] = base_conditions

        # Enhanced MACD filter for stronger confirmation
        if self.macd_enabled.value:
            dataframe['enter_long'] &= (
                (dataframe['macd'] > dataframe['macdsignal']) &
                (dataframe['macdhist'] > 0)
            )
            self.logger.debug("MACD filtering applied with bull market confirmation.")

        # ATR filter for optimal volatility conditions
        if self.atr_enabled.value:
            dataframe['enter_long'] &= (dataframe['atr_normalized'] > self.atr_threshold.value / 100)
            self.logger.debug("ATR volatility filtering applied.")

        # Volume confirmation if available
        if 'volume_ratio' in dataframe.columns:
            dataframe['enter_long'] &= (dataframe['volume_ratio'] > 1.2)

        self.logger.debug(f"Bull entry signals with confidence >= {self.confidence_threshold.value}: {dataframe['enter_long'].sum()}")
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Confidence-based exit logic optimized for bull market protection.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping exit trend population.")
            return dataframe

        # Exit conditions with confidence consideration
        dataframe['exit_long'] = (
            (dataframe['rsi'] > self.rsi_sell_threshold.value) |
            (dataframe['close'] < dataframe['ema_short']) |
            (dataframe['confidence'] < (self.confidence_threshold.value * 0.7))
        )

        self.logger.debug(f"Bull exit signals generated: {dataframe['exit_long'].sum()}")
        return dataframe

    def custom_position_size(self, pair: str, current_time: pd.Timestamp, proposed_amount: float, **kwargs) -> float:
        """
        Dynamic position sizing based on bull market confidence and risk management.
        """
        try:
            total_balance = self.wallets.get_total_balance()
            open_positions_value = sum([trade.stake_amount for trade in self.trades])

            # Bull market allows higher allocation but still risk-managed
            max_allocation = 0.6  # 60% max for bull strategy
            available_balance = max(0, (total_balance * max_allocation) - open_positions_value)
            
            if available_balance <= 0:
                self.logger.warning("Maximum bull strategy allocation reached.")
                return 0.0

            # Risk per trade based on total balance (8% for bull markets)
            risk_per_trade = total_balance * 0.08
            stoploss_distance = abs(self.stoploss)
            position_size = risk_per_trade / stoploss_distance

            final_size = min(position_size, proposed_amount, available_balance)
            self.logger.debug(f"Bull strategy position size: {final_size} (Risk: {risk_per_trade})")
            return final_size
            
        except Exception as e:
            self.logger.error(f"Position sizing error: {e}")
            return proposed_amount * 0.1  # Conservative fallback