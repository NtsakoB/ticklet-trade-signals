import sys, importlib.util
MAP = {
  "ticklet_ai.app.services.signal_filter": "ticklet_ai.services.signal_filter",
  "ticklet_ai.app.services.scanner": "ticklet_ai.services.scanner",
  "ticklet_ai.app.services.notifier": "ticklet_ai.services.notifier",
  "ticklet_ai.app.services.settings_store": "ticklet_ai.services.settings_store",
  "ticklet_ai.app.services.trading": "ticklet_ai.services.trading",
  "ticklet_ai.utils.signal_filter": "ticklet_ai.services.signal_filter",
}
class _Finder:
  def find_spec(self, fullname, path=None, target=None):
    if fullname in MAP: return importlib.util.find_spec(MAP[fullname])
    return None
# idempotent insert
if not any(type(f).__name__ == "_Finder" for f in sys.meta_path):
  sys.meta_path.insert(0, _Finder())