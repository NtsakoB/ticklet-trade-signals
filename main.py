from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {
        "status": "Ticklet 7 backend is live 🚀",
        "message": "Ready for AI signals, Telegram, and trading engine"
    }