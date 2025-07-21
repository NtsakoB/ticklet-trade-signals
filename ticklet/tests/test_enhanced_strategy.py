"""
Unit tests for Enhanced Trading Dashboard Strategy
"""
import unittest
import pandas as pd
import numpy as np
from datetime import datetime
from unittest.mock import Mock, patch

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from strategies.enhanced_trading_dashboard_strategy import EnhancedTradingDashboardStrategy

class TestEnhancedTradingDashboardStrategy(unittest.TestCase):
    """Test cases for Enhanced Trading Dashboard Strategy"""
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.strategy = EnhancedTradingDashboardStrategy()
        
        # Create sample dataframe for testing
        dates = pd.date_range('2023-01-01', periods=100, freq='5min')
        np.random.seed(42)  # For reproducible tests
        
        self.sample_df = pd.DataFrame({
            'open': np.random.uniform(100, 110, 100),
            'high': np.random.uniform(105, 115, 100),
            'low': np.random.uniform(95, 105, 100),
            'close': np.random.uniform(100, 110, 100),
            'volume': np.random.uniform(1000, 10000, 100)
        }, index=dates)
    
    def test_initialization(self):
        """Test strategy initialization with default and custom config."""
        # Test default initialization
        default_strategy = EnhancedTradingDashboardStrategy()
        self.assertEqual(default_strategy.timeframe, '5m')
        self.assertEqual(default_strategy.confidence_threshold, 0.65)
        
        # Test custom config initialization
        custom_config = {
            'confidence_threshold': 0.8,
            'volatility_threshold': 5.0,
            'minimum_volume': 2000000
        }
        custom_strategy = EnhancedTradingDashboardStrategy(config=custom_config)
        self.assertEqual(custom_strategy.confidence_threshold, 0.8)
        self.assertEqual(custom_strategy.volatility_threshold, 5.0)
        self.assertEqual(custom_strategy.minimum_volume, 2000000)
    
    def test_dataframe_validation(self):
        """Test dataframe validation methods."""
        # Test empty dataframe
        empty_df = pd.DataFrame()
        with self.assertRaises(ValueError):
            self.strategy.validate_dataframe(empty_df, ['close', 'volume'])
        
        # Test missing columns
        incomplete_df = pd.DataFrame({'close': [100, 101, 102]})
        with self.assertRaises(KeyError):
            self.strategy.validate_dataframe(incomplete_df, ['close', 'volume'])
        
        # Test valid dataframe
        valid_df = pd.DataFrame({
            'close': [100, 101, 102],
            'volume': [1000, 1100, 1200]
        })
        # Should not raise any exception
        self.strategy.validate_dataframe(valid_df, ['close', 'volume'])
    
    def test_signal_input_validation(self):
        """Test signal input validation."""
        # Test valid inputs
        self.strategy.validate_signal_inputs('BTCUSDT', 50000.0, [51000.0, 52000.0], 'long')
        
        # Test invalid symbol
        with self.assertRaises(ValueError):
            self.strategy.validate_signal_inputs('', 50000.0, [51000.0], 'long')
        
        # Test invalid entry price
        with self.assertRaises(ValueError):
            self.strategy.validate_signal_inputs('BTCUSDT', -100.0, [51000.0], 'long')
        
        # Test invalid targets
        with self.assertRaises(ValueError):
            self.strategy.validate_signal_inputs('BTCUSDT', 50000.0, [-1000.0], 'long')
        
        # Test invalid signal type
        with self.assertRaises(ValueError):
            self.strategy.validate_signal_inputs('BTCUSDT', 50000.0, [51000.0], 'invalid')
    
    def test_confidence_calculation(self):
        """Test confidence calculation logic."""
        # Test normal conditions
        confidence = self.strategy.calculate_confidence(5.0, 75000000)  # 5% volatility, $75M volume
        self.assertGreater(confidence, 0.5)
        self.assertLessEqual(confidence, 0.95)
        
        # Test high volume boost
        high_vol_confidence = self.strategy.calculate_confidence(3.0, 150000000)  # $150M volume
        normal_vol_confidence = self.strategy.calculate_confidence(3.0, 25000000)  # $25M volume
        self.assertGreater(high_vol_confidence, normal_vol_confidence)
        
        # Test volatility boost
        high_volatility_confidence = self.strategy.calculate_confidence(8.0, 50000000)  # 8% volatility
        low_volatility_confidence = self.strategy.calculate_confidence(2.0, 50000000)   # 2% volatility
        self.assertGreater(high_volatility_confidence, low_volatility_confidence)
    
    def test_trend_detection(self):
        """Test trend detection methods."""
        # Create test dataframe with trend data
        test_df = self.sample_df.copy()
        test_df['ema_9'] = [105] * 50 + [95] * 50  # Rising then falling
        test_df['ema_21'] = [100] * 100            # Flat
        test_df['close'] = [110] * 50 + [90] * 50  # Above then below EMA21
        
        uptrend = self.strategy.is_trending_up(test_df)
        downtrend = self.strategy.is_trending_down(test_df)
        
        # First 50 should be uptrend, last 50 should be downtrend
        self.assertTrue(uptrend.iloc[:50].all())
        self.assertTrue(downtrend.iloc[50:].all())
    
    def test_dynamic_leverage_calculation(self):
        """Test dynamic leverage calculation."""
        # Test high confidence, low volatility (should give higher leverage)
        high_leverage = self.strategy.calculate_dynamic_leverage(0.9, 2.0, 20)
        self.assertGreater(high_leverage, 5)
        
        # Test low confidence, high volatility (should give lower leverage)
        low_leverage = self.strategy.calculate_dynamic_leverage(0.5, 10.0, 20)
        self.assertLess(low_leverage, high_leverage)
        
        # Test leverage bounds
        leverage = self.strategy.calculate_dynamic_leverage(0.8, 3.0, 10)
        self.assertGreaterEqual(leverage, 1)
        self.assertLessEqual(leverage, 10)
    
    def test_atr_stoploss_calculation(self):
        """Test ATR-based stop loss calculation."""
        current_rate = 100.0
        atr = 2.0  # $2 ATR
        
        # Test long position stop loss
        long_sl = self.strategy.calculate_atr_stoploss(current_rate, atr, 'long')
        self.assertLess(long_sl, current_rate)  # SL should be below entry for long
        
        # Test short position stop loss
        short_sl = self.strategy.calculate_atr_stoploss(current_rate, atr, 'short')
        self.assertGreater(short_sl, current_rate)  # SL should be above entry for short
    
    @patch('ticklet.strategies.enhanced_trading_dashboard_strategy.talib')
    def test_populate_indicators_with_errors(self, mock_talib):
        """Test indicator population with simulated errors."""
        # Mock talib to raise an exception for RSI
        mock_talib.RSI.side_effect = Exception("RSI calculation failed")
        mock_talib.MACD.return_value = (
            np.array([0.1] * 100), 
            np.array([0.05] * 100), 
            np.array([0.05] * 100)
        )
        mock_talib.EMA.return_value = np.array([100] * 100)
        mock_talib.SMA.return_value = np.array([100] * 100)
        mock_talib.ATR.return_value = np.array([2.0] * 100)
        mock_talib.BBANDS.return_value = (
            np.array([102] * 100),  # upper
            np.array([100] * 100),  # middle  
            np.array([98] * 100)    # lower
        )
        
        # Should handle the error gracefully and return dataframe
        result_df = self.strategy.populate_indicators(self.sample_df, {'pair': 'BTCUSDT'})
        self.assertIn('rsi', result_df.columns)
        self.assertEqual(result_df['rsi'].iloc[0], 50.0)  # Fallback value
    
    def test_entry_trend_logic(self):
        """Test entry trend population logic."""
        # Prepare dataframe with indicators
        test_df = self.sample_df.copy()
        
        # Add required indicators for entry logic
        test_df['ema_9'] = 105
        test_df['ema_21'] = 100
        test_df['rsi'] = 25  # Oversold
        test_df['macd'] = 0.1
        test_df['macd_signal'] = 0.05
        test_df['macd_hist'] = 0.05
        test_df['usdt_volume'] = 2000000  # Above minimum
        test_df['volume_ratio'] = 2.0
        test_df['confidence'] = 0.8
        test_df['price_change_pct'] = 3.0
        test_df['volatility'] = 4.0
        
        result_df = self.strategy.populate_entry_trend(test_df, {'pair': 'BTCUSDT'})
        
        # Should have entry columns
        self.assertIn('enter_long', result_df.columns)
        self.assertIn('enter_short', result_df.columns)
    
    def test_volume_filter(self):
        """Test volume filter logic."""
        test_df = pd.DataFrame({
            'usdt_volume': [500000, 2000000, 100000],  # Below, above, below minimum
            'volume_ratio': [1.0, 2.0, 0.5]           # Below, above, below ratio threshold
        })
        
        volume_filter = self.strategy._volume_filter(test_df)
        
        # Only middle row should pass both filters
        expected = pd.Series([False, True, False])
        pd.testing.assert_series_equal(volume_filter, expected)
    
    def test_custom_stoploss_edge_cases(self):
        """Test custom stop loss with edge cases."""
        # Test with invalid trade object
        result = self.strategy.custom_stoploss('BTCUSDT', None, datetime.now(), 100.0, 0.0)
        self.assertEqual(result, self.strategy.stoploss)
        
        # Test with mock trade object
        mock_trade = Mock()
        mock_trade.open_rate = 100.0
        mock_trade.is_open = True
        
        result = self.strategy.custom_stoploss('BTCUSDT', mock_trade, datetime.now(), 105.0, 0.05, atr=2.0)
        self.assertIsInstance(result, float)
    
    def test_custom_sell_targets(self):
        """Test custom sell target logic."""
        mock_trade = Mock()
        
        # Test T1 target
        result = self.strategy.custom_sell('BTCUSDT', mock_trade, datetime.now(), 100.0, 0.025)
        self.assertEqual(result, "take_profit_t1")
        
        # Test T2 target
        result = self.strategy.custom_sell('BTCUSDT', mock_trade, datetime.now(), 100.0, 0.055)
        self.assertEqual(result, "take_profit_t2")
        
        # Test T3 target
        result = self.strategy.custom_sell('BTCUSDT', mock_trade, datetime.now(), 100.0, 0.085)
        self.assertEqual(result, "take_profit_t3")
        
        # Test below targets
        result = self.strategy.custom_sell('BTCUSDT', mock_trade, datetime.now(), 100.0, 0.01)
        self.assertIsNone(result)
    
    def test_trade_confirmation(self):
        """Test trade entry confirmation logic."""
        # Test valid trade confirmation
        result = self.strategy.confirm_trade_entry(
            'BTCUSDT', 'market', 0.01, 50000.0, 'GTC', 
            datetime.now(), None, 'long',
            confidence=0.8, volatility=4.0, volume=2000000
        )
        self.assertTrue(result)
        
        # Test rejection due to low confidence
        result = self.strategy.confirm_trade_entry(
            'BTCUSDT', 'market', 0.01, 50000.0, 'GTC',
            datetime.now(), None, 'long', 
            confidence=0.5, volatility=4.0, volume=2000000
        )
        self.assertFalse(result)
        
        # Test rejection due to low volatility
        result = self.strategy.confirm_trade_entry(
            'BTCUSDT', 'market', 0.01, 50000.0, 'GTC',
            datetime.now(), None, 'long',
            confidence=0.8, volatility=1.0, volume=2000000
        )
        self.assertFalse(result)
    
    def test_get_strategy_config(self):
        """Test strategy configuration retrieval."""
        config = self.strategy.get_strategy_config()
        
        # Verify all expected keys are present
        expected_keys = [
            'timeframe', 'minimum_volume', 'minimum_price_change',
            'confidence_threshold', 'volatility_threshold', 'atr_multiplier',
            'rsi_period', 'rsi_buy_threshold', 'rsi_sell_threshold',
            'volume_filter_enabled'
        ]
        
        for key in expected_keys:
            self.assertIn(key, config)
        
        # Verify values match strategy settings
        self.assertEqual(config['timeframe'], self.strategy.timeframe)
        self.assertEqual(config['confidence_threshold'], self.strategy.confidence_threshold)

if __name__ == '__main__':
    # Run tests with detailed output
    unittest.main(verbosity=2)