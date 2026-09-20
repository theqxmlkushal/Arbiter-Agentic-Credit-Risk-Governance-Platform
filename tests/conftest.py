"""Project-wide pytest configuration — fixtures and early warning suppression."""

from __future__ import annotations

import warnings


def pytest_configure(config):
    """Suppress third-party deprecation warnings that fire at import time."""
    warnings.filterwarnings(
        "ignore",
        message=".*allowed_objects.*",
        category=Warning,
    )
