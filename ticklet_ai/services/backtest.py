from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import time
import uuid
from ticklet_ai.services.market_data import get_klines
from ticklet_ai.services.leverage import resolve_leverage

# Strategy imports - adapt to actual strategy locations in repo
try:
    from ticklet.strategies.ticklet_alpha import evaluate_smart_signal as alpha_eval
except ImportError:
    alpha_eval = None

try:
    from ticklet_ai.strategies.golden_hook_x.signals import generate_signal as golden_hook_eval
except ImportError:
    golden_hook_eval = None

try:
    from ticklet_ai.services.ml_infer import predict_win_prob
except ImportError:
    def predict_win_prob(features): return 0.5

@dataclass
class BacktestParams:
    strategy_name: str
    symbol: str
    interval: str
    min_volume: float = 50000
    min_price_change_pct: float = 1.0
    max_signals: int = 100
    min_confidence_pct: float = 30.0
    start_time: Optional[int] = None
    end_time: Optional[int] = None

def _get_strategy_evaluator(strategy_name: str):
    """Get the appropriate strategy evaluator function"""
    strategy_map = {
        "Ticklet ALPHA Strategy": alpha_eval,
        "TickletAlpha": alpha_eval,
        "Golden Hook": golden_hook_eval,
        "GoldenHook": golden_hook_eval,
    }
    
    evaluator = strategy_map.get(strategy_name)
    if evaluator is None:
        # Fallback to a mock evaluator that generates basic signals
        return _mock_evaluator
    return evaluator

def _mock_evaluator(symbol: str, timeframe: str, candle: Dict[str, Any] = None):
    """Mock strategy evaluator for when real strategies aren't available"""
    if candle is None:
        return None
        
    # Simple momentum-based mock signal
    close = candle.get("close", 0)
    open_price = candle.get("open", 0)
    volume = candle.get("volume", 0)
    
    if close <= 0 or open_price <= 0:
        return None
        
    price_change_pct = ((close - open_price) / open_price) * 100
    
    # Only generate signals on significant moves
    if abs(price_change_pct) < 0.5:
        return None
        
    confidence = min(abs(price_change_pct) * 0.1 + 0.3, 0.9)
    
    return {
        "status": "ok",
        "signal": "BUY" if price_change_pct > 0 else "SELL",
        "side": "long" if price_change_pct > 0 else "short",
        "ts_utc": candle.get("time", int(time.time())),
        "entry_low": close * 0.999,
        "entry_high": close * 1.001,
        "stop_loss": close * (0.98 if price_change_pct > 0 else 1.02),
        "tp1": close * (1.02 if price_change_pct > 0 else 0.98),
        "tp2": close * (1.05 if price_change_pct > 0 else 0.95),
        "tp3": close * (1.08 if price_change_pct > 0 else 0.92),
        "confidence": confidence,
        "ai_confidence": confidence,
        "indicators": {
            "volume": volume,
            "price_change_pct": price_change_pct,
        },
        "meta": {
            "regime": 1 if price_change_pct > 0 else 0,
            "trending": price_change_pct / 10,
            "anomaly": abs(price_change_pct) / 10,
        }
    }

