from pathlib import Path
import importlib

def test_ensure_dirs_succeeds_and_paths_exist():
    import ticklet_ai.utils.paths as paths
    importlib.reload(paths)  # fresh import to ensure function compiles
    # Call ensure_dirs() — should not raise and should create dirs
    paths.ensure_dirs()
    assert isinstance(paths.DATA_DIR, Path)
    assert isinstance(paths.LOGS_DIR, Path)
    assert isinstance(paths.CACHE_DIR, Path)
    assert paths.DATA_DIR.exists()
    assert paths.LOGS_DIR.exists()
    assert paths.CACHE_DIR.exists()