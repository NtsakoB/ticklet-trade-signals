from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import plotly.graph_objects as go
import base64
from io import BytesIO
import logging

# Logging setup
logging.basicConfig(level=logging.INFO)

router = APIRouter()

# Mocked score breakdown for now
def mock_score_data(symbol: str, strategy: str):
    return {
        "RSI": 23.5,
        "MACD": 18.2,
        "Anomaly": 29.4,
        "AI Model": 28.9  # sum ~ 100%
    }

@router.get("/dashboard/visualize", tags=["Visualization API"], description="Generate a visual chart of AI signal component scores.")
async def visualize_score_breakdown(
    symbol: str = Query(..., description="Trading symbol like BTC/USD."),
    strategy: str = Query("ecosystem", description="Trading strategy."),
    mock: bool = Query(True, description="Enable mock mode for random scores."),
    theme: str = Query("plotly_dark", description="Chart theme (e.g., plotly_dark, ggplot2).")
):
    try:
        logging.info(f"Generating score breakdown for symbol: {symbol}, strategy: {strategy}, mock mode: {mock}")
        scores = mock_score_data(symbol, strategy)

        fig = go.Figure(data=[
            go.Bar(name=key, x=[key], y=[value], text=f"{value}%", textposition='auto')
            for key, value in scores.items()
        ])
        fig.update_layout(
            title=f"Score Breakdown – {symbol.upper()} ({strategy})",
            xaxis_title="Score Component",
            yaxis_title="Weight (%)",
            template=theme,
            height=400
        )

        # Convert to base64-encoded PNG image
        buffer = BytesIO()
        fig.write_image(buffer, format="png")
        encoded_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return JSONResponse(content={
            "status": "ok",
            "symbol": symbol,
            "strategy": strategy,
            "chart_base64": encoded_image
        })

    except Exception as e:
        logging.error(f"Error generating score breakdown: {e}")
        return {"status": "error", "message": str(e)}