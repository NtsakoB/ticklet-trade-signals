from fastapi import FastAPI
from fastapi.responses import JSONResponse
from predict_schema import PredictionRequest, PredictionResponse
from evaluate_smart_signal import evaluate_signal
from routers.report_latest import router as latest_report_router
import uvicorn
import logging
import os

# Setup logging
logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Include routers
app.include_router(latest_report_router)

@app.post("/predict/score", response_model=PredictionResponse, tags=["Prediction"])
async def predict_score(request: PredictionRequest):
    """
    Predict score based on the provided input features.
    - **request**: Features for prediction.
    - **Returns**: Prediction score and other relevant details.
    """
    logging.info(f"Received request: {request}")
    try:
        result = evaluate_signal(request)
        logging.info(f"Response: {result}")
        return result
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": str(e)}")

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8080))
    uvicorn.run("main:app", host=host, port=port)