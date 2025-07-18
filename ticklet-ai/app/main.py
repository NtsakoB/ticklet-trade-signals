# FastAPI Entry Point for Ticklet AI
# Main application and API routes

from fastapi import FastAPI

app = FastAPI(title="Ticklet AI", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Ticklet AI Service"}