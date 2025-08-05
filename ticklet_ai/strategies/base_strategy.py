from freqtrade.strategy import IStrategy
from pandas import DataFrame
import pandas as pd
from ticklet_ai.services.ai_signal_evaluator import AISignalEvaluator


class BaseStrategy(IStrategy):
    """
    Base Strategy with Multi-Timeframe Indicator Analysis and AI-Weighted Signal Decision-Making.
    """

    INTERFACE_VERSION = 3
    timeframe = '5m'
    can_short = True
    timeframes = ['5m', '15m', '30m', '1h', '1d']  # Multi-timeframe analysis

    def __init__(self):
        super().__init__()
        self.ai_evaluator = AISignalEvaluator()  # Shared AI service

    def multi_timeframe_analysis(self, dataframe: DataFrame, pair: str) -> dict:
        """
        Perform multi-timeframe analysis for the strategy.

        :param dataframe: DataFrame with market data for the current timeframe.
        :param pair: Trading pair.
        :return: Dictionary of signals for each timeframe.
        """
        signals = {}
        for tf in self.timeframes:
            try:
                # Fetch historical data for each timeframe
                historical_data = self.dp.get_pair_dataframe(pair=pair, timeframe=tf)
                
                # Calculate indicators and generate signals for each timeframe
                signals[tf] = self.generate_signals(historical_data)
            except Exception as e:
                self.logger.warning(f"Failed to get data for {tf}: {e}")
                signals[tf] = {'buy': 0.5, 'sell': 0.5}

        return signals

    def generate_signals(self, dataframe: DataFrame) -> dict:
        """
        Generate buy/sell signals for a given timeframe's dataframe.

        :param dataframe: DataFrame with market data.
        :return: Dictionary with buy/sell probabilities. Example: {'buy': 0.7, 'sell': 0.3}
        """
        if dataframe.empty:
            return {'buy': 0.5, 'sell': 0.5}
            
        # Placeholder logic for signal generation (use actual indicator calculations here)
        buy_signal = dataframe['close'].iloc[-1] > dataframe['close'].mean()
        sell_signal = dataframe['close'].iloc[-1] < dataframe['close'].mean()

        return {'buy': float(buy_signal), 'sell': float(sell_signal)}

    def ai_decision(self, signals: dict) -> dict:
        """
        Use the AI engine to evaluate and decide on trading signals.

        :param signals: Multi-timeframe signals.
        :return: AI-weighted trading decision. Example: {'buy': 0.8, 'sell': 0.2}
        """
        return self.ai_evaluator.evaluate_signals(signals)

    def custom_position_size(self, pair: str, current_time: pd.Timestamp, proposed_amount: float, **kwargs) -> float:
        """
        Dynamic position sizing based on risk and account balance:
        - Risk up to 10% of total balance per trade.
        - Ensure total open positions do not exceed 50% of total balance.
        """
        try:
            total_balance = self.wallets.get_total_balance()
            open_positions_value = sum([trade.calc_open_trade_value() for trade in self.trades])

            # Limit total open positions to 50% of total balance
            available_balance = max(0, (total_balance * 0.5) - open_positions_value)
            if available_balance <= 0:
                self.logger.warning("No available balance for new positions.")
                return 0.0

            # Risk-based position sizing (10% of total balance per trade)
            risk_percentage = 0.10  # Dynamic risk percentage
            risk_amount = total_balance * risk_percentage

            # Calculate position size based on stoploss distance
            stoploss_distance = abs(self.stoploss)
            position_size = risk_amount / stoploss_distance

            # Ensure position size does not exceed available balance or proposed amount
            final_position_size = min(position_size, proposed_amount, available_balance)
            self.logger.debug(
                f"Dynamic position size calculated: {final_position_size} | Available balance: {available_balance} | Total balance: {total_balance}"
            )
            return final_position_size
        except Exception as e:
            self.logger.error(f"Error calculating position size: {e}")
            return proposed_amount * 0.1  # Fallback to 10% of proposed amount