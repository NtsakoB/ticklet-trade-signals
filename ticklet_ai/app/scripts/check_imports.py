import importlib, sys
mods = [
  "ticklet_ai.services.notifier",
  "ticklet_ai.services.signal_filter",
  "ticklet_ai.services.scanner",
  "ticklet_ai.services.settings_store",
  "ticklet_ai.services.trading",
]
for m in mods:
    importlib.import_module(m)
    print(f"✓ import {m}")