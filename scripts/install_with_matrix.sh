#!/usr/bin/env bash
set -euo pipefail

echo "=== Ticklet rotating installer: starting ==="

BASE_REQ="requirements.base.txt"
# Split your requirements: everything EXCEPT supabase/httpx stuff goes into requirements.base.txt
# If it doesn't exist yet, create it now from requirements.txt by removing the conflicting pins.
if [ ! -f "$BASE_REQ" ]; then
  echo "Generating $BASE_REQ from requirements.txt (removing supabase/httpx/gotrue/httpcore lines)..."
  grep -viE '^(httpx|httpcore|supabase|gotrue) ?=' requirements.txt > "$BASE_REQ" || true
fi

# Matrix of candidate pins (ordered)
CANDIDATES=(
  "httpx==0.25.2 httpcore==0.18.0 gotrue==2.6.0 supabase==2.3.3"
  "httpx==0.25.2 httpcore==0.18.0 gotrue==2.8.0 supabase==2.3.3"
  "httpx==0.25.2 httpcore==0.18.0 gotrue==2.4.2 supabase==2.3.3"
  "httpx==0.24.1 httpcore==0.17.3 gotrue==2.6.0 supabase==2.3.3"
  "httpx==0.24.1 httpcore==0.17.3 gotrue==2.4.2 supabase==2.3.3"
  "httpx==0.25.2 httpcore==0.18.0 gotrue==2.6.0 supabase==2.2.0"
)

pip --version
python -V

# Install base first
echo "=== Installing base requirements from $BASE_REQ ==="
python -m pip install --no-cache-dir -r "$BASE_REQ"

ATTEMPT=0
for combo in "${CANDIDATES[@]}"; do
  ATTEMPT=$((ATTEMPT+1))
  echo "=== Attempt $ATTEMPT: $combo ==="
  if python -m pip install --no-cache-dir $combo; then
    echo "=== Success with: $combo ==="
    # Print resolved versions
    python - <<'PY'
import importlib, importlib.metadata as md
pkgs = ["httpx","httpcore","supabase","gotrue","fastapi","uvicorn"]
print("::resolved_versions", {p:(md.version(p) if importlib.util.find_spec(p) else "missing") for p in pkgs})
PY
    exit 0
  else
    echo "=== Attempt $ATTEMPT failed for: $combo ==="
    echo "Continuing to next candidate..."
  fi

done

echo "=== All candidates failed. Exiting with error. ==="
exit 1
