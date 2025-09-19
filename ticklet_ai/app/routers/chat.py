from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import os, json, httpx, asyncio
from openai import OpenAI

router = APIRouter(prefix="/api/chat", tags=["chat"])

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    # raise at import time would break startup; instead log at call time
    pass
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    strategy: Optional[str] = None
    mode: Optional[str] = None
    allow_general: bool = True

# BACKEND_URL comes from environment; when running monolith we allow relative
BACKEND_URL = os.getenv("BACKEND_URL", "").rstrip("/")
def _url(p: str) -> str:
    if BACKEND_URL:
        return f"{BACKEND_URL}{p}"
    # Fallback to relative for same-service
    return p

ENDPOINTS = {
    "engine_settings": _url("/api/settings"),
    "bg_status": _url("/bg/status"),
    "ml_status": _url("/ml/status"),
    "ml_predict": _url("/ml/predict"),
    "ml_learning_curve": _url("/ml/learning_curve"),
    "paper_status": _url("/paper/state"),
    "trades_recent": _url("/trades/recent"),
    "trade_detail": _url("/trades/detail"),  # expects ?id=...
    "portfolio": _url("/portfolio/summary"),
    "price": _url("/market/price"),          # expects ?symbol=ETHUSDT
}

# ---- HTTP helpers with retry & timeouts ----
async def _get(url: str, params: Dict[str, Any] | None = None, retries: int = 2, timeout: float = 20.0):
    last = None
    for i in range(retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as http:
                r = await http.get(url, params=params)
                r.raise_for_status()
                return r.json()
        except Exception as e:
            last = e
            await asyncio.sleep(0.35 * (i + 1))
    raise HTTPException(502, f"Backend call failed for {url}: {last}")

async def _post(url: str, data: Dict[str, Any], retries: int = 1, timeout: float = 20.0):
    last = None
    for i in range(retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as http:
                r = await http.post(url, json=data)
                r.raise_for_status()
                return r.json()
        except Exception as e:
            last = e
            await asyncio.sleep(0.35 * (i + 1))
    raise HTTPException(502, f"Backend call failed for {url}: {last}")

# ---- Tool impls ----
async def get_portfolio(): return await _get(ENDPOINTS["portfolio"])
async def get_paper_status(): return await _get(ENDPOINTS["paper_status"])
async def get_price(symbol: str): return await _get(ENDPOINTS["price"], {"symbol": symbol})
async def get_trade_explanation(trade_id: str):
    data = await _get(ENDPOINTS["trade_detail"], {"id": trade_id})
    features = data.get("features") or {}
    if features:
        try:
            ml = await _post(ENDPOINTS["ml_predict"], {"features": features})
            data["ml_win_prob"] = ml.get("win_prob")
        except Exception:
            data["ml_win_prob"] = None
    return data
async def get_engine_settings(): return await _get(ENDPOINTS["engine_settings"])
async def get_bg_status(): return await _get(ENDPOINTS["bg_status"])
async def get_ml_status(): return await _get(ENDPOINTS["ml_status"])

TOOLS = [
    {"type":"function","function":{"name":"tool_get_portfolio","description":"Return balances, exposure, PnL summary, and current mode (paper/live).","parameters":{"type":"object","properties":{}}}},
    {"type":"function","function":{"name":"tool_get_paper_status","description":"Return paper-trading status: open positions, win rate, last trades.","parameters":{"type":"object","properties":{}}}},
    {"type":"function","function":{"name":"tool_get_price","description":"Get latest price for a symbol like BTCUSDT or ETHUSDT.","parameters":{"type":"object","properties":{"symbol":{"type":"string"}},"required":["symbol"]}}}},
    {"type":"function","function":{"name":"tool_get_trade_explanation","description":"Explain why a trade won/lost for a trade_id using indicators and ML.","parameters":{"type":"object","properties":{"trade_id":{"type":"string"}},"required":["trade_id"]}}}},
    {"type":"function","function":{"name":"tool_engine_settings","description":"Return engine settings including selected strategy and risk settings.","parameters":{"type":"object","properties":{}}}},
    {"type":"function","function":{"name":"tool_bg_status","description":"Return background strategy runner status and tickers universe.","parameters":{"type":"object","properties":{}}}},
    {"type":"function","function":{"name":"tool_ml_status","description":"Return ML model status and learning curve availability.","parameters":{"type":"object","properties":{}}}},
]

async def dispatch_tool(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    if name == "tool_get_portfolio": return await get_portfolio()
    if name == "tool_get_paper_status": return await get_paper_status()
    if name == "tool_get_price": return await get_price(args.get("symbol","ETHUSDT"))
    if name == "tool_get_trade_explanation": return await get_trade_explanation(args["trade_id"])
    if name == "tool_engine_settings": return await get_engine_settings()
    if name == "tool_bg_status": return await get_bg_status()
    if name == "tool_ml_status": return await get_ml_status()
    raise HTTPException(400, f"Unknown tool: {name}")

SYSTEM_PROMPT = """You are Ticklet's embedded trading copilot.
- You answer general questions concisely.
- For portfolio, trades, or markets, call tools and ground answers in returned data.
- Always state whether numbers reflect PAPER or LIVE.
- For 'is now a good time to buy', give context and risk framing from current strategy rules (informational, not financial advice).
- If endpoints differ slightly, infer intent and respond with best available data.
"""

@router.post("/completions")
async def chat(req: ChatRequest):
    if client is None:
        raise HTTPException(500, "OPENAI_API_KEY is not configured.")

    base_msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    msgs = base_msgs + [m.model_dump() for m in req.messages]

    try:
        first = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=msgs,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.2,
        )
    except Exception as e:
        raise HTTPException(502, f"OpenAI error (first call): {e}")

    m = first.choices[0].message
    tool_calls = m.tool_calls or []
    tool_msgs = []
    for call in tool_calls:
        try:
            args = json.loads(call.function.arguments or "{}")
            data = await dispatch_tool(call.function.name, args)
            tool_msgs.append({"role":"tool","tool_call_id":call.id,"name":call.function.name,"content":json.dumps(data)[:8000]})
        except Exception as e:
            tool_msgs.append({"role":"tool","tool_call_id":call.id,"name":call.function.name,"content":json.dumps({"error":str(e)})})

    if tool_msgs:
        try:
            second = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=msgs + [m.model_dump()] + tool_msgs,
                temperature=0.2,
            )
            return {"content": second.choices[0].message.content, "tool_calls": [t["name"] for t in tool_msgs]}
        except Exception as e:
            # If follow-up completion fails, degrade gracefully with raw tool data
            merged = "\n\n".join([t["content"] for t in tool_msgs])
            return {"content": f"(Degraded mode) Tools data:\n{merged}", "tool_calls": [t["name"] for t in tool_msgs]}
    else:
        return {"content": m.content, "tool_calls": []}