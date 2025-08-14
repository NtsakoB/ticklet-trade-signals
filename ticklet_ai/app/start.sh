#!/usr/bin/env bash
set -euo pipefail
python ticklet_ai/app/scripts/verify_runtime.py
python ticklet_ai/app/scripts/check_imports.py
exec uvicorn ticklet_ai.app.main:app --host 0.0.0.0 --port 8000