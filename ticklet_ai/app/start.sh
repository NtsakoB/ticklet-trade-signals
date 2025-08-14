#!/usr/bin/env bash
set -euo pipefail
python -c "import sys; print('Python', sys.version)"
python ticklet_ai/app/scripts/verify_runtime.py
exec uvicorn ticklet_ai.app.main:app --host 0.0.0.0 --port 8000