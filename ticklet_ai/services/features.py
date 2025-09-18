from typing import Dict, Any

def build_from_result(symbol: str, timeframe: str, strategy: str, result: Dict[str, Any]) -> Dict[str, Any]:
    ind = result.get("indicators", {}) or {}
    meta = result.get("meta", {}) or {}
    return {
      "ts_utc": result.get("ts_utc") or result.get("timestamp") or result.get("ts") or 0,
      "symbol": symbol,
      "timeframe": timeframe,
      "strategy": strategy,
      "rsi": ind.get("rsi", 50.0),
      "macd": ind.get("macd", 0.0),
      "vol": ind.get("quote_volume", ind.get("volume", 0.0)),
      "atr": ind.get("atr", 0.0),
      "ema_fast": ind.get("ema_fast", 0.0),
      "ema_slow": ind.get("ema_slow", 0.0),
      "bb_upper": ind.get("bb_upper", 0.0),
      "bb_lower": ind.get("bb_lower", 0.0),
      "funding_rate": ind.get("funding_rate", 0.0),
      "spread": ind.get("spread", 0.0),
      "bid_ask_imbalance": ind.get("bid_ask_imbalance", 0.0),
      "volatility": ind.get("volatility", 0.0),
      "regime": meta.get("regime", 0),
      "trending_score": meta.get("trending", 0.0),
      "anomaly_score": meta.get("anomaly", 0.0),
      "raw": result,
    }

def build_features_from_result(symbol: str, timeframe: str, strategy: str, result: Dict[str, Any]) -> Dict[str, Any]:
    ind = result.get("indicators", {}) or {}
    meta = result.get("meta", {}) or {}
    return {
      "rsi": ind.get("rsi", 50.0),
      "macd": ind.get("macd", 0.0),
      "vol": ind.get("quote_volume", ind.get("volume", 0.0)),
      "atr": ind.get("atr", 0.0),
      "ema_fast": ind.get("ema_fast", 0.0),
      "ema_slow": ind.get("ema_slow", 0.0),
      "bb_upper": ind.get("bb_upper", 0.0),
      "bb_lower": ind.get("bb_lower", 0.0),
      "funding_rate": ind.get("funding_rate", 0.0),
      "spread": ind.get("spread", 0.0),
      "bid_ask_imbalance": ind.get("bid_ask_imbalance", 0.0),
      "volatility": ind.get("volatility", 0.0),
      "regime": meta.get("regime", 0),
      "trending_score": meta.get("trending", 0.0),
      "anomaly_score": meta.get("anomaly", 0.0)
    }