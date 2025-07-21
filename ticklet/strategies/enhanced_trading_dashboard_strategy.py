"""
Enhanced Trading Dashboard Strategy with all improvements applied:
- Robust error handling
- Performance optimizations
- Code reusability
- Enhanced readability
- Configurability
- Logging and testing support
"""
import logging
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Union
import talib

from .base_strategy import BaseStrategy

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedTradingDashboardStrategy(BaseStrategy):
    """
    Enhanced Trading Dashboard Strategy implementing all best practices
    for error handling, performance, maintainability, and robustness.
    """
    
    # Configuration constants
    DEFAULT_RSI_PERIOD = 14
    DEFAULT_MACD_FAST = 12
    DEFAULT_MACD_SLOW = 26
    DEFAULT_MACD_SIGNAL = 9
    DEFAULT_EMA_SHORT = 9
    DEFAULT_EMA_LONG = 21
    DEFAULT_SMA_VOLUME = 20
    DEFAULT_BB_PERIOD = 20
    DEFAULT_BB_STD = 2
    
    def __init__(self, timeframe: str = '5m', config: Optional[Dict] = None):
        """
        Initialize strategy with configurable parameters.
        
        :param timeframe: Trading timeframe
        :param config: Optional configuration dictionary
        """
        super().__init__(timeframe)
        
        # Load configuration
        self.config = config or {}
        
        # Strategy parameters (configurable)
        self.minimum_volume = self.config.get('minimum_volume', 1000000)
        self.minimum_price_change = self.config.get('minimum_price_change', 1.0)
        self.confidence_threshold = self.config.get('confidence_threshold', 0.65)
        self.volatility_threshold = self.config.get('volatility_threshold', 2.0)
        self.atr_multiplier = self.config.get('atr_multiplier', 1.5)
        
        # Technical indicator parameters
        self.rsi_period = self.config.get('rsi_period', self.DEFAULT_RSI_PERIOD)
        self.rsi_buy_threshold = self.config.get('rsi_buy_threshold', 30)
        self.rsi_sell_threshold = self.config.get('rsi_sell_threshold', 70)
        self.volume_filter_enabled = self.config.get('volume_filter_enabled', True)
        
        # Order types and risk management
        self.order_types = {
            'entry': 'limit',
            'exit': 'limit',
            'stoploss': 'market',
            'stoploss_on_exchange': False,
        }
        
        self.trailing_stop = True
        self.trailing_stop_positive = 0.01
        self.trailing_stop_positive_offset = 0.015
        self.trailing_only_offset_is_reached = True
        
        logger.info(f"Enhanced Strategy initialized with config: {self.config}")
    
    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Add technical indicators to the dataframe with optimizations and error handling.
        
        :param dataframe: OHLCV DataFrame
        :param metadata: Strategy metadata
        :return: DataFrame with indicators
        :raises ValueError: If dataframe validation fails
        """
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        self.validate_dataframe(dataframe, required_columns)
        
        try:
            logger.info(f"Populating indicators for {metadata.get('pair', 'unknown pair')}")
            
            # Precompute common values for performance
            close_prices = dataframe['close'].values
            high_prices = dataframe['high'].values
            low_prices = dataframe['low'].values
            volume_data = dataframe['volume'].values
            
            # RSI with error handling
            try:
                dataframe['rsi'] = talib.RSI(close_prices, timeperiod=self.rsi_period)
            except Exception as e:
                logger.warning(f"RSI calculation failed: {e}. Using fallback.")
                dataframe['rsi'] = 50.0  # Neutral fallback
            
            # MACD with error handling
            try:
                macd, macd_signal, macd_hist = talib.MACD(
                    close_prices, 
                    fastperiod=self.DEFAULT_MACD_FAST,
                    slowperiod=self.DEFAULT_MACD_SLOW, 
                    signalperiod=self.DEFAULT_MACD_SIGNAL
                )
                dataframe['macd'] = macd
                dataframe['macd_signal'] = macd_signal
                dataframe['macd_hist'] = macd_hist
            except Exception as e:
                logger.warning(f"MACD calculation failed: {e}. Using fallback.")
                dataframe['macd'] = 0.0
                dataframe['macd_signal'] = 0.0
                dataframe['macd_hist'] = 0.0
            
            # EMAs with vectorized operations
            try:
                dataframe['ema_9'] = talib.EMA(close_prices, timeperiod=self.DEFAULT_EMA_SHORT)
                dataframe['ema_21'] = talib.EMA(close_prices, timeperiod=self.DEFAULT_EMA_LONG)
            except Exception as e:
                logger.warning(f"EMA calculation failed: {e}. Using SMA fallback.")
                dataframe['ema_9'] = talib.SMA(close_prices, timeperiod=self.DEFAULT_EMA_SHORT)
                dataframe['ema_21'] = talib.SMA(close_prices, timeperiod=self.DEFAULT_EMA_LONG)
            
            # Simple Moving Averages
            dataframe['sma_50'] = talib.SMA(close_prices, timeperiod=50)
            dataframe['sma_200'] = talib.SMA(close_prices, timeperiod=200)
            
            # ATR for stop loss calculations
            dataframe['atr'] = talib.ATR(high_prices, low_prices, close_prices, timeperiod=14)
            
            # Bollinger Bands
            try:
                bb_upper, bb_middle, bb_lower = talib.BBANDS(
                    close_prices, 
                    timeperiod=self.DEFAULT_BB_PERIOD,
                    nbdevup=self.DEFAULT_BB_STD, 
                    nbdevdn=self.DEFAULT_BB_STD
                )
                dataframe['bb_lower'] = bb_lower
                dataframe['bb_middle'] = bb_middle
                dataframe['bb_upper'] = bb_upper
                dataframe['bb_percent'] = (close_prices - bb_lower) / (bb_upper - bb_lower)
            except Exception as e:
                logger.warning(f"Bollinger Bands calculation failed: {e}")
                dataframe['bb_lower'] = close_prices * 0.98
                dataframe['bb_upper'] = close_prices * 1.02
                dataframe['bb_percent'] = 0.5
            
            # Volume indicators (optimized)
            dataframe['volume_sma'] = talib.SMA(volume_data, timeperiod=self.DEFAULT_SMA_VOLUME)
            dataframe['volume_ratio'] = dataframe['volume'] / dataframe['volume_sma']
            
            # Price and volume calculations (vectorized)
            dataframe['usdt_volume'] = dataframe['close'] * dataframe['volume']
            dataframe['price_change_pct'] = dataframe['close'].pct_change() * 100
            dataframe['volatility'] = dataframe['price_change_pct'].rolling(window=14).std()
            
            # Confidence calculation (extracted to helper method)
            dataframe['confidence'] = self._calculate_confidence_vectorized(
                dataframe['volatility'].fillna(1.0), 
                dataframe['usdt_volume'].fillna(0)
            )
            
            # Fill NaN values with safe defaults
            dataframe.fillna(method='bfill', inplace=True)
            dataframe.fillna(0, inplace=True)
            
            logger.info("Indicators populated successfully")
            return dataframe
            
        except Exception as e:
            logger.error(f"Critical error in populate_indicators: {e}")
            raise ValueError(f"Failed to populate indicators: {e}")
    
    def _calculate_confidence_vectorized(self, volatility: pd.Series, usdt_volume: pd.Series) -> pd.Series:
        """
        Vectorized confidence calculation for better performance.
        
        :param volatility: Volatility series
        :param usdt_volume: USDT volume series
        :return: Confidence series
        """
        try:
            base_confidence = np.minimum(volatility / 10 + 0.3, 0.9)
            
            # Volume confidence boost (vectorized)
            volume_confidence = np.where(usdt_volume > 100000000, 0.1,
                                       np.where(usdt_volume > 50000000, 0.05, 0.0))
            
            # Volatility confidence adjustment (vectorized)
            volatility_confidence = np.where(volatility > 7, 0.15,
                                           np.where(volatility > 3, 0.05, 0.0))
            
            return np.minimum(base_confidence + volume_confidence + volatility_confidence, 0.95)
        
        except Exception as e:
            logger.error(f"Error in vectorized confidence calculation: {e}")
            return pd.Series([0.5] * len(volatility))
    
    def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Define entry conditions with extracted common logic.
        
        :param dataframe: DataFrame with indicators
        :param metadata: Strategy metadata
        :return: DataFrame with entry signals
        """
        try:
            # Common trend conditions (extracted to helper methods)
            uptrend = self.is_trending_up(dataframe)
            downtrend = self.is_trending_down(dataframe)
            
            # Volume and confidence filters
            volume_ok = self._volume_filter(dataframe) if self.volume_filter_enabled else True
            confidence_ok = dataframe['confidence'] >= self.confidence_threshold
            
            # RSI conditions
            rsi_oversold = dataframe['rsi'] < self.rsi_buy_threshold
            rsi_overbought = dataframe['rsi'] > self.rsi_sell_threshold
            
            # MACD conditions
            macd_bullish = (dataframe['macd'] > dataframe['macd_signal']) & (dataframe['macd_hist'] > 0)
            macd_bearish = (dataframe['macd'] < dataframe['macd_signal']) & (dataframe['macd_hist'] < 0)
            
            # Price change filter
            significant_move = abs(dataframe['price_change_pct']) >= self.minimum_price_change
            
            # Long entry conditions
            long_conditions = (
                uptrend &
                rsi_oversold &
                macd_bullish &
                volume_ok &
                confidence_ok &
                significant_move &
                (dataframe['volatility'] >= self.volatility_threshold)
            )
            
            # Short entry conditions
            short_conditions = (
                downtrend &
                rsi_overbought &
                macd_bearish &
                volume_ok &
                confidence_ok &
                significant_move &
                (dataframe['volatility'] >= self.volatility_threshold)
            )
            
            dataframe.loc[long_conditions, 'enter_long'] = 1
            dataframe.loc[short_conditions, 'enter_short'] = 1
            
            logger.info(f"Entry trends populated. Long signals: {long_conditions.sum()}, Short signals: {short_conditions.sum()}")
            return dataframe
            
        except Exception as e:
            logger.error(f"Error in populate_entry_trend: {e}")
            return dataframe
    
    def _volume_filter(self, dataframe: pd.DataFrame) -> pd.Series:
        """
        Volume filter logic extracted for reusability.
        
        :param dataframe: DataFrame with volume data
        :return: Boolean series for volume filter
        """
        return (
            (dataframe['usdt_volume'] >= self.minimum_volume) &
            (dataframe['volume_ratio'] >= 1.5)
        )
    
    def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Define exit conditions with proper error handling.
        
        :param dataframe: DataFrame with indicators
        :param metadata: Strategy metadata
        :return: DataFrame with exit signals
        """
        try:
            # RSI exit conditions
            rsi_exit_long = dataframe['rsi'] > 75
            rsi_exit_short = dataframe['rsi'] < 25
            
            # MACD exit conditions
            macd_exit_long = (dataframe['macd'] < dataframe['macd_signal']) & (dataframe['macd_hist'] < 0)
            macd_exit_short = (dataframe['macd'] > dataframe['macd_signal']) & (dataframe['macd_hist'] > 0)
            
            # Volume-based exits
            low_volume_exit = dataframe['volume_ratio'] < 0.5
            
            # Combined exit conditions
            exit_long = rsi_exit_long | macd_exit_long | low_volume_exit
            exit_short = rsi_exit_short | macd_exit_short | low_volume_exit
            
            dataframe.loc[exit_long, 'exit_long'] = 1
            dataframe.loc[exit_short, 'exit_short'] = 1
            
            logger.info("Exit trends populated successfully")
            return dataframe
            
        except Exception as e:
            logger.error(f"Error in populate_exit_trend: {e}")
            return dataframe
    
    def leverage(self, pair: str, current_time: datetime, current_rate: float, 
                proposed_leverage: float, max_leverage: float, entry_tag: Optional[str], 
                side: str, **kwargs) -> float:
        """
        Calculate dynamic leverage with enhanced error handling.
        
        :param pair: Trading pair
        :param current_time: Current timestamp
        :param current_rate: Current price
        :param proposed_leverage: Proposed leverage from strategy
        :param max_leverage: Maximum allowed leverage
        :param entry_tag: Entry tag
        :param side: Trade side ('long' or 'short')
        :return: Calculated leverage
        """
        try:
            # Get the latest dataframe (this would come from the backtesting framework)
            # For now, we'll use default confidence and volatility
            confidence = kwargs.get('confidence', 0.7)
            volatility = kwargs.get('volatility', 3.0)
            
            leverage = self.calculate_dynamic_leverage(confidence, volatility, max_leverage)
            
            logger.info(f"Calculated leverage for {pair}: {leverage} (confidence: {confidence:.2f}, volatility: {volatility:.2f})")
            return leverage
            
        except Exception as e:
            logger.error(f"Error calculating leverage for {pair}: {e}")
            return 1.0  # Safe fallback
    
    def custom_stoploss(self, pair: str, trade, current_time: datetime, 
                       current_rate: float, current_profit: float, **kwargs) -> float:
        """
        Implement ATR-based dynamic stop loss.
        
        :param pair: Trading pair
        :param trade: Trade object
        :param current_time: Current timestamp
        :param current_rate: Current price
        :param current_profit: Current profit percentage
        :return: Stop loss price ratio
        """
        try:
            if not trade or not hasattr(trade, 'open_rate'):
                logger.warning(f"Invalid trade object for {pair}")
                return self.stoploss
            
            # Get ATR from kwargs or calculate default
            atr = kwargs.get('atr', current_rate * 0.02)  # 2% default ATR
            
            # Determine trade direction
            signal_type = 'long' if trade.is_open and not getattr(trade, 'is_short', False) else 'short'
            
            # Calculate ATR-based stop loss
            atr_stoploss_price = self.calculate_atr_stoploss(current_rate, atr, signal_type)
            atr_stoploss_ratio = (atr_stoploss_price - trade.open_rate) / trade.open_rate
            
            # Use the more conservative stop loss
            final_stoploss = max(self.stoploss, atr_stoploss_ratio) if signal_type == 'long' else min(self.stoploss, atr_stoploss_ratio)
            
            logger.debug(f"Custom stoploss for {pair}: {final_stoploss:.4f} (ATR: {atr:.6f})")
            return final_stoploss
            
        except Exception as e:
            logger.error(f"Error calculating custom stoploss for {pair}: {e}")
            return self.stoploss
    
    def custom_sell(self, pair: str, trade, current_time: datetime, 
                   current_rate: float, current_profit: float, **kwargs):
        """
        Implement multi-target take profit system.
        
        :param pair: Trading pair
        :param trade: Trade object
        :param current_time: Current timestamp
        :param current_rate: Current price
        :param current_profit: Current profit percentage
        :return: Sell signal or None
        """
        try:
            if not trade:
                return None
            
            # Multi-target take profit levels
            target_1 = 0.02  # 2%
            target_2 = 0.05  # 5%
            target_3 = 0.08  # 8%
            
            if current_profit >= target_3:
                logger.info(f"T3 take profit hit for {pair} at {current_profit:.2%}")
                return "take_profit_t3"
            elif current_profit >= target_2:
                logger.info(f"T2 take profit hit for {pair} at {current_profit:.2%}")
                return "take_profit_t2"
            elif current_profit >= target_1:
                logger.info(f"T1 take profit hit for {pair} at {current_profit:.2%}")
                return "take_profit_t1"
            
            return None
            
        except Exception as e:
            logger.error(f"Error in custom_sell for {pair}: {e}")
            return None
    
    def confirm_trade_entry(self, pair: str, order_type: str, amount: float, 
                          rate: float, time_in_force: str, current_time: datetime, 
                          entry_tag: Optional[str], side: str, **kwargs) -> bool:
        """
        Perform trade entry confirmation with safety checks.
        
        :param pair: Trading pair
        :param order_type: Order type
        :param amount: Trade amount
        :param rate: Entry rate
        :param time_in_force: Time in force
        :param current_time: Current timestamp
        :param entry_tag: Entry tag
        :param side: Trade side
        :return: True if trade should be confirmed
        """
        try:
            # Basic validation
            if not pair or rate <= 0 or amount <= 0:
                logger.warning(f"Invalid trade parameters for {pair}")
                return False
            
            # Get market data for validation
            confidence = kwargs.get('confidence', 0.5)
            volatility = kwargs.get('volatility', 1.0)
            volume = kwargs.get('volume', 0)
            
            # Safety checks
            if confidence < self.confidence_threshold:
                logger.info(f"Trade rejected for {pair}: Low confidence ({confidence:.2f})")
                return False
            
            if volatility < self.volatility_threshold:
                logger.info(f"Trade rejected for {pair}: Low volatility ({volatility:.2f})")
                return False
            
            if self.volume_filter_enabled and volume < self.minimum_volume:
                logger.info(f"Trade rejected for {pair}: Low volume ({volume})")
                return False
            
            logger.info(f"Trade confirmed for {pair}: {side} at {rate} (confidence: {confidence:.2f})")
            return True
            
        except Exception as e:
            logger.error(f"Error confirming trade entry for {pair}: {e}")
            return False
    
    def get_strategy_config(self) -> Dict:
        """
        Get current strategy configuration for debugging and analysis.
        
        :return: Strategy configuration dictionary
        """
        return {
            'timeframe': self.timeframe,
            'minimum_volume': self.minimum_volume,
            'minimum_price_change': self.minimum_price_change,
            'confidence_threshold': self.confidence_threshold,
            'volatility_threshold': self.volatility_threshold,
            'atr_multiplier': self.atr_multiplier,
            'rsi_period': self.rsi_period,
            'rsi_buy_threshold': self.rsi_buy_threshold,
            'rsi_sell_threshold': self.rsi_sell_threshold,
            'volume_filter_enabled': self.volume_filter_enabled
        }