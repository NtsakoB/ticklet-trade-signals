import importlib, sys

REQUIRED = [
    "ticklet_ai.services.notifier",
    "ticklet_ai.services.signal_filter",
    "ticklet_ai.services.scanner",
    "ticklet_ai.services.settings_store",
    "ticklet_ai.services.trading",
    "apscheduler.schedulers.asyncio",
    "apscheduler.triggers.cron",
]

failed = []
for mod in REQUIRED:
    try:
        importlib.import_module(mod)
        print(f"✓ import {mod}")
    except Exception as e:
        print(f"✗ import {mod} -> {e}")
        failed.append((mod, str(e)))

if failed:
    print("\nImport verification failed:")
    for mod, err in failed:
        print(f" - {mod}: {err}")
    sys.exit(1)