def _simulate_trade_outcome(signal: Dict[str, Any], next_candles: List[Dict[str, Any]], leverage: int) -> Dict[str, Any]:
    """Simulate trade outcome based on signal and subsequent price action"""
    entry_price = signal.get("entry_low", 0)
    stop_loss = signal.get("stop_loss", 0)
    tp1 = signal.get("tp1", 0)
    tp2 = signal.get("tp2", 0)
    tp3 = signal.get("tp3", 0)
    side = signal.get("side", "long")
    
    if not entry_price or not stop_loss:
        return None
        
    # Look at next few candles to determine outcome
    for i, candle in enumerate(next_candles[:20]):  # Check up to 20 candles ahead
        high = candle.get("high", 0)
        low = candle.get("low", 0)
        close = candle.get("close", 0)
        
        if side == "long":
            # Check if stop loss hit
            if low <= stop_loss:
                pnl_pct = ((stop_loss - entry_price) / entry_price) * 100 * leverage
                return {
                    "exit_price": stop_loss,
                    "exit_reason": "stop_loss",
                    "pnl_pct": pnl_pct,
                    "pnl_abs": 1000 * (pnl_pct / 100),  # Assuming $1000 position size
                    "win": False,
                    "hold_candles": i + 1
                }
            # Check profit targets
            elif high >= tp3:
                pnl_pct = ((tp3 - entry_price) / entry_price) * 100 * leverage
                return {
                    "exit_price": tp3,
                    "exit_reason": "tp3",
                    "pnl_pct": pnl_pct,
                    "pnl_abs": 1000 * (pnl_pct / 100),
                    "win": True,
                    "hold_candles": i + 1
                }
            elif high >= tp2:
                pnl_pct = ((tp2 - entry_price) / entry_price) * 100 * leverage
                return {
                    "exit_price": tp2,
                    "exit_reason": "tp2",
                    "pnl_pct": pnl_pct,
                    "pnl_abs": 1000 * (pnl_pct / 100),
                    "win": True,
                    "hold_candles": i + 1
                }
            elif high >= tp1:
                pnl_pct = ((tp1 - entry_price) / entry_price) * 100 * leverage
                return {
                    "exit_price": tp1,
                    "exit_reason": "tp1", 
                    "pnl_pct": pnl_pct,
                    "pnl_abs": 1000 * (pnl_pct / 100),
                    "win": True,
                    "hold_candles": i + 1
                }
        else:  # short
            # Check if stop loss hit
            if high >= stop_loss:
                pnl_pct = ((entry_price - stop_loss) / entry_price) * 100 * leverage
                return {
                    "exit_price": stop_loss,
                    "exit_reason": "stop_loss",
                    "pnl_pct": pnl_pct,
                    "pnl_abs": 1000 * (pnl_pct / 100),
                    "win": False,
                    "hold_candles": i + 1
                }
            # Check profit targets  
            elif low <= tp3:
                pnl_pct = ((entry_price - tp3) / entry_price) * 100 * leverage
                return {
                    "exit_price": tp3,
                    "exit_reason": "tp3",
                    "pnl_pct": pnl_pct,
                    "pnl_abs": 1000 * (pnl_pct / 100),
                    "win": True,
                    "hold_candles": i + 1
                }
            elif low <= tp2:
                pnl_pct = ((entry_price - tp2) / entry_price) * 100 * leverage
                return {
                    "exit_price": tp2,
                    "exit_reason": "tp2",
                    "pnl_pct": pnl_pct,
                    "pnl_abs": 1000 * (pnl_pct / 100),
                    "win": True,
                    "hold_candles": i + 1
                }
            elif low <= tp1:
                pnl_pct = ((entry_price - tp1) / entry_price) * 100 * leverage
                return {
                    "exit_price": tp1,
                    "exit_reason": "tp1",
                    "pnl_pct": pnl_pct,
                    "pnl_abs": 1000 * (pnl_pct / 100),
                    "win": True,
                    "hold_candles": i + 1
                }
    
    # If no exit condition met, close at last available price
    if next_candles:
        last_close = next_candles[-1].get("close", entry_price)
        if side == "long":
            pnl_pct = ((last_close - entry_price) / entry_price) * 100 * leverage
        else:
            pnl_pct = ((entry_price - last_close) / entry_price) * 100 * leverage
            
        return {
            "exit_price": last_close,
            "exit_reason": "time_exit",
            "pnl_pct": pnl_pct,
            "pnl_abs": 1000 * (pnl_pct / 100),
            "win": pnl_pct > 0,
            "hold_candles": len(next_candles)
        }
    
    return None

