import requests
import os
import logging
from predict_schema import PredictionRequest

# Setup logging
logging.basicConfig(level=logging.INFO)

# Dynamic AI Server URL
AI_SERVER_URL = os.getenv("AI_SERVER_URL", "http://localhost:8080/predict/score")

def send_to_ai(request: PredictionRequest):
    """
    Sends a PredictionRequest to the AI server and returns the response.
    """
    logging.info(f"Sending request to AI server: {request.dict()}")
    try:
        response = requests.post(AI_SERVER_URL, json=request.dict(), timeout=5)
        logging.info(f"Received response: {response.text}")
        if response.status_code == 200:
            return response.json()
        else:
            logging.error(f"Failed request with status code: {response.status_code}")
            return {
                "error": f"Failed to get prediction. Status Code: {response.status_code}",
                "details": response.text
            }
    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {str(e)}")
        return {"error": "Request failed", "details": str(e)}