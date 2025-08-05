# Signal Learning Tracker
# Tracks and learns from AI-generated, paper, backtest, and live trade signals
# Logs outcomes (TP/SL), generates learning curves, and exports reports

import json
import os
import logging
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Any
import matplotlib.pyplot as plt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
LEARNING_DATA_FILE = os.getenv("LEARNING_DATA_FILE", "learning_curve_data.json")

class SignalLearningTracker:
    """
    Tracks trading signals and their outcomes to improve AI decision-making.
    Supports multiple modes: signal, paper, backtest, live.
    """
    
    def __init__(self):
        self.data = self.load_data()
    
    def load_data(self) -> Dict[str, Any]:
        """Load learning data from file with error handling."""
        if os.path.exists(LEARNING_DATA_FILE):
            try:
                with open(LEARNING_DATA_FILE, "r") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Error loading data: {e}")
                return defaultdict(lambda: defaultdict(list))
        return defaultdict(lambda: defaultdict(list))
    
    def save_data(self, force: bool = False) -> None:
        """Save data to file conditionally or when forced."""
        if force or os.getenv("SAVE_DATA_ON_LOG", "false").lower() == "true":
            try:
                with open(LEARNING_DATA_FILE, "w") as f:
                    json.dump(self.data, f, indent=4)
                logger.info(f"Data saved to {LEARNING_DATA_FILE}")
            except IOError as e:
                logger.error(f"Error saving data: {e}")
    
    def validate_signal_inputs(self, symbol: str, signal_type: str, entry: float, targets: List[float]) -> None:
        """Validate input parameters for signal logging."""
        if not symbol or not isinstance(symbol, str):
            raise ValueError("Symbol must be a non-empty string.")
        
        if signal_type not in ["long", "short"]:
            raise ValueError(f"Invalid signal_type: {signal_type}. Must be 'long' or 'short'.")
        
        if not isinstance(entry, (float, int)) or entry <= 0:
            raise ValueError("Entry price must be a positive number.")
        
        if not isinstance(targets, list) or not all(isinstance(t, (float, int)) and t > 0 for t in targets):
            raise ValueError("Targets must be a list of positive numbers.")
    
    def evaluate_signal(self, signal_type: str, entry: float, targets: List[float], hit_price: float) -> str:
        """Evaluate signal outcome based on hit price and targets."""
        def target_hit(hit_price: float, targets: List[float], reverse: bool = False) -> Optional[str]:
            """Check which target was hit."""
            targets = sorted(targets, reverse=reverse)
            for i, target in enumerate(targets):
                if (hit_price >= target if not reverse else hit_price <= target):
                    return f"TP{i+1}"
            return None
        
        if signal_type == "long":
            tp_result = target_hit(hit_price, targets)
            if tp_result:
                return tp_result
            elif hit_price <= entry * 0.9:  # 10% stop loss
                return "SL"
            else:
                return "Neutral"
        
        elif signal_type == "short":
            tp_result = target_hit(hit_price, targets, reverse=True)
            if tp_result:
                return tp_result
            elif hit_price >= entry * 1.1:  # 10% stop loss
                return "SL"
            else:
                return "Neutral"
        
        return "Neutral"
    
    def log_signal(self, symbol: str, signal_type: str, entry: float, targets: List[float], 
                   hit_price: float, mode: str = "signal", timestamp: Optional[str] = None) -> None:
        """Log a trading signal with its outcome."""
        try:
            # Validate inputs
            self.validate_signal_inputs(symbol, signal_type, entry, targets)
            
            if mode not in ["signal", "paper", "backtest", "live"]:
                raise ValueError(f"Invalid mode: {mode}. Must be one of: signal, paper, backtest, live.")
            
            # Evaluate outcome
            outcome = self.evaluate_signal(signal_type, entry, targets, hit_price)
            
            # Create record
            record = {
                "timestamp": timestamp or datetime.now().isoformat(),
                "signal_type": signal_type,
                "entry": entry,
                "targets": targets,
                "hit_price": hit_price,
                "outcome": outcome
            }
            
            # Store in data structure
            if mode not in self.data:
                self.data[mode] = defaultdict(list)
            
            self.data[mode][symbol].append(record)
            
            logger.info(f"Signal logged: {symbol} {signal_type} -> {outcome} ({mode})")
            
            # Save data
            self.save_data()
            
        except Exception as e:
            logger.error(f"Error logging signal: {e}")
            raise
    
    def get_outcome_counts(self, mode: str = "signal") -> Dict[str, int]:
        """Get count of outcomes for a specific mode."""
        results = defaultdict(int)
        mode_data = self.data.get(mode, {})
        
        for symbol_records in mode_data.values():
            for record in symbol_records:
                results[record["outcome"]] += 1
        
        return dict(results)
    
    def generate_learning_curve(self, mode: str = "signal") -> None:
        """Generate and save learning curve visualization."""
        results = self.get_outcome_counts(mode)
        
        if not results:
            logger.warning(f"No results to plot for mode: {mode}")
            return
        
        try:
            # Create visualization
            labels, counts = zip(*results.items())
            colors = {
                "TP1": "#10b981", "TP2": "#059669", "TP3": "#047857",
                "SL": "#ef4444", "Neutral": "#6b7280"
            }
            
            plt.figure(figsize=(10, 6))
            plt.title(f"{mode.upper()} Learning Curve - Signal Outcomes")
            
            bar_colors = [colors.get(label, "#3b82f6") for label in labels]
            bars = plt.bar(labels, counts, color=bar_colors)
            
            plt.xlabel("Outcome")
            plt.ylabel("Count")
            
            # Add percentage annotations
            total = sum(counts)
            for bar in bars:
                height = bar.get_height()
                percentage = (height / total) * 100
                plt.text(bar.get_x() + bar.get_width() / 2, height, 
                        f"{percentage:.1f}%", ha="center", va="bottom")
            
            # Save plot
            filename = f"{mode}_learning_curve.png"
            plt.tight_layout()
            plt.savefig(filename, dpi=150, bbox_inches='tight')
            plt.close()
            
            logger.info(f"Learning curve saved: {filename}")
            
        except Exception as e:
            logger.error(f"Error generating learning curve: {e}")
    
    def export_report(self, mode: str = "signal") -> None:
        """Export detailed report with summary statistics."""
        try:
            report_file = f"{mode}_signal_report.json"
            mode_data = self.data.get(mode, {})
            
            # Calculate summary statistics
            results = self.get_outcome_counts(mode)
            total_signals = sum(results.values())
            
            # Calculate success rates
            tp_signals = sum(count for outcome, count in results.items() if outcome.startswith("TP"))
            success_rate = (tp_signals / total_signals * 100) if total_signals > 0 else 0
            
            summary = {
                "mode": mode,
                "total_signals": total_signals,
                "success_rate_percent": round(success_rate, 2),
                "outcome_breakdown": results,
                "symbols_tracked": list(mode_data.keys()),
                "generated_at": datetime.now().isoformat()
            }
            
            # Create full report
            report = {
                "summary": summary,
                "details": mode_data
            }
            
            # Save report
            with open(report_file, "w") as f:
                json.dump(report, f, indent=4)
            
            logger.info(f"Report exported: {report_file}")
            logger.info(f"Summary - Total: {total_signals}, Success Rate: {success_rate:.1f}%")
            
        except Exception as e:
            logger.error(f"Error exporting report: {e}")
    
    def get_symbol_performance(self, symbol: str, mode: str = "signal") -> Dict[str, Any]:
        """Get performance statistics for a specific symbol."""
        mode_data = self.data.get(mode, {})
        symbol_records = mode_data.get(symbol, [])
        
        if not symbol_records:
            return {"error": f"No data found for {symbol} in {mode} mode"}
        
        # Calculate statistics
        outcomes = [record["outcome"] for record in symbol_records]
        outcome_counts = defaultdict(int)
        for outcome in outcomes:
            outcome_counts[outcome] += 1
        
        total = len(outcomes)
        tp_count = sum(count for outcome, count in outcome_counts.items() if outcome.startswith("TP"))
        success_rate = (tp_count / total * 100) if total > 0 else 0
        
        return {
            "symbol": symbol,
            "mode": mode,
            "total_signals": total,
            "success_rate_percent": round(success_rate, 2),
            "outcome_breakdown": dict(outcome_counts),
            "recent_signals": symbol_records[-5:]  # Last 5 signals
        }
    
    def clear_data(self, mode: Optional[str] = None, symbol: Optional[str] = None) -> None:
        """Clear learning data (use with caution)."""
        try:
            if mode and symbol:
                # Clear specific symbol in mode
                if mode in self.data and symbol in self.data[mode]:
                    del self.data[mode][symbol]
                    logger.info(f"Cleared data for {symbol} in {mode} mode")
            elif mode:
                # Clear entire mode
                if mode in self.data:
                    del self.data[mode]
                    logger.info(f"Cleared all data for {mode} mode")
            else:
                # Clear all data
                self.data = defaultdict(lambda: defaultdict(list))
                logger.info("Cleared all learning data")
            
            self.save_data(force=True)
            
        except Exception as e:
            logger.error(f"Error clearing data: {e}")
    
    def get_learning_insights(self, mode: str = "signal") -> Dict[str, Any]:
        """Generate AI learning insights and recommendations."""
        results = self.get_outcome_counts(mode)
        total_signals = sum(results.values())
        
        if total_signals == 0:
            return {"message": "No data available for insights"}
        
        tp_signals = sum(count for outcome, count in results.items() if outcome.startswith("TP"))
        sl_signals = results.get("SL", 0)
        neutral_signals = results.get("Neutral", 0)
        
        success_rate = (tp_signals / total_signals) * 100
        stop_loss_rate = (sl_signals / total_signals) * 100
        
        # Generate insights
        insights = {
            "performance_summary": {
                "total_signals": total_signals,
                "success_rate": round(success_rate, 2),
                "stop_loss_rate": round(stop_loss_rate, 2),
                "neutral_rate": round((neutral_signals / total_signals) * 100, 2)
            },
            "recommendations": []
        }
        
        # Add recommendations based on performance
        if success_rate > 70:
            insights["recommendations"].append("Excellent performance! Consider increasing position sizes.")
        elif success_rate > 50:
            insights["recommendations"].append("Good performance. Focus on reducing stop losses.")
        else:
            insights["recommendations"].append("Performance needs improvement. Review entry criteria.")
        
        if stop_loss_rate > 30:
            insights["recommendations"].append("High stop loss rate. Consider tighter risk management.")
        
        return insights