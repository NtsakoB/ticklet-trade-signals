# Ticklet Alpha Strategy - Backend Optimized
"""
Backend-optimized trading strategy for AI signal generation, paper trading,
ML feedback loops, and signal processing for Telegram integration.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class TickletAlpha:
    """
    Main backend strategy class for Ticklet Alpha trading logic.
    Optimized for AI integration and backend processing.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.name = "ticklet_alpha"
        self.version = "1.0.0"
        
    def _default_config(self) -> Dict:
        """Default configuration for Ticklet Alpha strategy"""
        return {
            'timeframe': '5m',
            'risk_per_trade': 0.02,
            'max_leverage': 10,
            'min_confidence': 0.7,
            'rsi_period': 14,
            'rsi_oversold': 30,
            'rsi_overbought': 70,
            'ema_fast': 9,
            'ema_slow': 21,
            'atr_period': 14,
            'volume_threshold': 1000000,
            'volatility_threshold': 0.05
        }
    
    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate technical indicators for the strategy"""
        try:
            # RSI
            df['rsi'] = self._calculate_rsi(df['close'], self.config['rsi_period'])
            
            # EMAs
            df['ema_fast'] = df['close'].ewm(span=self.config['ema_fast']).mean()
            df['ema_slow'] = df['close'].ewm(span=self.config['ema_slow']).mean()
            
            # ATR
            df['atr'] = self._calculate_atr(df, self.config['atr_period'])
            
            # Volume indicators
            df['volume_sma'] = df['volume'].rolling(window=20).mean()
            df['volume_ratio'] = df['volume'] / df['volume_sma']
            
            # Volatility
            df['volatility'] = df['close'].pct_change().rolling(window=20).std()
            
            # Confidence score
            df['confidence'] = self._calculate_confidence(df)
            
            return df
            
        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            return df
    
    def _calculate_rsi(self, prices: pd.Series, period: int) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _calculate_atr(self, df: pd.DataFrame, period: int) -> pd.Series:
        """Calculate Average True Range"""
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return true_range.rolling(window=period).mean()
    
    def _calculate_confidence(self, df: pd.DataFrame) -> pd.Series:
        """Calculate confidence score based on multiple factors"""
        confidence = pd.Series(0.5, index=df.index)
        
        # Trend strength
        trend_strength = abs(df['ema_fast'] - df['ema_slow']) / df['close']
        confidence += trend_strength * 0.3
        
        # Volume confirmation
        volume_conf = np.where(df['volume_ratio'] > 1.2, 0.2, -0.1)
        confidence += volume_conf
        
        # Volatility adjustment
        vol_conf = np.where(df['volatility'] < self.config['volatility_threshold'], 0.1, -0.1)
        confidence += vol_conf
        
        return np.clip(confidence, 0.1, 0.95)
    
    def generate_signals(self, df: pd.DataFrame) -> List[Dict]:
        """Generate trading signals based on strategy logic"""
        signals = []
        
        if df.empty or len(df) < 50:
            return signals
        
        df = self.calculate_indicators(df)
        
        for i in range(1, len(df)):
            current = df.iloc[i]
            previous = df.iloc[i-1]
            
            signal = self._check_entry_conditions(current, previous)
            if signal:
                signals.append(signal)
        
        return signals
    
    def _check_entry_conditions(self, current: pd.Series, previous: pd.Series) -> Optional[Dict]:
        """Check if entry conditions are met"""
        # Long conditions
        long_conditions = [
            current['rsi'] > 30 and current['rsi'] < 70,
            current['ema_fast'] > current['ema_slow'],
            current['close'] > current['ema_fast'],
            current['confidence'] >= self.config['min_confidence'],
            current['volume_ratio'] > 1.0
        ]
        
        # Short conditions
        short_conditions = [
            current['rsi'] > 30 and current['rsi'] < 70,
            current['ema_fast'] < current['ema_slow'],
            current['close'] < current['ema_fast'],
            current['confidence'] >= self.config['min_confidence'],
            current['volume_ratio'] > 1.0
        ]
        
        if all(long_conditions):
            return self._create_signal('long', current)
        elif all(short_conditions):
            return self._create_signal('short', current)
        
        return None
    
    def _create_signal(self, direction: str, data: pd.Series) -> Dict:
        """Create a trading signal"""
        entry_price = data['close']
        atr = data['atr']
        
        if direction == 'long':
            stop_loss = entry_price - (atr * 1.5)
            targets = [
                entry_price + (atr * 1.0),  # TP1
                entry_price + (atr * 2.0),  # TP2
                entry_price + (atr * 3.0)   # TP3
            ]
        else:  # short
            stop_loss = entry_price + (atr * 1.5)
            targets = [
                entry_price - (atr * 1.0),  # TP1
                entry_price - (atr * 2.0),  # TP2
                entry_price - (atr * 3.0)   # TP3
            ]
        
        return {
            'strategy': self.name,
            'direction': direction,
            'entry_price': entry_price,
            'stop_loss': stop_loss,
            'targets': targets,
            'confidence': data['confidence'],
            'timestamp': data.name,
            'leverage': self._calculate_leverage(data['confidence']),
            'risk_reward': abs(targets[0] - entry_price) / abs(stop_loss - entry_price)
        }
    
    def _calculate_leverage(self, confidence: float) -> float:
        """Calculate leverage based on confidence"""
        base_leverage = min(confidence * self.config['max_leverage'], self.config['max_leverage'])
        return max(1.0, base_leverage)
    
    def backtest(self, df: pd.DataFrame) -> Dict:
        """Run backtest on historical data"""
        signals = self.generate_signals(df)
        
        # Simple backtest logic
        total_trades = len(signals)
        winning_trades = 0
        total_pnl = 0
        
        for signal in signals:
            # Simulate trade outcome (simplified)
            # In real implementation, this would check actual price movements
            if signal['confidence'] > 0.75:
                winning_trades += 1
                total_pnl += signal['risk_reward']
            else:
                total_pnl -= 1
        
        win_rate = winning_trades / total_trades if total_trades > 0 else 0
        
        return {
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'win_rate': win_rate,
            'total_pnl': total_pnl,
            'avg_pnl_per_trade': total_pnl / total_trades if total_trades > 0 else 0
        }
    
    def get_strategy_info(self) -> Dict:
        """Get strategy information"""
        return {
            'name': self.name,
            'version': self.version,
            'description': 'Backend-optimized Ticklet Alpha trading strategy',
            'timeframe': self.config['timeframe'],
            'risk_per_trade': self.config['risk_per_trade'],
            'max_leverage': self.config['max_leverage']
        }