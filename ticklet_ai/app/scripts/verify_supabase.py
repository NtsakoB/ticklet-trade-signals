import importlib.metadata as md, sys
def v(p):
    try: return md.version(p)
    except Exception: return "NOT_INSTALLED"
def ok_postgrest(ver):
    if ver=="NOT_INSTALLED": return False
    try:
        M,m = [int(x) for x in ver.split(".")[:2]]
        return M==0 and 10 <= m < 17
    except: return False
print("=== Supabase Stack Verification ===")
for pkg in ["supabase","storage3","gotrue","postgrest","httpx","httpcore"]:
    ver = v(pkg); mark = "✓"
    if pkg=="postgrest": mark = "✓" if ok_postgrest(ver) else "⚠"
    print(f"{mark} {pkg}: {ver}")
try:
    from supabase import create_client
    print("✓ create_client import: SUCCESS"); sys.exit(0)
except Exception as e:
    print(f"✗ create_client FAILED: {e}"); sys.exit(1)
