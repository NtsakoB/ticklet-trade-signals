"""
Strategy Optimization Utilities
"""
import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from itertools import product
import json
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StrategyOptimizer:
    """
    Utilities for optimizing strategy parameters and performance analysis.
    """
    
    def __init__(self, strategy_class):
        """
        Initialize optimizer with strategy class.
        
        :param strategy_class: Strategy class to optimize
        """
        self.strategy_class = strategy_class
        self.optimization_results = []
    
    def optimize_parameters(self, dataframe: pd.DataFrame, 
                          parameter_ranges: Dict[str, List], 
                          metric: str = 'sharpe_ratio',
                          max_combinations: int = 1000) -> Dict[str, Any]:
        """
        Optimize strategy parameters using grid search.
        
        :param dataframe: Historical OHLCV data
        :param parameter_ranges: Dictionary of parameter names and their ranges
        :param metric: Optimization metric ('sharpe_ratio', 'total_return', 'max_drawdown')
        :param max_combinations: Maximum parameter combinations to test
        :return: Best parameters and performance metrics
        """
        try:
            logger.info(f"Starting parameter optimization with {len(parameter_ranges)} parameters")
            
            # Generate parameter combinations
            param_names = list(parameter_ranges.keys())
            param_values = list(parameter_ranges.values())
            combinations = list(product(*param_values))
            
            # Limit combinations if too many
            if len(combinations) > max_combinations:
                combinations = combinations[:max_combinations]
                logger.warning(f"Limited to {max_combinations} combinations")
            
            best_score = float('-inf') if metric in ['sharpe_ratio', 'total_return'] else float('inf')
            best_params = {}
            results = []
            
            for i, param_combo in enumerate(combinations):
                try:
                    # Create parameter dictionary
                    params = dict(zip(param_names, param_combo))
                    
                    # Test strategy with these parameters
                    score, metrics = self._test_parameters(dataframe, params, metric)
                    
                    # Track results
                    result = {
                        'parameters': params.copy(),
                        'score': score,
                        'metrics': metrics,
                        'timestamp': datetime.now().isoformat()
                    }
                    results.append(result)
                    
                    # Update best parameters
                    is_better = (score > best_score if metric in ['sharpe_ratio', 'total_return'] 
                               else score < best_score)
                    
                    if is_better:
                        best_score = score
                        best_params = params.copy()
                    
                    if (i + 1) % 50 == 0:
                        logger.info(f"Tested {i + 1}/{len(combinations)} combinations")
                
                except Exception as e:
                    logger.error(f"Error testing parameters {param_combo}: {e}")
                    continue
            
            self.optimization_results = results
            
            optimization_summary = {
                'best_parameters': best_params,
                'best_score': best_score,
                'metric_optimized': metric,
                'total_combinations_tested': len(results),
                'optimization_timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"Optimization complete. Best {metric}: {best_score:.4f}")
            return optimization_summary
            
        except Exception as e:
            logger.error(f"Parameter optimization failed: {e}")
            return {}
    
    def _test_parameters(self, dataframe: pd.DataFrame, params: Dict, 
                        metric: str) -> Tuple[float, Dict]:
        """
        Test strategy with specific parameters.
        
        :param dataframe: Historical data
        :param params: Strategy parameters
        :param metric: Metric to calculate
        :return: Score and detailed metrics
        """
        try:
            # Initialize strategy with parameters
            strategy = self.strategy_class(config=params)
            
            # Populate indicators
            df_with_indicators = strategy.populate_indicators(dataframe, {'pair': 'TEST'})
            
            # Generate entry/exit signals
            df_with_signals = strategy.populate_entry_trend(df_with_indicators, {'pair': 'TEST'})
            df_with_signals = strategy.populate_exit_trend(df_with_signals, {'pair': 'TEST'})
            
            # Calculate performance metrics
            metrics = self._calculate_performance_metrics(df_with_signals)
            
            return metrics.get(metric, 0), metrics
            
        except Exception as e:
            logger.error(f"Error testing parameters: {e}")
            return 0, {}
    
    def _calculate_performance_metrics(self, dataframe: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate performance metrics from signal dataframe.
        
        :param dataframe: DataFrame with signals
        :return: Performance metrics dictionary
        """
        try:
            # Simulate trades based on signals
            trades = self._simulate_trades(dataframe)
            
            if not trades:
                return {'total_return': 0, 'sharpe_ratio': 0, 'max_drawdown': 1}
            
            # Calculate returns
            returns = pd.Series([trade['return'] for trade in trades])
            total_return = (1 + returns).prod() - 1
            
            # Calculate Sharpe ratio (assuming daily returns)
            if returns.std() > 0:
                sharpe_ratio = returns.mean() / returns.std() * np.sqrt(252)  # Annualized
            else:
                sharpe_ratio = 0
            
            # Calculate maximum drawdown
            cumulative_returns = (1 + returns).cumprod()
            running_max = cumulative_returns.expanding().max()
            drawdown = (cumulative_returns - running_max) / running_max
            max_drawdown = drawdown.min()
            
            # Win rate
            win_rate = (returns > 0).mean()
            
            # Average trade return
            avg_return = returns.mean()
            
            return {
                'total_return': total_return,
                'sharpe_ratio': sharpe_ratio,
                'max_drawdown': abs(max_drawdown),
                'win_rate': win_rate,
                'avg_return': avg_return,
                'total_trades': len(trades)
            }
            
        except Exception as e:
            logger.error(f"Error calculating performance metrics: {e}")
            return {'total_return': 0, 'sharpe_ratio': 0, 'max_drawdown': 1}
    
    def _simulate_trades(self, dataframe: pd.DataFrame) -> List[Dict]:
        """
        Simulate trades based on entry/exit signals.
        
        :param dataframe: DataFrame with signals
        :return: List of simulated trades
        """
        trades = []
        position = None
        
        try:
            for i, row in dataframe.iterrows():
                # Check for entry signals
                if row.get('enter_long', 0) == 1 and position is None:
                    position = {
                        'type': 'long',
                        'entry_price': row['close'],
                        'entry_time': i
                    }
                elif row.get('enter_short', 0) == 1 and position is None:
                    position = {
                        'type': 'short',
                        'entry_price': row['close'],
                        'entry_time': i
                    }
                
                # Check for exit signals
                elif position is not None:
                    should_exit = False
                    
                    if position['type'] == 'long' and row.get('exit_long', 0) == 1:
                        should_exit = True
                    elif position['type'] == 'short' and row.get('exit_short', 0) == 1:
                        should_exit = True
                    
                    if should_exit:
                        # Calculate trade return
                        if position['type'] == 'long':
                            trade_return = (row['close'] - position['entry_price']) / position['entry_price']
                        else:  # short
                            trade_return = (position['entry_price'] - row['close']) / position['entry_price']
                        
                        trades.append({
                            'type': position['type'],
                            'entry_price': position['entry_price'],
                            'exit_price': row['close'],
                            'entry_time': position['entry_time'],
                            'exit_time': i,
                            'return': trade_return
                        })
                        
                        position = None
            
            return trades
            
        except Exception as e:
            logger.error(f"Error simulating trades: {e}")
            return []
    
    def export_optimization_results(self, filename: str) -> None:
        """
        Export optimization results to JSON file.
        
        :param filename: Output filename
        """
        try:
            with open(filename, 'w') as f:
                json.dump(self.optimization_results, f, indent=4)
            logger.info(f"Optimization results exported to {filename}")
        except Exception as e:
            logger.error(f"Failed to export results: {e}")
    
    def get_parameter_sensitivity(self, parameter: str, metric: str = 'sharpe_ratio') -> pd.DataFrame:
        """
        Analyze sensitivity of a specific parameter.
        
        :param parameter: Parameter name to analyze
        :param metric: Metric to analyze
        :return: DataFrame with parameter values and corresponding scores
        """
        try:
            if not self.optimization_results:
                logger.warning("No optimization results available")
                return pd.DataFrame()
            
            # Extract parameter values and scores
            data = []
            for result in self.optimization_results:
                if parameter in result['parameters']:
                    data.append({
                        'parameter_value': result['parameters'][parameter],
                        'score': result['metrics'].get(metric, 0)
                    })
            
            df = pd.DataFrame(data)
            
            # Group by parameter value and calculate statistics
            sensitivity = df.groupby('parameter_value')['score'].agg(['mean', 'std', 'count']).reset_index()
            sensitivity.columns = ['parameter_value', 'mean_score', 'std_score', 'count']
            
            return sensitivity.sort_values('mean_score', ascending=False)
            
        except Exception as e:
            logger.error(f"Error analyzing parameter sensitivity: {e}")
            return pd.DataFrame()
    
    def generate_optimization_report(self) -> str:
        """
        Generate a comprehensive optimization report.
        
        :return: Report string
        """
        if not self.optimization_results:
            return "No optimization results available"
        
        try:
            # Get best result
            best_result = max(self.optimization_results, key=lambda x: x.get('score', 0))
            
            # Calculate summary statistics
            scores = [r.get('score', 0) for r in self.optimization_results]
            
            report = f"""
STRATEGY OPTIMIZATION REPORT
============================

Best Parameters:
{json.dumps(best_result['parameters'], indent=2)}

Best Score: {best_result['score']:.4f}

Performance Summary:
- Total combinations tested: {len(self.optimization_results)}
- Score range: {min(scores):.4f} to {max(scores):.4f}
- Score mean: {np.mean(scores):.4f}
- Score std: {np.std(scores):.4f}

Best Result Metrics:
{json.dumps(best_result['metrics'], indent=2)}

Optimization completed: {best_result['timestamp']}
"""
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            return "Error generating optimization report"