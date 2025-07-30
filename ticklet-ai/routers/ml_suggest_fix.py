from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
import os
from openai import OpenAI

router = APIRouter()
logging.basicConfig(level=logging.INFO)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class SignalFeedback(BaseModel):
    symbol: str
    strategy: str
    date: str
    entry_reason: str
    outcome: str  # "win" | "loss"
    stop_loss_hit: Optional[bool] = False
    notes: Optional[str] = None

@router.post("/api/ml/suggest_fix")
async def suggest_fix(feedback: SignalFeedback):
    """
    Uses GPT to suggest fixes for a strategy signal that failed or underperformed.
    """
    try:
        # Validate that OpenAI API key is set
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OpenAI API key is not set in environment variables.")

        prompt = (
            f"Analyze the following trade feedback and suggest specific improvements:\n\n"
            f"Symbol: {feedback.symbol}\n"
            f"Strategy: {feedback.strategy}\n"
            f"Date: {feedback.date}\n"
            f"Entry Reason: {feedback.entry_reason}\n"
            f"Outcome: {feedback.outcome}\n"
            f"Stop Loss Hit: {feedback.stop_loss_hit}\n"
            f"Additional Notes: {feedback.notes or 'None'}\n\n"
            f"Provide actionable suggestions to improve this strategy's performance. "
            f"Focus on risk management, entry timing, and exit criteria."
        )

        response = client.chat.completions.create(
            model="gpt-4.1-2025-04-14",
            messages=[
                {"role": "system", "content": "You are an expert trading strategist. Provide clear, actionable advice for improving trading strategies."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=500
        )

        suggestion = response.choices[0].message.content
        
        logging.info(f"Generated suggestion for {feedback.symbol} {feedback.strategy}")
        
        return {
            "status": "success",
            "suggestion": suggestion,
            "feedback_analyzed": {
                "symbol": feedback.symbol,
                "strategy": feedback.strategy,
                "outcome": feedback.outcome
            }
        }

    except ValueError as ve:
        logging.error(f"Validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"Error generating suggestion: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate strategy suggestion.")