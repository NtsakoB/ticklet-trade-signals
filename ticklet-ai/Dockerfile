# Dockerfile for Ticklet AI
# Will be finalized later with Python 3.9 + Uvicorn

FROM python:3.9-slim

# Placeholder - to be completed later
WORKDIR /app
COPY . .

# Install dependencies
RUN pip install -r requirements.txt

# Expose port
EXPOSE 8000

# Run with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]