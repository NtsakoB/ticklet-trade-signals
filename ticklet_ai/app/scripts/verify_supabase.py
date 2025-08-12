import importlib, importlib.metadata as md, importlib.util


def v(pkg):
    try:
        return md.version(pkg)
    except Exception:
        return "NOT_INSTALLED"


def verify_supabase_installation():
    print("=== Supabase Stack Verification ===")
    pinned = {
        "httpx": "0.27.0",
        "httpcore": "1.0.9",
        "gotrue": "2.8.0",
        "storage3": "0.12.1",
        "supabase": "2.4.1",
    }
    for pkg, expected in pinned.items():
        actual = v(pkg)
        print(("✓" if actual == expected else "⚠"), f"{pkg}: {actual} (expected {expected})")

    # postgrest is auto-resolved; just report and sanity-check major/minor
    pr = v("postgrest")
    if pr != "NOT_INSTALLED":
        try:
            major, minor, *_ = [int(x) for x in pr.split('.')]
            compatible = (major == 0 and 10 <= minor < 17)
        except Exception:
            compatible = False
        print(("✓" if compatible else "⚠"), f"postgrest: {pr} (auto-resolved; <0.17 required)")
    else:
        print("✗ postgrest: NOT_INSTALLED")

    try:
        from supabase import create_client
        print("✓ create_client import: SUCCESS")
    except ImportError as e:
        print(f"✗ create_client import: FAILED - {e}")


if __name__ == "__main__":
    verify_supabase_installation()
