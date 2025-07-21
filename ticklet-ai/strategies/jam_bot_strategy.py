# JAM Bot Strategy - Advanced Scalping Strategy
"""
JAM Bot - High-frequency scalping strategy for quick profits.
Designed for volatile markets with rapid entry/exit logic.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class JamBotStrategy:
    """
    JAM Bot strategy for high-frequency scalping.
    Focuses on quick profits in volatile market conditions.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.name = "jam_bot_strategy"
        self.version = "1.0.0"
    
    def _default_config(self) -> Dict:
        """Default configuration for JAM Bot Strategy"""
        return {
            'timeframe': '1m',
            'risk_per_trade': 0.01,
            'max_leverage': 20,
            'min_confidence': 0.8,
            'rsi_period': 7,
            'rsi_oversold': 25,
            'rsi_overbought': 75,
            'ema_ultra_fast': 3,
            'ema_fast': 7,
            'scalp_target': 0.005,  # 0.5% quick target
            'scalp_stop': 0.003,    # 0.3% tight stop
            'volume_spike_threshold': 2.0,
            'volatility_min': 0.01
        }
    
    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate scalping-specific indicators"""
        try:
            # Ultra-fast indicators for scalping
            df['rsi'] = self._calculate_rsi(df['close'], self.config['rsi_period'])
            df['ema_ultra_fast'] = df['close'].ewm(span=self.config['ema_ultra_fast']).mean()
            df['ema_fast'] = df['close'].ewm(span=self.config['ema_fast']).mean()
            
            # Price momentum
            df['price_momentum'] = df['close'].pct_change()
            df['momentum_3'] = df['close'].pct_change(periods=3)
            
            # Volume analysis
            df['volume_sma'] = df['volume'].rolling(window=10).mean()
            df['volume_spike'] = df['volume'] / df['volume_sma']
            
            # Volatility
            df['volatility'] = df['close'].pct_change().rolling(window=5).std()
            
            # Scalping confidence
            df['scalp_confidence'] = self._calculate_scalp_confidence(df)
            
            return df
            
        except Exception as e:
            logger.error(f"Error calculating JAM Bot indicators: {e}")
            return df
    
    def _calculate_rsi(self, prices: pd.Series, period: int) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _calculate_scalp_confidence(self, df: pd.DataFrame) -> pd.Series:
        """Calculate scalping confidence score"""
        confidence = pd.Series(0.4, index=df.index)
        
        # Volume spike bonus
        volume_bonus = np.where(df['volume_spike'] > self.config['volume_spike_threshold'], 0.3, 0)
        confidence += volume_bonus
        
        # Volatility requirement
        vol_bonus = np.where(df['volatility'] > self.config['volatility_min'], 0.2, -0.3)
        confidence += vol_bonus
        
        # Momentum alignment
        momentum_bonus = np.where(
            (df['price_momentum'] > 0) & (df['momentum_3'] > 0), 0.1,
            np.where((df['price_momentum'] < 0) & (df['momentum_3'] < 0), 0.1, 0)
        )
        confidence += momentum_bonus
        
        return np.clip(confidence, 0.1, 0.95)
    
    def generate_signals(self, df: pd.DataFrame) -> List[Dict]:
        """Generate scalping signals"""
        signals = []
        
        if df.empty or len(df) < 20:
            return signals
        
        df = self.calculate_indicators(df)
        
        for i in range(1, len(df)):
            current = df.iloc[i]
            previous = df.iloc[i-1]
            
            signal = self._check_scalp_entry(current, previous)
            if signal:
                signals.append(signal)
        
        return signals
    
    def _check_scalp_entry(self, current: pd.Series, previous: pd.Series) -> Optional[Dict]:
        """Check for scalping entry conditions"""
        # Long scalp conditions
        long_scalp = [
            current['rsi'] < self.config['rsi_overbought'],
            current['rsi'] > self.config['rsi_oversold'],
            current['ema_ultra_fast'] > current['ema_fast'],
            current['close'] > current['ema_ultra_fast'],
            current['price_momentum'] > 0,
            current['volume_spike'] > self.config['volume_spike_threshold'],
            current['scalp_confidence'] >= self.config['min_confidence'],
            current['volatility'] > self.config['volatility_min']
        ]
        
        # Short scalp conditions
        short_scalp = [
            current['rsi'] > self.config['rsi_oversold'],
            current['rsi'] < self.config['rsi_overbought'],
            current['ema_ultra_fast'] < current['ema_fast'],
            current['close'] < current['ema_ultra_fast'],
            current['price_momentum'] < 0,
            current['volume_spike'] > self.config['volume_spike_threshold'],
            current['scalp_confidence'] >= self.config['min_confidence'],
            current['volatility'] > self.config['volatility_min']
        ]
        
        if all(long_scalp):
            return self._create_scalp_signal('long', current)
        elif all(short_scalp):
            return self._create_scalp_signal('short', current)
        
        return None
    
    def _create_scalp_signal(self, direction: str, data: pd.Series) -> Dict:
        """Create a scalping signal with tight targets"""
        entry_price = data['close']
        
        if direction == 'long':
            # Quick scalp targets
            targets = [
                entry_price * (1 + self.config['scalp_target']),  # TP1: 0.5%
                entry_price * (1 + self.config['scalp_target'] * 1.5),  # TP2: 0.75%
                entry_price * (1 + self.config['scalp_target'] * 2)     # TP3: 1.0%
            ]
            stop_loss = entry_price * (1 - self.config['scalp_stop'])  # SL: -0.3%
        else:  # short
            targets = [
                entry_price * (1 - self.config['scalp_target']),  # TP1: -0.5%
                entry_price * (1 - self.config['scalp_target'] * 1.5),  # TP2: -0.75%
                entry_price * (1 - self.config['scalp_target'] * 2)     # TP3: -1.0%
            ]
            stop_loss = entry_price * (1 + self.config['scalp_stop'])  # SL: +0.3%
        
        return {
            'strategy': self.name,
            'direction': direction,
            'entry_price': entry_price,
            'stop_loss': stop_loss,
            'targets': targets,
            'confidence': data['scalp_confidence'],
            'timestamp': data.name,
            'leverage': self._calculate_scalp_leverage(data['scalp_confidence']),
            'risk_reward': abs(targets[0] - entry_price) / abs(stop_loss - entry_price),
            'volatility': data['volatility'],
            'volume_spike': data['volume_spike'],
            'scalp_type': 'quick_profit'
        }
    
    def _calculate_scalp_leverage(self, confidence: float) -> float:
        """Calculate leverage for scalping (higher leverage for quick trades)"""
        base_leverage = confidence * self.config['max_leverage']
        return max(5.0, min(base_leverage, self.config['max_leverage']))
    
    def get_strategy_info(self) -> Dict:
        """Get JAM Bot strategy information"""
        return {
            'name': self.name,
            'version': self.version,
            'description': 'High-frequency scalping strategy for quick profits',
            'timeframe': self.config['timeframe'],
            'risk_per_trade': self.config['risk_per_trade'],
            'max_leverage': self.config['max_leverage'],
            'strategy_type': 'scalping',
            'target_profit': f"{self.config['scalp_target']*100}%",
            'max_stop_loss': f"{self.config['scalp_stop']*100}%"
        }