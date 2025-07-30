# Condition Strategy - Market Condition Adaptive
"""
Adaptive strategy that adjusts behavior based on market conditions.
Detects and responds to different market regimes automatically.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class ConditionStrategy:
    """
    Market condition adaptive strategy.
    Automatically detects and adapts to different market regimes.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.name = "condition_strategy"
        self.version = "1.0.0"
        self.current_regime = "neutral"
    
    def _default_config(self) -> Dict:
        """Default configuration for Condition Strategy"""
        return {
            'timeframe': '5m',
            'risk_per_trade': 0.02,
            'max_leverage': 10,
            'min_confidence': 0.65,
            'trend_period': 50,
            'volatility_period': 20,
            'volume_period': 30,
            'regime_threshold': 0.02,
            'consolidation_threshold': 0.01,
            'breakout_threshold': 1.5
        }
    
    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate market condition indicators"""
        try:
            # Trend indicators
            df['sma_trend'] = df['close'].rolling(window=self.config['trend_period']).mean()
            df['trend_direction'] = np.where(df['close'] > df['sma_trend'], 1, -1)
            df['trend_strength'] = abs(df['close'] - df['sma_trend']) / df['sma_trend']
            
            # Volatility indicators
            df['volatility'] = df['close'].pct_change().rolling(window=self.config['volatility_period']).std()
            df['vol_regime'] = self._classify_volatility_regime(df['volatility'])
            
            # Volume indicators
            df['volume_sma'] = df['volume'].rolling(window=self.config['volume_period']).mean()
            df['volume_ratio'] = df['volume'] / df['volume_sma']
            
            # Market regime detection
            df['market_regime'] = self._detect_market_regime(df)
            
            # Condition-based confidence
            df['condition_confidence'] = self._calculate_condition_confidence(df)
            
            return df
            
        except Exception as e:
            logger.error(f"Error calculating condition indicators: {e}")
            return df
    
    def _classify_volatility_regime(self, volatility: pd.Series) -> pd.Series:
        """Classify volatility into regimes"""
        vol_quantiles = volatility.rolling(window=100).quantile([0.33, 0.67])
        
        regime = pd.Series("medium", index=volatility.index)
        regime[volatility <= vol_quantiles.iloc[:, 0]] = "low"
        regime[volatility >= vol_quantiles.iloc[:, 1]] = "high"
        
        return regime
    
    def _detect_market_regime(self, df: pd.DataFrame) -> pd.Series:
        """Detect market regime: trending, consolidating, or volatile"""
        regime = pd.Series("neutral", index=df.index)
        
        for i in range(self.config['trend_period'], len(df)):
            current_data = df.iloc[i-self.config['trend_period']:i]
            
            # Calculate regime characteristics
            trend_strength = current_data['trend_strength'].mean()
            volatility = current_data['volatility'].mean()
            
            # Determine regime
            if trend_strength > self.config['regime_threshold']:
                if volatility < self.config['consolidation_threshold']:
                    regime.iloc[i] = "trending"
                else:
                    regime.iloc[i] = "volatile_trend"
            elif volatility < self.config['consolidation_threshold']:
                regime.iloc[i] = "consolidating"
            else:
                regime.iloc[i] = "volatile"
        
        return regime
    
    def _calculate_condition_confidence(self, df: pd.DataFrame) -> pd.Series:
        """Calculate confidence based on market conditions"""
        confidence = pd.Series(0.4, index=df.index)
        
        # Regime-based confidence
        regime_conf = np.where(df['market_regime'] == 'trending', 0.3,
                              np.where(df['market_regime'] == 'consolidating', 0.2,
                                     np.where(df['market_regime'] == 'volatile', 0.1, 0.15)))
        confidence += regime_conf
        
        # Volume confirmation
        vol_conf = np.where(df['volume_ratio'] > 1.2, 0.2, 0)
        confidence += vol_conf
        
        # Trend strength
        trend_conf = np.clip(df['trend_strength'] * 5, 0, 0.2)
        confidence += trend_conf
        
        return np.clip(confidence, 0.1, 0.95)
    
    def generate_signals(self, df: pd.DataFrame) -> List[Dict]:
        """Generate condition-adaptive signals"""
        signals = []
        
        if df.empty or len(df) < self.config['trend_period']:
            return signals
        
        df = self.calculate_indicators(df)
        
        for i in range(self.config['trend_period'], len(df)):
            current = df.iloc[i]
            self.current_regime = current['market_regime']
            
            signal = self._check_condition_entry(current, df.iloc[i-10:i])
            if signal:
                signals.append(signal)
        
        return signals
    
    def _check_condition_entry(self, current: pd.Series, history: pd.DataFrame) -> Optional[Dict]:
        """Check entry conditions based on market regime"""
        regime = current['market_regime']
        
        if regime == "trending":
            return self._check_trending_entry(current)
        elif regime == "consolidating":
            return self._check_consolidation_entry(current)
        elif regime == "volatile":
            return self._check_volatile_entry(current)
        elif regime == "volatile_trend":
            return self._check_volatile_trend_entry(current)
        
        return None
    
    def _check_trending_entry(self, current: pd.Series) -> Optional[Dict]:
        """Entry logic for trending markets"""
        trending_conditions = [
            current['trend_strength'] > self.config['regime_threshold'],
            current['condition_confidence'] >= self.config['min_confidence'],
            current['volume_ratio'] > 1.0,
            current['vol_regime'] != "high"
        ]
        
        if all(trending_conditions):
            direction = "long" if current['trend_direction'] > 0 else "short"
            return self._create_condition_signal(direction, current, "trending")
        
        return None
    
    def _check_consolidation_entry(self, current: pd.Series) -> Optional[Dict]:
        """Entry logic for consolidating markets"""
        consolidation_conditions = [
            current['volatility'] < self.config['consolidation_threshold'],
            current['condition_confidence'] >= self.config['min_confidence'] * 0.8,
            current['volume_ratio'] > self.config['breakout_threshold']  # Breakout signal
        ]
        
        if all(consolidation_conditions):
            direction = "long" if current['trend_direction'] > 0 else "short"
            return self._create_condition_signal(direction, current, "breakout")
        
        return None
    
    def _check_volatile_entry(self, current: pd.Series) -> Optional[Dict]:
        """Entry logic for volatile markets"""
        volatile_conditions = [
            current['volatility'] > self.config['regime_threshold'],
            current['condition_confidence'] >= self.config['min_confidence'] * 1.2,  # Higher threshold
            current['volume_ratio'] > 1.5,
            current['trend_strength'] > 0.01  # Some directional bias
        ]
        
        if all(volatile_conditions):
            direction = "long" if current['trend_direction'] > 0 else "short"
            return self._create_condition_signal(direction, current, "volatile")
        
        return None
    
    def _check_volatile_trend_entry(self, current: pd.Series) -> Optional[Dict]:
        """Entry logic for volatile trending markets"""
        volatile_trend_conditions = [
            current['trend_strength'] > self.config['regime_threshold'] * 0.7,
            current['condition_confidence'] >= self.config['min_confidence'] * 1.1,
            current['volume_ratio'] > 1.3
        ]
        
        if all(volatile_trend_conditions):
            direction = "long" if current['trend_direction'] > 0 else "short"
            return self._create_condition_signal(direction, current, "volatile_trend")
        
        return None
    
    def _create_condition_signal(self, direction: str, data: pd.Series, signal_type: str) -> Dict:
        """Create a condition-adaptive signal"""
        entry_price = data['close']
        
        # Adaptive targets based on regime
        if signal_type == "trending":
            target_mult = [1.5, 2.5, 4.0]
            stop_mult = 1.0
        elif signal_type == "breakout":
            target_mult = [1.0, 2.0, 3.0]
            stop_mult = 0.8
        elif signal_type == "volatile":
            target_mult = [0.8, 1.2, 2.0]
            stop_mult = 0.6
        else:  # volatile_trend
            target_mult = [1.2, 2.0, 3.0]
            stop_mult = 0.8
        
        base_range = entry_price * 0.01  # 1% base range
        
        if direction == 'long':
            targets = [entry_price + (base_range * mult) for mult in target_mult]
            # Sort BUY targets in ascending order (low → high)
            targets = sorted(targets)
            stop_loss = entry_price - (base_range * stop_mult)
        else:  # short
            targets = [entry_price - (base_range * mult) for mult in target_mult]
            # Sort SELL targets in descending order (high → low)
            targets = sorted(targets, reverse=True)
            stop_loss = entry_price + (base_range * stop_mult)
        
        return {
            'strategy': self.name,
            'direction': direction,
            'entry_price': entry_price,
            'stop_loss': stop_loss,
            'targets': targets,
            'confidence': data['condition_confidence'],
            'timestamp': data.name,
            'leverage': self._calculate_condition_leverage(data['condition_confidence'], signal_type),
            'risk_reward': abs(targets[0] - entry_price) / abs(stop_loss - entry_price),
            'market_regime': data['market_regime'],
            'signal_type': signal_type,
            'volatility_regime': data['vol_regime'],
            'trend_strength': data['trend_strength']
        }
    
    def _calculate_condition_leverage(self, confidence: float, signal_type: str) -> float:
        """Calculate leverage based on market conditions"""
        base_leverage = confidence * self.config['max_leverage']
        
        # Adjust leverage based on signal type
        if signal_type == "trending":
            leverage_mult = 1.0
        elif signal_type == "breakout":
            leverage_mult = 1.2  # Higher leverage for breakouts
        elif signal_type == "volatile":
            leverage_mult = 0.7  # Lower leverage for volatile markets
        else:  # volatile_trend
            leverage_mult = 0.8
        
        final_leverage = base_leverage * leverage_mult
        return max(1.0, min(final_leverage, self.config['max_leverage']))
    
    def get_strategy_info(self) -> Dict:
        """Get Condition strategy information"""
        return {
            'name': self.name,
            'version': self.version,
            'description': 'Market condition adaptive strategy with regime detection',
            'timeframe': self.config['timeframe'],
            'risk_per_trade': self.config['risk_per_trade'],
            'max_leverage': self.config['max_leverage'],
            'strategy_type': 'adaptive',
            'current_regime': self.current_regime,
            'supported_regimes': ['trending', 'consolidating', 'volatile', 'volatile_trend']
        }