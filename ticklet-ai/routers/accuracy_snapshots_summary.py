from fastapi import APIRouter, HTTPException
from typing import List, Dict
from datetime import datetime, timedelta
import logging
from supabase import create_client

# Initialize Supabase client
SUPABASE_URL = "https://gjtetfgujpcyhjenudnb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdGV0Zmd1anBjeWhqZW51ZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzQ5NjQsImV4cCI6MjA2NzcxMDk2NH0.RJddAD-2oCXMFaNCjBFMjqqGiwn21tfU3x8Kxgm9Y3s"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()
logging.basicConfig(level=logging.INFO)

def fetch_accuracy_logs() -> List[Dict[str, str]]:
    """
    Fetches accuracy logs for the past 7 days from Supabase.
    
    Returns:
        List[Dict[str, str]]: A list of accuracy logs, each containing the date,
        strategy, and accuracy value.
    """
    try:
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        result = supabase.table("accuracy_snapshots") \
                        .select("timestamp, strategy, min_accuracy, max_accuracy, accuracy_curve") \
                        .gte("timestamp", seven_days_ago.isoformat()) \
                        .order("timestamp", desc=True) \
                        .execute()
        
        logs = []
        for entry in result.data or []:
            # Use average of min/max accuracy, or calculate from curve if available
            if entry.get("accuracy_curve") and len(entry["accuracy_curve"]) > 0:
                accuracy = sum(entry["accuracy_curve"]) / len(entry["accuracy_curve"])
            elif entry.get("min_accuracy") and entry.get("max_accuracy"):
                accuracy = (entry["min_accuracy"] + entry["max_accuracy"]) / 2
            else:
                continue  # Skip entries without accuracy data
                
            logs.append({
                "date": datetime.fromisoformat(entry["timestamp"].replace('Z', '+00:00')).strftime("%Y-%m-%d"),
                "strategy": entry["strategy"],
                "accuracy": round(accuracy, 2)
            })
        
        return logs
    except Exception as e:
        logging.error(f"Error fetching accuracy logs from Supabase: {e}")
        return []

@router.get("/api/accuracy_snapshots/summary")
async def get_accuracy_summary() -> Dict[str, List[Dict[str, float]]]:
    """
    Generates a summary of accuracy logs grouped by strategy.
    
    Returns:
        Dict[str, List[Dict[str, float]]]: A summary of accuracy logs, grouped
        by strategy, with each strategy containing a list of date-accuracy pairs.
    """
    try:
        logs = fetch_accuracy_logs()

        # Validate data
        if not isinstance(logs, list):
            raise ValueError("Invalid data fetched from the database.")

        summary: Dict[str, List[Dict[str, float]]] = {}

        # Group and sort logs by strategy
        for entry in logs:
            strategy = entry["strategy"]
            if strategy not in summary:
                summary[strategy] = []

            summary[strategy].append({
                "date": entry["date"],
                "accuracy": entry["accuracy"]
            })

        # Sort logs by date (descending order) within each strategy
        for strategy_logs in summary.values():
            strategy_logs.sort(key=lambda x: x["date"], reverse=True)

        return {"summary": summary}

    except ValueError as ve:
        logging.error(f"Data validation error: {ve}")
        raise HTTPException(status_code=500, detail="Invalid data fetched.")
    except Exception as e:
        logging.error(f"Error generating accuracy summary: {e}")
        raise HTTPException(status_code=500, detail="Could not generate accuracy summary.")