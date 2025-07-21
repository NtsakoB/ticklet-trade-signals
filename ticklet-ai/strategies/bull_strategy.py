# Bull Strategy - Optimized for Bull Markets
"""
Bull market strategy focused on long positions and trend following.
Designed for strong uptrend conditions with momentum indicators.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class BullStrategy:
    """
    Bull market strategy for strong uptrend conditions.
    Focuses on momentum and trend-following signals.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.name = "bull_strategy"
        self.version = "1.0.0"
    
    def _default_config(self) -> Dict:
        """Default configuration for Bull Strategy"""
        return {
            'timeframe': '5m',
            'risk_per_trade': 0.03,
            'max_leverage': 15,
            'min_confidence': 0.6,
            'rsi_period': 14,
            'rsi_bull_threshold': 40,
            'ema_fast': 12,
            'ema_slow': 26,
            'momentum_period': 10,
            'volume_multiplier': 1.5,
            'trend_strength_min': 0.02
        }
    
    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate bull market specific indicators"""
        try:
            # Momentum indicators
            df['rsi'] = self._calculate_rsi(df['close'], self.config['rsi_period'])
            df['momentum'] = df['close'].pct_change(periods=self.config['momentum_period'])
            
            # Trend indicators
            df['ema_fast'] = df['close'].ewm(span=self.config['ema_fast']).mean()
            df['ema_slow'] = df['close'].ewm(span=self.config['ema_slow']).mean()
            df['trend_strength'] = (df['ema_fast'] - df['ema_slow']) / df['close']
            
            # Volume analysis
            df['volume_sma'] = df['volume'].rolling(window=20).mean()
            df['volume_ratio'] = df['volume'] / df['volume_sma']
            
            # Bull market confidence
            df['bull_confidence'] = self._calculate_bull_confidence(df)
            
            return df
            
        except Exception as e:
            logger.error(f"Error calculating bull indicators: {e}")
            return df
    
    def _calculate_rsi(self, prices: pd.Series, period: int) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _calculate_bull_confidence(self, df: pd.DataFrame) -> pd.Series:
        """Calculate bull market confidence score"""
        confidence = pd.Series(0.3, index=df.index)
        
        # Strong uptrend bonus
        uptrend_bonus = np.where(df['trend_strength'] > self.config['trend_strength_min'], 0.3, 0)
        confidence += uptrend_bonus
        
        # Momentum confirmation
        momentum_bonus = np.where(df['momentum'] > 0.01, 0.2, -0.1)
        confidence += momentum_bonus
        
        # Volume confirmation
        volume_bonus = np.where(df['volume_ratio'] > self.config['volume_multiplier'], 0.2, 0)
        confidence += volume_bonus
        
        return np.clip(confidence, 0.1, 0.95)
    
    def generate_signals(self, df: pd.DataFrame) -> List[Dict]:
        """Generate bull market trading signals"""
        signals = []
        
        if df.empty or len(df) < 30:
            return signals
        
        df = self.calculate_indicators(df)
        
        for i in range(1, len(df)):
            current = df.iloc[i]
            previous = df.iloc[i-1]
            
            signal = self._check_bull_entry(current, previous)
            if signal:
                signals.append(signal)
        
        return signals
    
    def _check_bull_entry(self, current: pd.Series, previous: pd.Series) -> Optional[Dict]:
        """Check for bull market entry conditions"""
        # Bull entry conditions (long only)
        bull_conditions = [
            current['rsi'] > self.config['rsi_bull_threshold'],
            current['ema_fast'] > current['ema_slow'],
            current['close'] > current['ema_fast'],
            current['trend_strength'] > self.config['trend_strength_min'],
            current['momentum'] > 0,
            current['bull_confidence'] >= self.config['min_confidence'],
            current['volume_ratio'] > self.config['volume_multiplier']
        ]
        
        if all(bull_conditions):
            return self._create_bull_signal(current)
        
        return None
    
    def _create_bull_signal(self, data: pd.Series) -> Dict:
        """Create a bull market signal (long only)"""
        entry_price = data['close']
        price_range = entry_price * 0.02  # 2% range for targets/stops
        
        # Aggressive bull targets
        targets = [
            entry_price * 1.015,  # TP1: 1.5%
            entry_price * 1.025,  # TP2: 2.5%
            entry_price * 1.040   # TP3: 4.0%
        ]
        
        stop_loss = entry_price * 0.985  # SL: -1.5%
        
        return {
            'strategy': self.name,
            'direction': 'long',
            'entry_price': entry_price,
            'stop_loss': stop_loss,
            'targets': targets,
            'confidence': data['bull_confidence'],
            'timestamp': data.name,
            'leverage': self._calculate_bull_leverage(data['bull_confidence']),
            'risk_reward': (targets[0] - entry_price) / (entry_price - stop_loss),
            'trend_strength': data['trend_strength'],
            'momentum': data['momentum']
        }
    
    def _calculate_bull_leverage(self, confidence: float) -> float:
        """Calculate leverage for bull market conditions"""
        # More aggressive leverage in bull markets
        base_leverage = confidence * self.config['max_leverage']
        return max(2.0, min(base_leverage, self.config['max_leverage']))
    
    def get_strategy_info(self) -> Dict:
        """Get bull strategy information"""
        return {
            'name': self.name,
            'version': self.version,
            'description': 'Bull market momentum strategy - long positions only',
            'timeframe': self.config['timeframe'],
            'risk_per_trade': self.config['risk_per_trade'],
            'max_leverage': self.config['max_leverage'],
            'market_condition': 'bull'
        }