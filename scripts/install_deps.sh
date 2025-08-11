#!/usr/bin/env bash
set -euo pipefail

echo "=== Ticklet Installer: A→B rotation with import verification ==="
echo "Python: $(python --version)"
echo "Pip:    $(pip --version)"
python -m pip install --upgrade pip

echo "=== Pre-check: ensure no local 'supabase.py' shadowing ==="
if git ls-files | grep -E '^supabase\.py$|/supabase\.py$' >/dev/null 2>&1; then
  echo "❌ Found a local supabase.py in the repo. Rename/remove it to avoid shadowing." >&2
  exit 1
fi

echo "=== Step 1/4: Install base deps (no supabase/httpx/gotrue/httpcore) ==="
cat > /tmp/base_requirements.txt << 'EOF'
fastapi==0.111.0
uvicorn[standard]==0.30.0
python-dotenv==1.0.1
openai==1.30.1
pyjwt==2.8.0
pydantic==2.7.1
websockets==12.0
aiofiles==23.2.1
xgboost==2.0.3
scikit-learn==1.4.2
pandas==2.2.2
joblib==1.4.2
redis==5.0.3
requests==2.31.0
EOF
python -m pip install --no-cache-dir -r /tmp/base_requirements.txt
echo "✅ Base deps installed"

# Valid pairs only:
SET_A="httpx==0.24.1 httpcore==0.17.3 gotrue==2.6.0 supabase==2.3.3"
SET_B="httpx==0.25.2 httpcore==1.0.4 gotrue==2.8.0 supabase==2.3.3"

install_and_verify () {
  local combo="$1"
  echo "=== Step 2/4: Attempt $combo ==="
  python -m pip uninstall -y httpx httpcore gotrue supabase >/dev/null 2>&1 || true
  python -m pip install --no-cache-dir $combo

  echo "=== Step 3/4: Verify import & symbol ==="
  python - <<'PY'
import sys, importlib.util, importlib.metadata as md
# Print resolved versions and module file locations
pkgs = ["httpx","httpcore","supabase","gotrue","fastapi","uvicorn"]
info = {}
for p in pkgs:
    loc = "NOT_INSTALLED"
    if importlib.util.find_spec(p):
        m = __import__(p)
        loc = getattr(m, "__file__", "builtin")
    info[p] = {"version": (md.version(p) if importlib.util.find_spec(p) else "NOT_INSTALLED"), "file": loc}
print("::resolved_versions", info)
# Now verify supabase.create_client exists
try:
    from supabase import create_client  # v2.x
    print("::supabase_import", "OK")
except Exception as e:
    print("::supabase_import", f"FAIL: {e}")
    sys.exit(2)
PY
}

if install_and_verify "$SET_A"; then
  echo "🚀 Success with SET A"
else
  echo "↩️  SET A failed — trying SET B"
  install_and_verify "$SET_B"
  echo "🚀 Success with SET B"
fi

echo "=== Step 4/4: Done — Supabase import confirmed ==="
