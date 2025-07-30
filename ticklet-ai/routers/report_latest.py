from fastapi import APIRouter, HTTPException
from pathlib import Path
import logging
import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/api/report/latest")
async def get_latest_report():
    """
    Returns the most recent technician report + trading summary.
    Reads from /reports directory if backend is live.
    """
    try:
        report_dir = Path("reports")
        
        # Check if the reports directory exists
        if not report_dir.exists():
            logger.warning("Reports directory does not exist.")
            return {
                "technician": "⏳ Waiting for technician report...",
                "trading": "No summary available yet.",
                "timestamp": None,
                "status": "pending"
            }

        # Get the most recent report file
        files = sorted(report_dir.glob("ai_report_*.txt"), reverse=True)
        if not files:
            logger.warning("No report files found in the reports directory.")
            return {
                "technician": "⏳ Waiting for technician report...",
                "trading": "No summary available yet.",
                "timestamp": None,
                "status": "pending"
            }

        latest_file = files[0]
        timestamp = latest_file.stem.replace("ai_report_", "")
        technician_report = latest_file.read_text(encoding="utf-8")

        # Generate trading summary
        trading_lines = [
            line for line in technician_report.splitlines()
            if any(kw in line for kw in ["Top Strategy", "Lowest Accuracy", "ML Insight"])
        ]
        if len(trading_lines) < 3:
            logger.error("Insufficient data to generate trading summary.")
            raise ValueError("Report format invalid or incomplete.")

        trading_summary = f"""📣 Daily AI Summary — {timestamp}

🏆 {trading_lines[0].replace('✅ ', '')}
📉 {trading_lines[1].replace('📉 ', '')}
🧠 {trading_lines[2].replace('🧠 ', '')}

View full report in Ticklet Technician ✅
"""

        return {
            "technician": technician_report,
            "trading": trading_summary,
            "timestamp": timestamp,
            "status": "ready"
        }

    except FileNotFoundError as fnf_error:
        logger.error(f"File not found: {fnf_error}")
        raise HTTPException(status_code=404, detail="Report file not found.")
    except ValueError as val_error:
        logger.error(f"Validation error: {val_error}")
        raise HTTPException(status_code=400, detail="Invalid report format.")
    except Exception as e:
        logger.error(f"Failed to load latest AI report: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch latest report.")