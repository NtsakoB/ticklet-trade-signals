import importlib, importlib.metadata as md
from supabase import create_client
print("=== Verification ===")
for pkg in ["httpx","httpcore","gotrue","postgrest","storage3","supabase"]:
    try:
        print(f"{pkg}: {md.version(pkg)}")
    except Exception as e:
        print(f"{pkg}: NOT INSTALLED ({e)})")
print("create_client exists:", hasattr(importlib.import_module("supabase"), "create_client"))
