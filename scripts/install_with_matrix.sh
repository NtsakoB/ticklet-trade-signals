#!/usr/bin/env bash
set -euo pipefail

echo "=== Ticklet rotating installer (A -> B) ==="
pip --version
python -V

BASE_REQ="requirements.base.txt"

# Build a base file (everything EXCEPT the 4 contentious deps)
if [ ! -f "$BASE_REQ" ]; then
  echo "Generating $BASE_REQ from requirements.txt (removing supabase/httpx/gotrue/httpcore lines)..."
  # keep all other lines; strip only the four packages with pinned versions
  grep -viE '^(httpx|httpcore|supabase|gotrue)\s*==\s*' requirements.txt > "$BASE_REQ" || true
fi

echo "=== Installing base requirements from $BASE_REQ ==="
pip install --no-cache-dir -r "$BASE_REQ"

# Version sets:
# A) Stable (no httpcore 1.x)
SET_A="httpx==0.24.1 httpcore==0.17.3 gotrue==2.6.0 supabase==2.3.3"
# B) Newer (uses httpcore 1.x)
SET_B="httpx==0.25.2 httpcore==1.0.4 gotrue==2.8.0 supabase==2.3.3"

attempt_install () {
  local combo="$1"
  echo "=== Attempt: $combo ==="
  # ensure previous attempt doesn't contaminate the next
  pip uninstall -y httpx httpcore supabase gotrue >/dev/null 2>&1 || true
  pip install --no-cache-dir $combo
}

# Try A
if attempt_install "$SET_A"; then
  echo "=== Success with SET A ==="
else
  echo "=== SET A failed — falling back to SET B ==="
  attempt_install "$SET_B"
  echo "=== Success with SET B ==="
fi

# Print resolved versions for verification
python - <<'PY'
import importlib, importlib.metadata as md
pkgs = ["httpx","httpcore","supabase","gotrue","fastapi","uvicorn"]
print("::resolved_versions", {p:(md.version(p) if importlib.util.find_spec(p) else "missing") for p in pkgs})
PY
