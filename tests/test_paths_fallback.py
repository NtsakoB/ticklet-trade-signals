import os
import importlib
from pathlib import Path

import pytest

def test_ensure_dirs_falls_back_to_tmp_on_permission_error(monkeypatch):
    # Force a Render-like environment so default fallback is /tmp/ticklet_data
    monkeypatch.setenv("RENDER", "1")

    # Import the module fresh to get clean globals
    import ticklet_ai.utils.paths as paths
    importlib.reload(paths)

    # Simulate PermissionError on initial mkdir attempts
    def deny(*args, **kwargs):
        raise PermissionError("denied by test")

    # Make the current DATA_DIR/LOGS_DIR/CACHE_DIR mkdir fail
    monkeypatch.setattr(paths.DATA_DIR, "mkdir", deny, raising=True)
    monkeypatch.setattr(paths.LOGS_DIR, "mkdir", deny, raising=True)
    monkeypatch.setattr(paths.CACHE_DIR, "mkdir", deny, raising=True)

    # Run the code under test
    paths.ensure_dirs()

    # After fallback, globals should point to /tmp/ticklet_data and be created
    assert str(paths.DATA_DIR) == "/tmp/ticklet_data"
    assert paths.DATA_DIR.exists(), "DATA_DIR should exist after fallback"
    assert paths.LOGS_DIR.exists(), "LOGS_DIR should exist after fallback"
    assert paths.CACHE_DIR.exists(), "CACHE_DIR should exist after fallback"

    # Sanity: they are under the DATA_DIR now
    assert paths.LOGS_DIR.parent == paths.DATA_DIR
    assert paths.CACHE_DIR.parent == paths.DATA_DIR