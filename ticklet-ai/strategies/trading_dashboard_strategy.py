from freqtrade.strategy import IStrategy, DecimalParameter, IntParameter, BooleanParameter
import talib.abstract as ta
import pandas as pd
from pandas import DataFrame


class TradingDashboardStrategy(IStrategy):
    """
    Trading Dashboard Strategy - Frontend Visualization Mirror of Ticklet Alpha:
    - Human-readable conditions for dashboard visualization
    - Rule-based logic for quick testing and signal summaries
    - UI-compatible signal formatting for React components
    """

    INTERFACE_VERSION = 3
    timeframe = '5m'
    can_short = True  # Enable shorting for visualization

    # ROI tiers (mirror of Alpha strategy)
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

    # Parameters (mirror of Alpha strategy for consistency)
    rsi_period = IntParameter(10, 30, default=14, space='buy', optimize=True)
    rsi_buy_threshold = IntParameter(20, 40, default=30, space='buy', optimize=True)
    rsi_sell_threshold = IntParameter(60, 80, default=70, space='sell', optimize=True)
    ema_short_period = IntParameter(5, 15, default=9, space='buy', optimize=True)
    ema_long_period = IntParameter(20, 50, default=21, space='buy', optimize=True)
    confidence_threshold = DecimalParameter(0.7, 1.0, default=0.70, space='sell', optimize=True)
    
    # UI-specific parameters for dashboard visualization
    signal_strength_filter = BooleanParameter(default=True, space='buy', optimize=False)
    show_weak_signals = BooleanParameter(default=False, space='buy', optimize=False)

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Populate indicators in the dataframe - mirror of Alpha strategy.
        """
        if dataframe.empty or 'close' not in dataframe.columns:
            self.logger.warning("Dataframe is empty or missing 'close' column.")
            return dataframe

        # Core indicators (same as Alpha strategy)
        dataframe['ema_short'] = ta.EMA(dataframe['close'], timeperiod=self.ema_short_period.value)
        dataframe['ema_long'] = ta.EMA(dataframe['close'], timeperiod=self.ema_long_period.value)
        dataframe['rsi'] = ta.RSI(dataframe['close'], timeperiod=self.rsi_period.value)
        
        # Enhanced confidence calculation for UI display
        dataframe['confidence'] = self._calculate_ui_confidence(dataframe)
        
        # Additional UI indicators for dashboard visualization
        dataframe['trend_strength'] = abs(dataframe['ema_short'] - dataframe['ema_long']) / dataframe['close']
        dataframe['signal_quality'] = self._calculate_signal_quality(dataframe)
        
        self.logger.debug("Dashboard indicators calculated for UI visualization.")
        return dataframe

    def _calculate_ui_confidence(self, dataframe: DataFrame) -> pd.Series:
        """Calculate confidence metric optimized for UI display"""
        # Base confidence from RSI position
        rsi_confidence = 1 - (abs(dataframe['rsi'] - 50) / 50)
        
        # Trend confirmation boost
        trend_conf = (dataframe['ema_short'] > dataframe['ema_long']).astype(float) * 0.2
        
        # Combine factors
        confidence = (rsi_confidence * 0.7) + (trend_conf * 0.3)
        return confidence.clip(0.1, 0.95)

    def _calculate_signal_quality(self, dataframe: DataFrame) -> pd.Series:
        """Calculate signal quality for dashboard filtering"""
        quality = pd.Series(0.5, index=dataframe.index)
        
        # RSI not in extreme zones
        rsi_quality = ((dataframe['rsi'] > 25) & (dataframe['rsi'] < 75)).astype(float) * 0.3
        
        # EMA alignment
        ema_quality = (abs(dataframe['ema_short'] - dataframe['ema_long']) > 0.001).astype(float) * 0.4
        
        # Price position relative to EMAs
        price_quality = ((dataframe['close'] > dataframe['ema_short']) | 
                        (dataframe['close'] < dataframe['ema_short'])).astype(float) * 0.3
        
        return (rsi_quality + ema_quality + price_quality).clip(0.0, 1.0)

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Populate entry trend signals - human-readable conditions for dashboard.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping entry trend population.")
            return dataframe

        # Long entry conditions (clear, readable logic)
        bullish_trend = dataframe['ema_short'] > dataframe['ema_long']
        price_above_ema = dataframe['close'] > dataframe['ema_short']
        rsi_buy_zone = dataframe['rsi'] < self.rsi_buy_threshold.value
        sufficient_confidence = dataframe['confidence'] >= 0.5  # Lower threshold for UI visibility
        
        dataframe['enter_long'] = (
            bullish_trend &
            price_above_ema &
            rsi_buy_zone &
            sufficient_confidence
        )

        # Short entry conditions (with confidence filtering for dashboard)
        bearish_trend = dataframe['ema_short'] < dataframe['ema_long']
        price_below_ema = dataframe['close'] < dataframe['ema_short']
        rsi_sell_zone = dataframe['rsi'] > self.rsi_sell_threshold.value
        high_confidence = dataframe['confidence'] >= self.confidence_threshold.value
        
        dataframe['enter_short'] = (
            bearish_trend &
            price_below_ema &
            rsi_sell_zone &
            high_confidence
        )

        # Apply signal quality filter if enabled
        if self.signal_strength_filter.value:
            quality_filter = dataframe['signal_quality'] > 0.6
            dataframe['enter_long'] &= quality_filter
            dataframe['enter_short'] &= quality_filter

        # Log signals for dashboard monitoring
        long_signals = dataframe['enter_long'].sum()
        short_signals = dataframe['enter_short'].sum()
        self.logger.info(f"Dashboard signals - Long: {long_signals} | Short: {short_signals} | Pair: {metadata.get('pair', 'unknown')}")
        
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Populate exit trend signals - clear exit conditions for dashboard display.
        """
        if dataframe.empty:
            self.logger.warning("Dataframe is empty. Skipping exit trend population.")
            return dataframe

        # Long exit conditions (readable logic)
        rsi_overbought = dataframe['rsi'] > self.rsi_sell_threshold.value
        price_below_ema = dataframe['close'] < dataframe['ema_short']
        weak_confidence = dataframe['confidence'] < 0.3
        
        dataframe['exit_long'] = (
            rsi_overbought |
            price_below_ema |
            weak_confidence
        )

        # Short exit conditions (with confidence check)
        rsi_oversold = dataframe['rsi'] < self.rsi_buy_threshold.value
        price_above_ema = dataframe['close'] > dataframe['ema_short']
        insufficient_confidence = dataframe['confidence'] < self.confidence_threshold.value
        
        dataframe['exit_short'] = (
            rsi_oversold |
            (price_above_ema & insufficient_confidence)
        )

        # Log exit signals for dashboard
        long_exits = dataframe['exit_long'].sum()
        short_exits = dataframe['exit_short'].sum()
        self.logger.debug(f"Dashboard exits - Long: {long_exits} | Short: {short_exits}")
        
        return dataframe

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
            "signal_quality": float(latest['signal_quality']),
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