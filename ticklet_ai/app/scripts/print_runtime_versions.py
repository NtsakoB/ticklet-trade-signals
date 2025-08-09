import importlib, importlib.metadata as md
pkgs = ["httpx","httpcore","supabase","gotrue","fastapi","uvicorn"]
print("::runtime_versions", {p: (md.version(p) if importlib.util.find_spec(p) else "missing") for p in pkgs})