import importlib, sys
MODULES = [
  "ticklet_ai.services.notifier",
  "ticklet_ai.services.signal_filter",
  "ticklet_ai.services.scanner",
  "ticklet_ai.services.settings_store",
  "ticklet_ai.services.trading",
  "apscheduler.schedulers.asyncio",
  "apscheduler.triggers.cron",
  "ticklet_ai.app.tasks.scheduler",
]
failed = []
for m in MODULES:
  try:
    importlib.import_module(m)
    print(f"✓ {m}")
  except Exception as e:
    print(f"✗ {m} – {e}")
    failed.append(m)
if failed: sys.exit(1)