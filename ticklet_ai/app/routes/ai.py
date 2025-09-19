from fastapi import APIRouter
from ..schemas.common import MessageResponse
from ...services.ai_client import get_openai
from ...utils.ml_store import get_curve
import json

router = APIRouter(prefix="/ai", tags=["AI"])

INSIGHTS_SYS = "You are Ticklet AI. Analyze crypto trading logs & metrics. Be concise, actionable, and practical. Return markdown."
OPTIMIZE_SYS = "You are Ticklet Strategy Optimizer. Propose parameter changes grounded in the metrics provided. Return a short bullet list and a JSON block of suggestions."

@router.get("/insights", response_model=MessageResponse)
def ai_insights():
  client, model = get_openai()
  curve = get_curve("learning_curve")
  content = {"learning_curve_tail_10": curve["series"][-10:], "note": "Provide market context, strategy health, and next best actions."}
  msg = client.chat.completions.create(
    model=model,
    messages=[{"role":"system","content":INSIGHTS_SYS},{"role":"user","content":json.dumps(content, ensure_ascii=False)}],
    temperature=0.3
  )
  return {"message": msg.choices[0].message.content}

@router.post("/optimize", response_model=MessageResponse)
def ai_optimize(payload: dict):
  client, model = get_openai()
  msg = client.chat.completions.create(
    model=model,
    messages=[{"role":"system","content":OPTIMIZE_SYS},{"role":"user","content":json.dumps(payload, ensure_ascii=False)}],
    temperature=0.2
  )
  return {"message": msg.choices[0].message.content}