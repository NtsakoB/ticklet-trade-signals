import importlib, sys
for mod in [
    "ticklet_ai.services.notifier",
    "ticklet_ai.services.signal_filter",
    "ticklet_ai.services.scanner",
]:
    importlib.import_module(mod)
    print(f"✓ import {mod}")
sys.exit(0)