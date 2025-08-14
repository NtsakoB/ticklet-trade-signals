import sys
from importlib.abc import MetaPathFinder
from importlib.util import find_spec

_MAP = {
    "ticklet_ai.utils.signal_filter": "ticklet_ai.services.signal_filter",
    "ticklet_ai.app.services.signal_filter": "ticklet_ai.services.signal_filter",
    "ticklet_ai.app.services.scanner": "ticklet_ai.services.scanner",
    "ticklet_ai.app.services.notifier": "ticklet_ai.services.notifier",
    "ticklet_ai.app.services.settings_store": "ticklet_ai.services.settings_store",
    "ticklet_ai.app.services.trading": "ticklet_ai.services.trading",
}

class _RedirectFinder(MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        if fullname in _MAP:
            return find_spec(_MAP[fullname])
        return None

def install():
    if not any(isinstance(f, _RedirectFinder) for f in sys.meta_path):
        sys.meta_path.insert(0, _RedirectFinder())