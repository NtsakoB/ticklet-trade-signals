# Auto-redirect imports between services <-> app.services (and utils -> services)
import importlib, sys
PREFERRED = {
  # prefer canonical services
  "ticklet_ai.app.services": "ticklet_ai.services",
  "ticklet_ai.utils": "ticklet_ai.services",
}
class _Redirector(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        # Only redirect known prefixes
        for wrong_prefix, right_prefix in PREFERRED.items():
            if fullname == wrong_prefix or fullname.startswith(wrong_prefix + "."):
                alt = right_prefix + fullname[len(wrong_prefix):]
                try:
                    spec = importlib.util.find_spec(alt)
                    if spec is None:
                        return None
                    # Load alt and alias it under the requested fullname
                    mod = importlib.import_module(alt)
                    sys.modules[fullname] = mod
                    return importlib.util.find_spec(fullname)
                except Exception:
                    return None
        return None
def install():
    # idempotent
    if not any(isinstance(f, _Redirector) for f in sys.meta_path):
        sys.meta_path.insert(0, _Redirector())