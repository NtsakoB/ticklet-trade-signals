# Install import redirector immediately on package import
try:
    from ticklet_ai._import_compat import install as _install_import_redirect
    _install_import_redirect()
except Exception:
    pass