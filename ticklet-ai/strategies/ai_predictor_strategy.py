# AI Predictor Strategy - Machine Learning Enhanced
"""
AI-enhanced strategy using machine learning predictions and pattern recognition.
Integrates with AI models for advanced signal generation.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class AIPredictorStrategy:
    """
    AI-enhanced trading strategy with machine learning integration.
    Uses pattern recognition and predictive models for signal generation.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.name = "ai_predictor_strategy"
        self.version = "1.0.0"
        self.ml_model = None  # Placeholder for ML model
    
    def _default_config(self) -> Dict:
        """Default configuration for AI Predictor Strategy"""
        return {
            'timeframe': '5m',
            'risk_per_trade': 0.025,
            'max_leverage': 12,
            'min_confidence': 0.75,
            'prediction_window': 12,  # 12 periods ahead
            'feature_window': 50,     # 50 periods for features
            'ml_threshold': 0.7,      # ML prediction threshold
            'pattern_confidence': 0.6,
            'volatility_factor': 1.2,
            'ensemble_weight': 0.8    # Weight for ensemble predictions
        }
    
    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate AI-enhanced indicators and features"""
        try:
            # Traditional indicators
            df['rsi'] = self._calculate_rsi(df['close'], 14)
            df['macd'], df['macd_signal'] = self._calculate_macd(df['close'])
            df['bb_upper'], df['bb_lower'] = self._calculate_bollinger_bands(df['close'])
            
            # AI features
            df['price_pattern'] = self._detect_patterns(df['close'])
            df['volume_pattern'] = self._analyze_volume_patterns(df['volume'])
            df['volatility_regime'] = self._classify_volatility(df['close'])
            
            # ML predictions (simulated)
            df['ml_prediction'] = self._generate_ml_predictions(df)
            df['pattern_strength'] = self._calculate_pattern_strength(df)
            
            # AI confidence score
            df['ai_confidence'] = self._calculate_ai_confidence(df)
            
            return df
            
        except Exception as e:
            logger.error(f"Error calculating AI indicators: {e}")
            return df
    
    def _calculate_rsi(self, prices: pd.Series, period: int) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _calculate_macd(self, prices: pd.Series) -> Tuple[pd.Series, pd.Series]:
        """Calculate MACD indicator"""
        ema12 = prices.ewm(span=12).mean()
        ema26 = prices.ewm(span=26).mean()
        macd = ema12 - ema26
        signal = macd.ewm(span=9).mean()
        return macd, signal
    
    def _calculate_bollinger_bands(self, prices: pd.Series, period: int = 20) -> Tuple[pd.Series, pd.Series]:
        """Calculate Bollinger Bands"""
        sma = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        upper = sma + (std * 2)
        lower = sma - (std * 2)
        return upper, lower
    
    def _detect_patterns(self, prices: pd.Series) -> pd.Series:
        """Detect price patterns using pattern recognition"""
        patterns = pd.Series(0.0, index=prices.index)
        
        # Simple pattern detection (can be enhanced with ML)
        for i in range(10, len(prices)):
            window = prices.iloc[i-10:i]
            
            # Ascending triangle pattern
            if self._is_ascending_triangle(window):
                patterns.iloc[i] = 0.8
            # Double bottom pattern
            elif self._is_double_bottom(window):
                patterns.iloc[i] = 0.7
            # Cup and handle pattern
            elif self._is_cup_handle(window):
                patterns.iloc[i] = 0.6
        
        return patterns
    
    def _analyze_volume_patterns(self, volume: pd.Series) -> pd.Series:
        """Analyze volume patterns"""
        volume_patterns = pd.Series(0.0, index=volume.index)
        volume_sma = volume.rolling(window=20).mean()
        
        # Volume breakout detection
        volume_ratio = volume / volume_sma
        volume_patterns = np.where(volume_ratio > 2.0, 0.8,
                                 np.where(volume_ratio > 1.5, 0.6, 0.3))
        
        return pd.Series(volume_patterns, index=volume.index)
    
    def _classify_volatility(self, prices: pd.Series) -> pd.Series:
        """Classify volatility regime"""
        returns = prices.pct_change()
        volatility = returns.rolling(window=20).std()
        
        # Classify volatility into regimes
        vol_quantiles = volatility.quantile([0.33, 0.67])
        
        regime = pd.Series(1, index=prices.index)  # Default: medium
        regime[volatility <= vol_quantiles.iloc[0]] = 0  # Low volatility
        regime[volatility >= vol_quantiles.iloc[1]] = 2  # High volatility
        
        return regime
    
    def _generate_ml_predictions(self, df: pd.DataFrame) -> pd.Series:
        """Generate ML predictions (simulated)"""
        # Simulated ML predictions based on features
        predictions = pd.Series(0.5, index=df.index)
        
        # Simple ensemble of signals
        if 'rsi' in df.columns and 'macd' in df.columns:
            # RSI component
            rsi_signal = np.where(df['rsi'] < 30, 0.8,
                                np.where(df['rsi'] > 70, 0.2, 0.5))
            
            # MACD component
            macd_signal = np.where(df['macd'] > df['macd_signal'], 0.7, 0.3)
            
            # Ensemble prediction
            predictions = (rsi_signal * 0.4 + macd_signal * 0.6)
        
        return predictions
    
    def _calculate_pattern_strength(self, df: pd.DataFrame) -> pd.Series:
        """Calculate pattern strength"""
        strength = pd.Series(0.5, index=df.index)
        
        if 'price_pattern' in df.columns and 'volume_pattern' in df.columns:
            # Combine price and volume patterns
            strength = (df['price_pattern'] * 0.6 + df['volume_pattern'] * 0.4)
        
        return strength
    
    def _calculate_ai_confidence(self, df: pd.DataFrame) -> pd.Series:
        """Calculate AI confidence score"""
        confidence = pd.Series(0.4, index=df.index)
        
        # ML prediction confidence
        if 'ml_prediction' in df.columns:
            ml_conf = np.abs(df['ml_prediction'] - 0.5) * 2  # Distance from neutral
            confidence += ml_conf * 0.3
        
        # Pattern strength
        if 'pattern_strength' in df.columns:
            confidence += df['pattern_strength'] * 0.2
        
        # Volatility adjustment
        if 'volatility_regime' in df.columns:
            vol_adj = np.where(df['volatility_regime'] == 1, 0.1, -0.1)  # Prefer medium vol
            confidence += vol_adj
        
        return np.clip(confidence, 0.1, 0.95)
    
    def _is_ascending_triangle(self, window: pd.Series) -> bool:
        """Check for ascending triangle pattern"""
        # Simplified pattern detection
        highs = window.rolling(window=3).max()
        trend = np.polyfit(range(len(highs.dropna())), highs.dropna(), 1)[0]
        return trend > 0.001  # Ascending trend in highs
    
    def _is_double_bottom(self, window: pd.Series) -> bool:
        """Check for double bottom pattern"""
        lows = window.rolling(window=3).min()
        if len(lows.dropna()) < 6:
            return False
        # Check for two similar lows
        min_val = lows.min()
        similar_lows = (lows <= min_val * 1.02).sum()
        return similar_lows >= 2
    
    def _is_cup_handle(self, window: pd.Series) -> bool:
        """Check for cup and handle pattern"""
        # Simplified cup detection
        mid_idx = len(window) // 2
        first_half = window[:mid_idx]
        second_half = window[mid_idx:]
        
        # Check if it forms a U-shape
        return (first_half.iloc[-1] > first_half.min() and 
                second_half.iloc[0] > second_half.min())
    
    def generate_signals(self, df: pd.DataFrame) -> List[Dict]:
        """Generate AI-enhanced trading signals"""
        signals = []
        
        if df.empty or len(df) < self.config['feature_window']:
            return signals
        
        df = self.calculate_indicators(df)
        
        for i in range(self.config['feature_window'], len(df)):
            current = df.iloc[i]
            signal = self._check_ai_entry(current, df.iloc[i-10:i])
            if signal:
                signals.append(signal)
        
        return signals
    
    def _check_ai_entry(self, current: pd.Series, history: pd.DataFrame) -> Optional[Dict]:
        """Check for AI-enhanced entry conditions"""
        # AI long conditions
        ai_long = [
            current['ml_prediction'] > self.config['ml_threshold'],
            current['pattern_strength'] > self.config['pattern_confidence'],
            current['ai_confidence'] >= self.config['min_confidence'],
            current['volatility_regime'] <= 1,  # Low to medium volatility
            current['rsi'] < 75  # Not extremely overbought
        ]
        
        # AI short conditions
        ai_short = [
            current['ml_prediction'] < (1 - self.config['ml_threshold']),
            current['pattern_strength'] > self.config['pattern_confidence'],
            current['ai_confidence'] >= self.config['min_confidence'],
            current['volatility_regime'] <= 1,  # Low to medium volatility
            current['rsi'] > 25  # Not extremely oversold
        ]
        
        if all(ai_long):
            return self._create_ai_signal('long', current)
        elif all(ai_short):
            return self._create_ai_signal('short', current)
        
        return None
    
    def _create_ai_signal(self, direction: str, data: pd.Series) -> Dict:
        """Create an AI-enhanced signal"""
        entry_price = data['close']
        volatility_adj = data.get('volatility_regime', 1) * self.config['volatility_factor']
        
        # Dynamic targets based on volatility and AI confidence
        base_target = 0.02 * volatility_adj  # 2% base target
        
        if direction == 'long':
            targets = [
                entry_price * (1 + base_target),
                entry_price * (1 + base_target * 1.5),
                entry_price * (1 + base_target * 2.5)
            ]
            stop_loss = entry_price * (1 - base_target * 0.6)
        else:  # short
            targets = [
                entry_price * (1 - base_target),
                entry_price * (1 - base_target * 1.5),
                entry_price * (1 - base_target * 2.5)
            ]
            stop_loss = entry_price * (1 + base_target * 0.6)
        
        return {
            'strategy': self.name,
            'direction': direction,
            'entry_price': entry_price,
            'stop_loss': stop_loss,
            'targets': targets,
            'confidence': data['ai_confidence'],
            'timestamp': data.name,
            'leverage': self._calculate_ai_leverage(data['ai_confidence']),
            'risk_reward': abs(targets[0] - entry_price) / abs(stop_loss - entry_price),
            'ml_prediction': data['ml_prediction'],
            'pattern_strength': data['pattern_strength'],
            'volatility_regime': data.get('volatility_regime', 1)
        }
    
    def _calculate_ai_leverage(self, confidence: float) -> float:
        """Calculate leverage based on AI confidence"""
        base_leverage = confidence * self.config['max_leverage']
        return max(1.0, min(base_leverage, self.config['max_leverage']))
    
    def get_strategy_info(self) -> Dict:
        """Get AI Predictor strategy information"""
        return {
            'name': self.name,
            'version': self.version,
            'description': 'AI-enhanced strategy with machine learning predictions',
            'timeframe': self.config['timeframe'],
            'risk_per_trade': self.config['risk_per_trade'],
            'max_leverage': self.config['max_leverage'],
            'strategy_type': 'ai_enhanced',
            'ml_threshold': self.config['ml_threshold'],
            'prediction_window': self.config['prediction_window']
        }