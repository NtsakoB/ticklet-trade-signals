from .ai_client import get_openai, get_openai_model
from ..config.env import AI_ENABLED

def enrich_and_persist_signal(sig: dict) -> dict:
    # ML confidence placeholder - integrate with actual ML service
    try:
        # This would call actual ML prediction service
        sig["ml_confidence"] = 0.75  # placeholder
    except Exception:
        sig["ml_status"] = "UNTRAINED"

    # AI commentary
    if AI_ENABLED and not sig.get("ai_commentary"):
        try:
            client = get_openai()
            model = get_openai_model()
            prompt = f"Explain this trading signal briefly: {sig.get('symbol')} {sig.get('side')} at {sig.get('entry_price')}"
            res = client.chat.completions.create(
                model=model, 
                messages=[{"role":"user","content":prompt}], 
                temperature=0.2
            )
            sig["ai_commentary"] = res.choices[0].message.content.strip()
        except Exception:
            sig.setdefault("ai_commentary","")

    # Persist to database (placeholder - integrate with actual persistence)
    # upsert_signal(sig)
    return sig