def run_backtest(params: BacktestParams) -> Dict[str, Any]:
    """
    Run comprehensive backtest with real strategy evaluation and ML integration
    """
    print(f"Starting backtest: {params.strategy_name} on {params.symbol} {params.interval}")
    
    # Get strategy evaluator
    evaluator = _get_strategy_evaluator(params.strategy_name)
    
    # Fetch historical data
    klines = get_klines(
        symbol=params.symbol,
        interval=params.interval,
        limit=1000,
        start_time=params.start_time,
        end_time=params.end_time
    )
    
    if not klines:
        return {
            "error": "No historical data available",
            "executed": 0,
            "wins": 0,
            "win_rate": 0.0,
            "pnl_abs": 0.0,
            "pnl_pct": 0.0,
            "trades": []
        }
    
    print(f"Loaded {len(klines)} candles for backtest")
    
    # Get leverage setting
    default_strategy_leverage = 10
    leverage = resolve_leverage(default_strategy_leverage)
    
    trades = []
    executed = 0
    wins = 0
    total_pnl_abs = 0.0
    
    # Process each candle
    for i, candle in enumerate(klines[:-20]):  # Leave some candles for trade simulation
        if executed >= params.max_signals:
            break
            
        # Apply volume filter
        quote_volume = candle.get("quote_volume", candle.get("volume", 0) * candle.get("close", 0))
        if quote_volume < params.min_volume:
            continue
        
        # Evaluate strategy
        try:
            if evaluator == alpha_eval:
                # Ticklet Alpha expects symbol and timeframe
                signal = evaluator(symbol=params.symbol, timeframe=params.interval)
            else:
                # Other strategies might expect different parameters
                signal = evaluator(params.symbol, params.interval, candle)
        except Exception as e:
            print(f"Strategy evaluation error: {e}")
            continue
            
        if not signal or signal.get("status") != "ok":
            continue
            
        # Apply confidence filter
        confidence = signal.get("confidence", signal.get("ai_confidence", 0))
        if confidence * 100 < params.min_confidence_pct:
            continue
            
        # Enhance signal with ML prediction if available
        try:
            features = {
                "rsi": signal.get("indicators", {}).get("rsi", 50),
                "macd": signal.get("indicators", {}).get("macd", 0),
                "vol": quote_volume,
                "atr": signal.get("indicators", {}).get("atr", 0),
                "ema_fast": signal.get("indicators", {}).get("ema_fast", candle.get("close", 0)),
                "ema_slow": signal.get("indicators", {}).get("ema_slow", candle.get("close", 0)),
                "bb_upper": signal.get("indicators", {}).get("bb_upper", 0),
                "bb_lower": signal.get("indicators", {}).get("bb_lower", 0),
                "funding_rate": signal.get("indicators", {}).get("funding_rate", 0),
                "spread": signal.get("indicators", {}).get("spread", 0),
                "bid_ask_imbalance": signal.get("indicators", {}).get("bid_ask_imbalance", 0),
                "volatility": signal.get("indicators", {}).get("volatility", 0),
                "regime": signal.get("meta", {}).get("regime", 0),
                "trending_score": signal.get("meta", {}).get("trending", 0),
                "anomaly_score": signal.get("meta", {}).get("anomaly", 0),
            }
            ml_win_prob = predict_win_prob(features)
            signal["ml_win_probability"] = ml_win_prob
        except Exception as e:
            print(f"ML prediction error: {e}")
            signal["ml_win_probability"] = 0.5
        
        # Simulate trade outcome
        next_candles = klines[i+1:i+21]  # Next 20 candles
        outcome = _simulate_trade_outcome(signal, next_candles, leverage)
        
        if outcome:
            trade = {
                "id": str(uuid.uuid4()),
                "symbol": params.symbol,
                "strategy": params.strategy_name,
                "side": signal.get("side", "long"),
                "leverage": leverage,
                "entry_price": signal.get("entry_low", 0),
                "exit_price": outcome.get("exit_price", 0),
                "pnl_abs": outcome.get("pnl_abs", 0),
                "pnl_pct": outcome.get("pnl_pct", 0),
                "win": outcome.get("win", False),
                "confidence": confidence,
                "ml_win_probability": signal.get("ml_win_probability", 0.5),
                "exit_reason": outcome.get("exit_reason", "unknown"),
                "hold_candles": outcome.get("hold_candles", 0),
                "timestamp": candle.get("time", int(time.time())),
                "volume": quote_volume,
                "signal_data": signal
            }
            
            trades.append(trade)
            executed += 1
            
            if trade["win"]:
                wins += 1
                
            total_pnl_abs += trade["pnl_abs"]
    
    # Calculate metrics
    win_rate = (wins / executed) if executed > 0 else 0.0
    starting_balance = 10000.0
    pnl_pct = (total_pnl_abs / starting_balance) * 100 if starting_balance > 0 else 0.0
    
    # Calculate additional metrics
    if trades:
        winning_trades = [t for t in trades if t["win"]]
        losing_trades = [t for t in trades if not t["win"]]
        
        avg_win = sum(t["pnl_abs"] for t in winning_trades) / len(winning_trades) if winning_trades else 0
        avg_loss = sum(t["pnl_abs"] for t in losing_trades) / len(losing_trades) if losing_trades else 0
        profit_factor = abs(avg_win / avg_loss) if avg_loss != 0 else float('inf')
        
        max_consecutive_wins = 0
        max_consecutive_losses = 0
        current_consecutive_wins = 0
        current_consecutive_losses = 0
        
        for trade in trades:
            if trade["win"]:
                current_consecutive_wins += 1
                current_consecutive_losses = 0
                max_consecutive_wins = max(max_consecutive_wins, current_consecutive_wins)
            else:
                current_consecutive_losses += 1
                current_consecutive_wins = 0
                max_consecutive_losses = max(max_consecutive_losses, current_consecutive_losses)
    else:
        profit_factor = 0
        max_consecutive_wins = 0
        max_consecutive_losses = 0
    
    result = {
        "id": str(uuid.uuid4()),
        "executed": executed,
        "wins": wins,
        "losses": executed - wins,
        "win_rate": win_rate,
        "pnl_abs": round(total_pnl_abs, 2),
        "pnl_pct": round(pnl_pct, 2),
        "profit_factor": round(profit_factor, 2) if profit_factor != float('inf') else 999,
        "max_consecutive_wins": max_consecutive_wins,
        "max_consecutive_losses": max_consecutive_losses,
        "leverage_used": leverage,
        "trades": trades,
        "strategy": params.strategy_name,
        "symbol": params.symbol,
        "interval": params.interval,
        "data_points": len(klines),
        "timestamp": int(time.time())
    }
    
    print(f"Backtest completed: {executed} trades, {win_rate:.1%} win rate, {pnl_pct:.2f}% return")
    
    return result