# pragma pylint: disable=missing-docstring, invalid-name, pointless-string-statement
# flake8: noqa: F401
# isort: skip_file
# --- Do not remove these libs ---
import numpy as np
import pandas as pd
from pandas import DataFrame
from datetime import datetime
from typing import Optional, Union

from freqtrade.strategy import IStrategy, merge_informative_pair, stoploss_from_open, DecimalParameter, IntParameter, BooleanParameter
from freqtrade.persistence import Trade

# --------------------------------
# Trading Dashboard Strategy converted from your current logic
# This strategy replicates the signals and logic from your SignalGenerator component
# --------------------------------

class TradingDashboardStrategy(IStrategy):
    """
    Trading Dashboard Strategy - Converted from your existing React/TypeScript trading logic
    
    This strategy implements the same indicators, entry/exit logic, and risk management
    that you have in your current SignalGenerator component and related services.
    """

    # Strategy interface version - allow new iterating over different strategy configurations
    INTERFACE_VERSION = 3

    # Optimal timeframe for the strategy
    timeframe = '5m'

    # Can this strategy go short?
    can_short: bool = True

    # Minimal ROI designed for the strategy.
    # This attribute will be overridden if the config file contains "minimal_roi".
    minimal_roi = {
        "0": 0.08,   # 8% at any time (T3 target)
        "30": 0.05,  # 5% after 30 minutes (T2 target) 
        "60": 0.02,  # 2% after 60 minutes (T1 target)
        "120": 0.01  # 1% after 120 minutes (emergency exit)
    }

    # Optimal stoploss designed for the strategy.
    stoploss = -0.03  # 3% stop loss (matching your current logic)

    # Trailing stoploss
    trailing_stop = True
    trailing_stop_positive = 0.01  # Start trailing after 1% profit
    trailing_stop_positive_offset = 0.015  # Don't trail until 1.5% profit
    trailing_only_offset_is_reached = True

    # Dynamic leverage settings (matching your leverage calculation logic)
    leverage_min = 1
    leverage_max = 20

    # Optional order type mapping.
    order_types = {
        'entry': 'market',
        'exit': 'market',
        'stoploss': 'market',
        'stoploss_on_exchange': False
    }

    # Optimizable parameters (matching your filter criteria)
    minimum_volume = DecimalParameter(50000, 10000000, default=50000, space='buy', optimize=True)
    minimum_price_change = DecimalParameter(1.0, 10.0, default=1.0, space='buy', optimize=True)
    confidence_threshold = DecimalParameter(0.3, 0.95, default=0.7, space='buy', optimize=True)
    volatility_threshold = DecimalParameter(1.0, 10.0, default=2.0, space='buy', optimize=True)
    
    # RSI parameters (can be optimized)
    rsi_period = IntParameter(10, 21, default=14, space='buy', optimize=True)
    rsi_buy_threshold = IntParameter(20, 40, default=30, space='buy', optimize=True)
    rsi_sell_threshold = IntParameter(60, 80, default=70, space='sell', optimize=True)

    # Volume filter
    volume_filter_enabled = BooleanParameter(default=True, space='buy', optimize=True)

    def informative_pairs(self):
        """
        Define additional, informative pair/interval combinations to be cached from the exchange.
        These pairs will automatically be available during the entire backtesting sequence.
        """
        return []

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Adds several different TA indicators to the given DataFrame
        Mirrors the technical analysis from your EnhancedBinanceApi and SignalGenerator
        """
        
        # RSI - Relative Strength Index (matching your signal generation logic)
        dataframe['rsi'] = ta.RSI(dataframe['close'], timeperiod=self.rsi_period.value)
        
        # MACD - Moving Average Convergence Divergence
        macd = ta.MACD(dataframe['close'])
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        
        # EMA - Exponential Moving Averages
        dataframe['ema_9'] = ta.EMA(dataframe['close'], timeperiod=9)
        dataframe['ema_21'] = ta.EMA(dataframe['close'], timeperiod=21)
        dataframe['ema_50'] = ta.EMA(dataframe['close'], timeperiod=50)
        
        # SMA - Simple Moving Averages for trend confirmation
        dataframe['sma_20'] = ta.SMA(dataframe['close'], timeperiod=20)
        dataframe['sma_50'] = ta.SMA(dataframe['close'], timeperiod=50)
        
        # ATR - Average True Range for volatility calculation (matching your volatility logic)
        dataframe['atr'] = ta.ATR(dataframe, timeperiod=14)
        dataframe['volatility'] = (dataframe['atr'] / dataframe['close']) * 100
        
        # Volume analysis (matching your volume filter logic)
        dataframe['volume_sma'] = ta.SMA(dataframe['volume'], timeperiod=20)
        dataframe['volume_ratio'] = dataframe['volume'] / dataframe['volume_sma']
        
        # Price change calculation (matching your price change logic)
        dataframe['price_change_pct'] = dataframe['close'].pct_change() * 100
        dataframe['price_change_24h'] = dataframe['close'].pct_change(periods=288) * 100  # 24h change for 5m timeframe
        
        # USDT Volume calculation (matching your volume calculations)
        dataframe['usdt_volume'] = dataframe['volume'] * dataframe['close']
        
        # Bollinger Bands for support/resistance
        bollinger = ta.BBANDS(dataframe['close'], timeperiod=20, nbdevup=2, nbdevdn=2)
        dataframe['bb_lower'] = bollinger['lowerband']
        dataframe['bb_middle'] = bollinger['middleband']
        dataframe['bb_upper'] = bollinger['upperband']
        
        # Calculate confidence score (matching your confidence calculation logic)
        dataframe['base_confidence'] = np.where(dataframe['volatility'] > 0, 
                                                np.minimum(dataframe['volatility'] / 10 + 0.3, 0.9), 
                                                0.3)
        
        # Volume confidence boost (matching your volume factor logic)
        dataframe['volume_confidence'] = np.where(dataframe['usdt_volume'] > 10000000, 0.1,
                                                  np.where(dataframe['usdt_volume'] > 50000000, 0.2, 0))
        
        # Volatility confidence boost (matching your volatility factor logic)
        dataframe['volatility_confidence'] = np.where(dataframe['volatility'] > 3, 0.05,
                                                      np.where(dataframe['volatility'] > 7, 0.15, 0))
        
        # Final confidence calculation
        dataframe['confidence'] = np.minimum(dataframe['base_confidence'] + 
                                            dataframe['volume_confidence'] + 
                                            dataframe['volatility_confidence'], 0.95)
        
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Based on TA indicators, populates the entry signal for the given dataframe
        Mirrors your signal generation logic from SignalGenerator component
        """
        
        # Long entry conditions (BUY signals matching your logic)
        long_conditions = [
            # Basic trend conditions
            (dataframe['close'] > dataframe['ema_21']),  # Price above EMA21
            (dataframe['ema_9'] > dataframe['ema_21']),  # Short EMA above long EMA
            
            # RSI conditions (matching your oversold logic)
            (dataframe['rsi'] < self.rsi_buy_threshold.value),  # RSI oversold
            (dataframe['rsi'] > 25),  # Not too oversold
            
            # MACD bullish momentum
            (dataframe['macd'] > dataframe['macdsignal']),  # MACD above signal
            (dataframe['macdhist'] > 0),  # MACD histogram positive
            
            # Volume filter (matching your volume criteria)
            (dataframe['usdt_volume'] >= self.minimum_volume.value) if self.volume_filter_enabled.value else True,
            
            # Price change filter (matching your minimum price change logic)
            (abs(dataframe['price_change_24h']) >= self.minimum_price_change.value),
            
            # Volatility filter (matching your volatility threshold)
            (dataframe['volatility'] >= self.volatility_threshold.value),
            
            # Confidence filter (matching your confidence threshold)
            (dataframe['confidence'] >= self.confidence_threshold.value),
            
            # Additional momentum confirmation
            (dataframe['close'] > dataframe['bb_lower']),  # Above lower Bollinger band
            (dataframe['volume_ratio'] > 1.2),  # Above average volume
        ]
        
        # Apply all long conditions
        dataframe.loc[
            reduce(lambda x, y: x & y, long_conditions),
            'enter_long'
        ] = 1

        # Short entry conditions (SELL signals matching your logic)
        short_conditions = [
            # Basic trend conditions
            (dataframe['close'] < dataframe['ema_21']),  # Price below EMA21
            (dataframe['ema_9'] < dataframe['ema_21']),  # Short EMA below long EMA
            
            # RSI conditions (matching your overbought logic)
            (dataframe['rsi'] > self.rsi_sell_threshold.value),  # RSI overbought
            (dataframe['rsi'] < 75),  # Not too overbought
            
            # MACD bearish momentum
            (dataframe['macd'] < dataframe['macdsignal']),  # MACD below signal
            (dataframe['macdhist'] < 0),  # MACD histogram negative
            
            # Volume filter (matching your volume criteria)
            (dataframe['usdt_volume'] >= self.minimum_volume.value) if self.volume_filter_enabled.value else True,
            
            # Price change filter (matching your minimum price change logic)
            (abs(dataframe['price_change_24h']) >= self.minimum_price_change.value),
            
            # Volatility filter (matching your volatility threshold)
            (dataframe['volatility'] >= self.volatility_threshold.value),
            
            # Confidence filter (matching your confidence threshold)
            (dataframe['confidence'] >= self.confidence_threshold.value),
            
            # Additional momentum confirmation
            (dataframe['close'] < dataframe['bb_upper']),  # Below upper Bollinger band
            (dataframe['volume_ratio'] > 1.2),  # Above average volume
        ]
        
        # Apply all short conditions
        dataframe.loc[
            reduce(lambda x, y: x & y, short_conditions),
            'enter_short'
        ] = 1

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Based on TA indicators, populates the exit signal for the given dataframe
        Mirrors your take profit and exit logic
        """
        
        # Long exit conditions (matching your BUY signal exit logic)
        long_exit_conditions = [
            # RSI overbought exit
            (dataframe['rsi'] > 70),
            
            # MACD bearish divergence
            (dataframe['macd'] < dataframe['macdsignal']),
            
            # Price below key moving average
            (dataframe['close'] < dataframe['ema_9']),
            
            # Low volume (indicating momentum loss)
            (dataframe['volume_ratio'] < 0.8),
        ]
        
        dataframe.loc[
            reduce(lambda x, y: x | y, long_exit_conditions),  # OR condition for any exit signal
            'exit_long'
        ] = 1

        # Short exit conditions (matching your SELL signal exit logic)  
        short_exit_conditions = [
            # RSI oversold exit
            (dataframe['rsi'] < 30),
            
            # MACD bullish divergence
            (dataframe['macd'] > dataframe['macdsignal']),
            
            # Price above key moving average
            (dataframe['close'] > dataframe['ema_9']),
            
            # Low volume (indicating momentum loss)
            (dataframe['volume_ratio'] < 0.8),
        ]
        
        dataframe.loc[
            reduce(lambda x, y: x | y, short_exit_conditions),  # OR condition for any exit signal
            'exit_short'
        ] = 1

        return dataframe

    def leverage(self, pair: str, current_time: datetime, current_rate: float,
                 proposed_leverage: float, max_leverage: float, entry_tag: Optional[str], 
                 side: str, **kwargs) -> float:
        """
        Calculate leverage based on confidence and volatility (matching your leverage calculation)
        """
        # Get the latest dataframe for this pair
        dataframe, _ = self.dp.get_analyzed_dataframe(pair, self.timeframe)
        
        if dataframe.empty:
            return 1.0
            
        # Get the latest confidence and volatility values
        latest = dataframe.iloc[-1]
        confidence = latest.get('confidence', 0.7)
        volatility = latest.get('volatility', 2.0)
        
        # Calculate leverage based on confidence and volatility (matching your logic)
        # leverage = Math.max(1, Math.min(20, Math.floor((signalConfidence * 15) / (volatility / 2 + 1))));
        calculated_leverage = max(1, min(20, int((confidence * 15) / (volatility / 2 + 1))))
        
        # Ensure leverage is within bounds
        return min(calculated_leverage, max_leverage)

    def custom_stoploss(self, pair: str, trade: Trade, current_time: datetime,
                        current_rate: float, current_profit: float, **kwargs) -> float:
        """
        Custom stoploss logic - implements dynamic ATR-based stops when conditions are met
        """
        # Get the latest dataframe
        dataframe, _ = self.dp.get_analyzed_dataframe(pair, self.timeframe)
        
        if dataframe.empty:
            return self.stoploss
            
        latest = dataframe.iloc[-1]
        atr = latest.get('atr', 0)
        
        # If ATR is available and significant, use ATR-based stop (1.5x ATR as per optimization suggestions)
        if atr > 0 and current_rate > 0:
            atr_stoploss_distance = (atr * 1.5) / current_rate
            
            if trade.is_short:
                atr_stoploss = atr_stoploss_distance
            else:
                atr_stoploss = -atr_stoploss_distance
                
            # Use the more conservative stop (closer to entry)
            if trade.is_short:
                return min(self.stoploss, atr_stoploss)
            else:
                return max(self.stoploss, atr_stoploss)
        
        return self.stoploss

    def custom_sell(self, pair: str, trade: Trade, current_time: datetime, current_rate: float,
                    current_profit: float, **kwargs) -> Optional[Union[str, bool]]:
        """
        Custom exit logic implementing your T1, T2, T3 take profit levels
        """
        # T1 target: 2% profit (quick profit taking)
        if current_profit >= 0.02:
            return "T1_target_2pct"
            
        # T2 target: 5% profit 
        if current_profit >= 0.05:
            return "T2_target_5pct"
            
        # T3 target: 8% profit
        if current_profit >= 0.08:
            return "T3_target_8pct"
            
        return None

    def confirm_trade_entry(self, pair: str, order_type: str, amount: float, rate: float,
                           time_in_force: str, current_time: datetime, entry_tag: Optional[str],
                           side: str, **kwargs) -> bool:
        """
        Trade entry confirmation - implements additional safety checks
        """
        # Get latest market data
        dataframe, _ = self.dp.get_analyzed_dataframe(pair, self.timeframe)
        
        if dataframe.empty:
            return False
            
        latest = dataframe.iloc[-1]
        
        # Final safety checks before entry
        confidence = latest.get('confidence', 0)
        usdt_volume = latest.get('usdt_volume', 0)
        volatility = latest.get('volatility', 0)
        
        # Ensure minimum criteria are still met
        if confidence < self.confidence_threshold.value:
            return False
            
        if self.volume_filter_enabled.value and usdt_volume < self.minimum_volume.value:
            return False
            
        if volatility < self.volatility_threshold.value:
            return False
            
        return True

    def version(self) -> str:
        """
        Returns version of the strategy.
        """
        return "1.0"


# Required import at the end for technical analysis functions
import talib.abstract as ta
from functools import reduce