# Live signal scanner - fetches real signals from database
import logging
from ticklet_ai.services.supabase_client import get_client
from ticklet_ai.services.settings_store import get_settings
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def get_candidates() -> List[Dict[str, Any]]:
    """Get live trading signal candidates from database"""
    try:
        supabase = get_client()
        if not supabase:
            logger.warning("Supabase client not available, returning empty candidates")
            return []
        
        # Get active signals from database
        result = supabase.table("signals").select("*").eq("status", "active").order("confidence", desc=True).limit(50).execute()
        
        if not result.data:
            logger.info("No active signals found in database")
            return []
        
        # Convert database signals to scanner format
        candidates = []
        for signal in result.data:
            try:
                # Extract targets from jsonb
                targets = signal.get('targets', {})
                if isinstance(targets, dict):
                    tp1 = targets.get('tp1', 0)
                    tp2 = targets.get('tp2', 0)
                else:
                    tp1 = tp2 = 0
                
                entry_price = float(signal.get('entry_price', 0))
                current_price = entry_price  # Would need live price feed for real current price
                
                # Calculate risk/reward ratio
                stop_loss = float(signal.get('stop_loss', 0))
                rr_tp2 = 0
                if stop_loss and tp2 and entry_price:
                    risk = abs(entry_price - stop_loss)
                    reward = abs(tp2 - entry_price)
                    rr_tp2 = reward / risk if risk > 0 else 0
                
                # Get metadata
                meta = signal.get('meta', {})
                
                candidate = {
                    "symbol": signal['symbol'],
                    "signal_type": signal['side'],
                    "entry_low": entry_price * 0.999,  # Small entry range
                    "entry_high": entry_price * 1.001,
                    "price_now": current_price,
                    "rr_tp2": rr_tp2,
                    "late_p": 0.5,  # Default gate values
                    "extend_p": 0.5,
                    "reentry_p": 0.5,
                    "overext_atr": 1.0,
                    "volume": meta.get('volume', 0),
                    "confidence": float(signal.get('confidence', 0.5)),
                    "entry_score": 0.8 if signal.get('low_entry') else 0.5,
                    "price_change_pct": meta.get('price_change_pct', 0),
                    # Additional fields for UI
                    "id": signal['id'],
                    "created_at": signal['created_at'],
                    "strategy": signal.get('strategy', 'Unknown'),
                    "anomaly": signal.get('anomaly', 0),
                    "ai_summary": signal.get('ai_summary', ''),
                    "targets": targets,
                    "stop_loss": stop_loss
                }
                
                candidates.append(candidate)
                
            except Exception as e:
                logger.error(f"Error processing signal {signal.get('id', 'unknown')}: {e}")
                continue
        
        logger.info(f"Retrieved {len(candidates)} signal candidates from database")
        return candidates
        
    except Exception as e:
        logger.error(f"Error fetching candidates from database: {e}")
        return []