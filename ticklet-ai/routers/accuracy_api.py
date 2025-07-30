from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime
import logging
from supabase import create_client

# Initialize Supabase client
SUPABASE_URL = "https://gjtetfgujpcyhjenudnb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdGV0Zmd1anBjeWhqZW51ZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzQ5NjQsImV4cCI6MjA2NzcxMDk2NH0.RJddAD-2oCXMFaNCjBFMjqqGiwn21tfU3x8Kxgm9Y3s"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()
logging.basicConfig(level=logging.INFO)

@router.get("/api/accuracy_snapshots")
async def get_accuracy_snapshots(
    strategy: Optional[str] = Query(None, description="Strategy filter: ecosystem, growth, performance"),
    from_date: Optional[datetime] = Query(None, description="Start date (ISO format e.g. 2025-07-01)"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to fetch (max 1000)"),
    offset: int = Query(0, ge=0, description="Number of records to skip")
):
    try:
        # Validate strategy if provided
        valid_strategies = ["ecosystem", "growth", "performance"]
        if strategy and strategy not in valid_strategies:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid strategy. Valid options are: {', '.join(valid_strategies)}"
            )

        query = supabase.table("accuracy_snapshots").select("*").order("timestamp", desc=True)

        if strategy:
            query = query.eq("strategy", strategy)

        if from_date:
            query = query.gte("timestamp", from_date.isoformat())

        query = query.range(offset, offset + limit - 1)
        result = query.execute()
        data = result.data or []

        return {
            "status": "ok",
            "data": data,
            "filters": {
                "strategy": strategy,
                "from_date": from_date.isoformat() if from_date else None,
                "limit": limit,
                "offset": offset,
            },
            "metadata": {
                "total_records": len(data),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching accuracy snapshots: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")