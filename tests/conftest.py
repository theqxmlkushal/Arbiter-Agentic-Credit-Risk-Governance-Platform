"""Project-wide pytest configuration — fixtures and early warning suppression."""

from __future__ import annotations

import warnings

# Suppress third-party warnings that fire at import time before pytest's
# own warning plugin sets up its catch_warnings context.  These are harmless
# deprecation notices from transitive dependencies we don't control.
warnings.filterwarnings("ignore", category=Warning, message=".*allowed_objects.*")
warnings.filterwarnings("ignore", category=UserWarning, message=".*httpx.*starlette.*")
warnings.filterwarnings("ignore", category=DeprecationWarning, message=".*no current event loop.*")
warnings.filterwarnings(
    "ignore", category=UserWarning, message="Field name .schema. in .* shadows an attribute"
)
