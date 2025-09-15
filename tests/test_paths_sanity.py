"""
Sanity test for paths.ensure_dirs() - ensures no SyntaxError and proper directory creation.
"""
import importlib
from pathlib import Path
import pytest

def test_ensure_dirs_succeeds_and_paths_exist():
    # Import and reload to catch any syntax errors at import time
    import ticklet_ai.utils.paths as paths
    importlib.reload(paths)  # Fresh import ensures function compiles correctly

    # This call should not raise SyntaxError or any other exception
    paths.ensure_dirs()

    # Verify all paths are Path objects
    assert isinstance(paths.DATA_DIR, Path), f"DATA_DIR should be Path, got {type(paths.DATA_DIR)}"
    assert isinstance(paths.LOGS_DIR, Path), f"LOGS_DIR should be Path, got {type(paths.LOGS_DIR)}"
    assert isinstance(paths.CACHE_DIR, Path), f"CACHE_DIR should be Path, got {type(paths.CACHE_DIR)}"

    # Verify directories actually exist
    assert paths.DATA_DIR.exists(), f"DATA_DIR should exist: {paths.DATA_DIR}"
    assert paths.LOGS_DIR.exists(), f"LOGS_DIR should exist: {paths.LOGS_DIR}"
    assert paths.CACHE_DIR.exists(), f"CACHE_DIR should exist: {paths.CACHE_DIR}"

    # Verify correct directory structure
    assert paths.LOGS_DIR.parent == paths.DATA_DIR, "LOGS_DIR should be subdirectory of DATA_DIR"
    assert paths.CACHE_DIR.parent == paths.DATA_DIR, "CACHE_DIR should be subdirectory of DATA_DIR"

def test_syntax_error_detection():
    """Explicit test to catch SyntaxError during import/compilation."""
    try:
        import ticklet_ai.utils.paths as paths
        importlib.reload(paths)
        assert True  # If we get here, no SyntaxError occurred
    except SyntaxError as e:
        pytest.fail(f"SyntaxError in paths.py: {e}")

def test_ensure_dirs_idempotent():
    """Calling ensure_dirs() multiple times should not alter resolved directories or fail."""
    import ticklet_ai.utils.paths as paths
    paths.ensure_dirs()
    first = (paths.DATA_DIR, paths.LOGS_DIR, paths.CACHE_DIR)
    paths.ensure_dirs()
    second = (paths.DATA_DIR, paths.LOGS_DIR, paths.CACHE_DIR)
    assert first == second, "ensure_dirs() should be idempotent (same dirs after repeated calls)"