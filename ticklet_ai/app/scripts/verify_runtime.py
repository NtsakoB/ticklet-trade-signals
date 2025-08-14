import sys, importlib
pkgs = ["fastapi","openai","supabase","pydantic","requests"]
bad = []
for p in pkgs:
    try:
        m = importlib.import_module(p)
        print(f"✓ import {p}: OK ({getattr(m,'__version__', 'n/a')})")
    except Exception as e:
        print(f"✗ import {p}: {e}"); bad.append(p)
if bad:
    sys.exit(1)
print("✓ runtime imports verified")