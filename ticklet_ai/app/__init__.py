# app package + import redirect installation
try:
    from ticklet_ai import _import_compat
    _import_compat.install()
except Exception:
    pass