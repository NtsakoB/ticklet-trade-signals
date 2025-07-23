from fastapi import APIRouter, Query, HTTPException, Body
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Optional, List
from datetime import datetime
import logging
import io
import csv
from supabase import create_client

# Initialize Supabase client
SUPABASE_URL = "https://gjtetfgujpcyhjenudnb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdGV0Zmd1anBjeWhqZW51ZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzQ5NjQsImV4cCI6MjA2NzcxMDk2NH0.RJddAD-2oCXMFaNCjBFMjqqGiwn21tfU3x8Kxgm9Y3s"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()
logging.basicConfig(level=logging.ERROR)

@router.get("/api/learning_entries")
async def get_learning_entries(
    strategy: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100)
):
    try:
        valid_strategies = ["ecosystem", "growth", "performance"]

        if strategy and strategy not in valid_strategies:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid strategy. Valid options are: {', '.join(valid_strategies)}"
            )

        query = supabase.table("learning_entries") \
                        .select("*") \
                        .order("timestamp", desc=True) \
                        .range(offset, offset + limit - 1)

        if strategy:
            query = query.eq("strategy", strategy)

        result = query.execute()

        return {
            "status": "ok",
            "data": result.data,
            "metadata": {
                "total": len(result.data),
                "offset": offset,
                "limit": limit
            }
        }
    except Exception as e:
        logging.error(f"Error fetching learning entries: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/api/log_accuracy_curve")
async def log_accuracy_curve(
    strategy: str = Body(...),
    accuracy: List[float] = Body(...)
):
    try:
        if not strategy or not isinstance(strategy, str):
            raise HTTPException(status_code=400, detail="Invalid strategy. It must be a non-empty string.")

        if not accuracy or not all(isinstance(a, (int, float)) and 0 <= a <= 100 for a in accuracy):
            raise HTTPException(status_code=400, detail="Accuracy must be a list of numbers (0–100).")

        now = datetime.utcnow().isoformat()
        entry = {
            "timestamp": now,
            "strategy": strategy,
            "accuracy_curve": accuracy,
            "curve_length": len(accuracy),
            "min_accuracy": min(accuracy),
            "max_accuracy": max(accuracy)
        }

        response = supabase.table("accuracy_snapshots").insert(entry).execute()
        
        logging.info(f"Accuracy snapshot logged: strategy={strategy}, timestamp={now}")
        return {
            "status": "ok",
            "message": "Snapshot saved successfully.",
            "timestamp": now,
            "data": entry
        }

    except Exception as e:
        logging.error(f"Error logging accuracy snapshot: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/api/signal_score_log")
async def export_signal_scores(
    offset: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    format: str = Query("json", description="Export format: json or csv")
):
    try:
        if format not in ["json", "csv"]:
            return JSONResponse(status_code=400, content={
                "status": "error",
                "message": "Invalid format. Supported formats: json, csv"
            })

        result = supabase.table("signal_scores") \
                         .select("symbol, strategy, rsi, macd, anomaly, confidence, timestamp") \
                         .order("timestamp", desc=True) \
                         .range(offset, offset + limit - 1) \
                         .execute()

        data = result.data or []

        if not data:
            if format == "csv":
                output = io.StringIO()
                fieldnames = ["symbol", "strategy", "rsi", "macd", "anomaly", "confidence", "timestamp"]
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                output.seek(0)
                return StreamingResponse(io.BytesIO(output.getvalue().encode()), media_type="text/csv", headers={
                    "Content-Disposition": "attachment; filename=signal_scores.csv"
                })
            return JSONResponse(content={"status": "ok", "data": [], "message": "No signal scores found."})

        if format == "csv":
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
            output.seek(0)
            return StreamingResponse(io.BytesIO(output.getvalue().encode()), media_type="text/csv", headers={
                "Content-Disposition": "attachment; filename=signal_scores.csv"
            })

        return JSONResponse(content={
            "status": "ok",
            "data": data,
            "metadata": {
                "total_records": len(data),
                "offset": offset,
                "limit": limit
            }
        })

    except Exception as e:
        logging.error(f"Error exporting signal scores: {e}")
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": "An unexpected error occurred while exporting signal scores."
        })