#!/usr/bin/env bash
set -euo pipefail

echo "=== Ticklet Installer: rotating SET A → SET B ==="
echo "Python: $(python --version)"
echo "Pip:    $(pip --version)"

# Always use fresh resolver
python -m pip install --upgrade pip

echo "=== Step 1/3: Install base deps (no supabase/httpx/gotrue/httpcore) ==="
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

# Valid version sets only:
# A) Stable (no httpcore 1.x)
SET_A="httpx==0.24.1 httpcore==0.17.3 gotrue==2.6.0 supabase==2.3.3"
# B) Newer (httpx 0.25.x REQUIRES httpcore 1.x)
SET_B="httpx==0.25.2 httpcore==1.0.4 gotrue==2.8.0 supabase==2.3.3"

install_stack () {
  local combo="$1"
  echo "=== Step 2/3: Attempt $combo ==="
  python -m pip uninstall -y httpx httpcore gotrue supabase >/dev/null 2>&1 || true
  python -m pip install --no-cache-dir $combo
}

if install_stack "$SET_A"; then
  echo "🚀 Success with SET A"
else
  echo "↩️  SET A failed — trying SET B"
  install_stack "$SET_B"
  echo "🚀 Success with SET B"
fi

echo "=== Step 3/3: Print resolved versions ==="
python - <<'PY'
import importlib.util, importlib.metadata as md
pkgs = ["httpx","httpcore","supabase","gotrue","fastapi","uvicorn"]
out = {}
for p in pkgs:
    out[p] = md.version(p) if importlib.util.find_spec(p) else "NOT_INSTALLED"
print("::resolved_versions", out)
PY
