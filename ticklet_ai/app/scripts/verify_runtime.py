import importlib
for p in ["fastapi","openai","supabase","pydantic","requests"]:
    importlib.import_module(p)
    print(f"✓ import {p}: OK")
print("✓ runtime imports verified")