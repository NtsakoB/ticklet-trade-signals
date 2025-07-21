"""
Base Strategy Class with Error Handling and Validation
"""
import logging
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Union
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseStrategy(ABC):
    """
    Base class for all trading strategies with robust error handling,
    input validation, and performance optimizations.
    """
    
    def __init__(self, timeframe: str = '5m'):
        self.timeframe = timeframe
        self.minimal_roi = {"0": 0.1}
        self.stoploss = -0.1
        self.trailing_stop = False
        
        # Configurable parameters
        self.atr_multiplier = 1.5
        self.confidence_threshold = 0.7
        self.volume_threshold = 50000000
        self.volatility_threshold = 3.0
        
        logger.info(f"Initialized {self.__class__.__name__} with timeframe {timeframe}")
    
    def validate_dataframe(self, dataframe: pd.DataFrame, required_columns: List[str]) -> None:
        """
        Validate dataframe has required columns and is not empty.
        
        :param dataframe: Input DataFrame to validate
        :param required_columns: List of required column names
        :raises ValueError: If dataframe is empty or missing columns
        """
        if dataframe.empty:
            raise ValueError("DataFrame is empty. Ensure that data is being fetched correctly.")
        
        missing_columns = set(required_columns) - set(dataframe.columns)
        if missing_columns:
            raise KeyError(f"Missing required columns: {missing_columns}")
    
    def validate_signal_inputs(self, symbol: str, entry: float, targets: List[float], 
                             signal_type: str) -> None:
        """
        Validate signal generation inputs.
        
        :param symbol: Trading symbol
        :param entry: Entry price
        :param targets: List of target prices
        :param signal_type: Signal type ('long' or 'short')
        :raises ValueError: If inputs are invalid
        """
        if not symbol or not isinstance(symbol, str):
            raise ValueError("Symbol must be a non-empty string")
        
        if not isinstance(entry, (float, int)) or entry <= 0:
            raise ValueError("Entry price must be a positive number")
        
        if not isinstance(targets, list) or not all(isinstance(t, (float, int)) and t > 0 for t in targets):
            raise ValueError("Targets must be a list of positive numbers")
        
        if signal_type not in ["long", "short"]:
            raise ValueError(f"Invalid signal_type: {signal_type}. Must be 'long' or 'short'")
    
    def calculate_confidence(self, volatility: float, usdt_volume: float) -> float:
        """
        Calculate trading confidence based on market conditions.
        
        :param volatility: Market volatility percentage
        :param usdt_volume: Volume in USDT
        :return: Confidence score between 0 and 1
        """
        try:
            base_confidence = min(volatility / 10 + 0.3, 0.9)
            
            # Volume confidence boost
            volume_confidence = 0
            if usdt_volume > 100000000:  # $100M+
                volume_confidence = 0.1
            elif usdt_volume > 50000000:  # $50M+
                volume_confidence = 0.05
            
            # Volatility confidence adjustment
            volatility_confidence = 0
            if volatility > 7:
                volatility_confidence = 0.15
            elif volatility > 3:
                volatility_confidence = 0.05
            
            return min(base_confidence + volume_confidence + volatility_confidence, 0.95)
        
        except Exception as e:
            logger.error(f"Error calculating confidence: {e}")
            return 0.5  # Safe fallback
    
    def is_trending_up(self, dataframe: pd.DataFrame) -> pd.Series:
        """
        Check if price is in uptrend.
        
        :param dataframe: OHLCV DataFrame with EMA indicators
        :return: Boolean series indicating uptrend
        """
        return (dataframe['close'] > dataframe['ema_21']) & (dataframe['ema_9'] > dataframe['ema_21'])
    
    def is_trending_down(self, dataframe: pd.DataFrame) -> pd.Series:
        """
        Check if price is in downtrend.
        
        :param dataframe: OHLCV DataFrame with EMA indicators
        :return: Boolean series indicating downtrend
        """
        return (dataframe['close'] < dataframe['ema_21']) & (dataframe['ema_9'] < dataframe['ema_21'])
    
    def calculate_dynamic_leverage(self, confidence: float, volatility: float, 
                                 max_leverage: float = 20) -> float:
        """
        Calculate dynamic leverage based on confidence and volatility.
        
        :param confidence: Trading confidence (0-1)
        :param volatility: Market volatility percentage
        :param max_leverage: Maximum allowed leverage
        :return: Calculated leverage
        """
        try:
            base_leverage = confidence * 15
            volatility_adjustment = max(1, volatility / 2)
            leverage = base_leverage / volatility_adjustment
            
            return max(1, min(max_leverage, round(leverage)))
        
        except Exception as e:
            logger.error(f"Error calculating leverage: {e}")
            return 1  # Safe fallback
    
    def calculate_atr_stoploss(self, current_rate: float, atr: float, 
                             signal_type: str) -> float:
        """
        Calculate ATR-based stop loss.
        
        :param current_rate: Current price
        :param atr: Average True Range value
        :param signal_type: 'long' or 'short'
        :return: Stop loss price
        """
        try:
            atr_distance = (atr * self.atr_multiplier) / current_rate
            
            if signal_type == 'long':
                return current_rate * (1 - atr_distance)
            else:
                return current_rate * (1 + atr_distance)
        
        except Exception as e:
            logger.error(f"Error calculating ATR stoploss: {e}")
            return current_rate * 0.95 if signal_type == 'long' else current_rate * 1.05
    
    def export_dataframe(self, dataframe: pd.DataFrame, filename: str) -> None:
        """
        Export processed dataframe for debugging or analysis.
        
        :param dataframe: DataFrame to export
        :param filename: Output filename
        """
        try:
            dataframe.to_csv(filename, index=False)
            logger.info(f"Data exported to {filename}")
        except Exception as e:
            logger.error(f"Failed to export dataframe: {e}")
    
    @abstractmethod
    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Add technical indicators to the dataframe.
        Must be implemented by concrete strategy classes.
        """
        pass
    
    @abstractmethod
    def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Define entry conditions for the strategy.
        Must be implemented by concrete strategy classes.
        """
        pass
    
    @abstractmethod
    def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Define exit conditions for the strategy.
        Must be implemented by concrete strategy classes.
        """
        pass