import importlib.metadata as md
import sys


def v(p):
    try:
        return md.version(p)
    except Exception:
        return "NOT_INSTALLED"


def ok_range(pkg, ver, lo=None, hi=None):
    if ver == "NOT_INSTALLED":
        return False
    try:
        parts = [int(x) for x in ver.split(".")[:2]]
        major, minor = parts[0], (parts[1] if len(parts) > 1 else 0)
    except Exception:
        return False
    if pkg == "postgrest":
        return major == 0 and 10 <= minor < 17
    return True


def main():
    print("=== Supabase Stack Verification ===")
    to_show = ["supabase", "storage3", "postgrest", "httpx", "httpcore", "gotrue"]
    for pkg in to_show:
        ver = v(pkg)
        mark = "✓"
        if pkg == "postgrest":
            mark = "✓" if ok_range(pkg, ver) else "⚠"
        print(f"{mark} {pkg}: {ver}")
    try:
        from supabase import create_client
        print("✓ create_client import: SUCCESS")
        sys.exit(0)
    except Exception as e:
        print(f"✗ create_client import FAILED: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
