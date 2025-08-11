#!/usr/bin/env bash
set -euo pipefail
echo "=== Install deps (clean, pinned Supabase stack) ==="
python -m pip install --upgrade pip

# Remove conflicting versions if cache leaked
python -m pip uninstall -y httpx httpcore supabase gotrue postgrest storage3 >/dev/null 2>&1 || true
python -m pip cache purge || true

# Install everything
python -m pip install --no-cache-dir -r requirements.txt

# Verify
python - <<'PY'
import importlib, importlib.util, importlib.metadata as md
from supabase import create_client
print("=== Verification ===")
print("supabase version:", md.version("supabase"))
spec = importlib.util.find_spec("supabase")
print("supabase origin:", spec.origin if spec else "NOT FOUND")
print("create_client exists:", hasattr(importlib.import_module("supabase"), "create_client"))
PY
