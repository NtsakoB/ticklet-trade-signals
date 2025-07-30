import datetime
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
import random

router = APIRouter()
logging.basicConfig(level=logging.INFO)

def generate_mock_report() -> str:
    """
    Generates a mock AI daily summary report and saves it to the 'reports' directory.

    Returns:
        str: The content of the generated report.
    """
    try:
        today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        
        # Mock data for realistic report
        strategies = ["Ticklet Alpha", "Bull Strategy", "JAM Bot"]
        symbols = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "ADAUSDT", "SOLUSDT"]
        
        top_strategy = random.choice(strategies)
        worst_strategy = random.choice([s for s in strategies if s != top_strategy])
        best_symbol = random.choice(symbols)
        accuracy = random.randint(65, 85)
        
        content = f"""📊 AI Daily Summary — {today}

🎯 PERFORMANCE OVERVIEW
✅ Top Strategy: {top_strategy} ({accuracy}% accuracy)
📉 Lowest Accuracy: {worst_strategy} ({random.randint(45, 64)}% accuracy)
📈 Best Performing Symbol: {best_symbol}
🔄 Total Signals Generated: {random.randint(25, 45)}

⚠️ KEY INSIGHTS
• Common Mistake: RSI overbought re-entry too early
• Market Condition: {random.choice(['Volatile', 'Trending', 'Consolidating'])}
• Risk Level: {random.choice(['Low', 'Medium', 'High'])}

🧠 ML RECOMMENDATIONS
• Consider tightening stop-loss on volatile pairs
• Increase confidence threshold during high volatility
• Monitor {random.choice(symbols)} for breakout patterns

📊 ACCURACY METRICS
• Overall Model Accuracy: {accuracy}%
• False Positive Rate: {random.randint(15, 25)}%
• Sharpe Ratio: {random.uniform(1.2, 2.8):.2f}

— End of Report —
Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
"""
        
        # Ensure the 'reports' directory exists
        path = Path("reports")
        path.mkdir(exist_ok=True)

        # Write the report to a file
        report_path = path / f"ai_report_{today}.txt"
        report_path.write_text(content, encoding="utf-8")
        logging.info(f"Report written to {report_path}")

        return content
        
    except Exception as e:
        logging.error(f"Error while generating the report: {e}")
        raise

@router.get("/api/report/generate")
async def generate_report():
    """
    API endpoint to generate and return the daily AI summary report.

    Returns:
        dict: A dictionary containing the generated report content.
    """
    try:
        content = generate_mock_report()
        
        return {
            "status": "success",
            "report": content,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "report_type": "daily_ai_summary"
        }
        
    except Exception as e:
        logging.error(f"Failed to generate report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate the report.")

@router.get("/api/report/list")
async def list_reports():
    """
    Lists all available reports in the reports directory.
    """
    try:
        reports_path = Path("reports")
        
        if not reports_path.exists():
            return {"reports": [], "count": 0}
            
        report_files = list(reports_path.glob("ai_report_*.txt"))
        reports = [
            {
                "filename": f.name,
                "date": f.stem.replace("ai_report_", ""),
                "size": f.stat().st_size,
                "created": datetime.datetime.fromtimestamp(f.stat().st_ctime).isoformat()
            }
            for f in sorted(report_files, reverse=True)
        ]
        
        return {
            "status": "success",
            "reports": reports,
            "count": len(reports)
        }
        
    except Exception as e:
        logging.error(f"Failed to list reports: {e}")
        raise HTTPException(status_code=500, detail="Failed to list reports.")