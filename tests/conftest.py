"""Project-wide pytest configuration — fixtures and early warning suppression."""

from __future__ import annotations

import warnings

# ── Suppress import-time warnings from transitive dependencies ──────────────
# The LangChainPendingDeprecationWarning fires inside
# langchain_core.load.load.Reviver.__init__ when called with
# allowed_objects=None (the default).  This happens at module-import time
# when jsonplus.py instantiates ``LC_REVIVER = Reviver()`` — BEFORE pytest's
# own ``catch_warnings`` context is active during test collection, so normal
# ``filterwarnings`` config cannot intercept it.

_original_warn_deprecated = None


def _suppress_langchain_import_warning(*args, **kwargs):
    """Silence the ``allowed_objects`` PendingDeprecationWarning from langchain_core."""
    msg = kwargs.get("message", args[1] if len(args) > 1 else "")
    if isinstance(msg, str) and "allowed_objects" in msg:
        return  # swallow — we know about this pending deprecation
    return _original_warn_deprecated(*args, **kwargs)


try:
    import langchain_core._api.deprecation as _dep_mod

    _original_warn_deprecated = _dep_mod.warn_deprecated
    _dep_mod.warn_deprecated = _suppress_langchain_import_warning
except Exception:
    pass  # langchain_core not installed — nothing to patch


# ── Module-level filters (supplement for other third-party warnings) ────────
warnings.filterwarnings("ignore", category=UserWarning, message=".*httpx.*starlette.*")
warnings.filterwarnings("ignore", category=DeprecationWarning, message=".*no current event loop.*")
warnings.filterwarnings(
    "ignore", category=UserWarning, message="Field name .schema. in .* shadows an attribute"
)
# Pydantic V1-style @validator in mlflow.gateway.config
warnings.filterwarnings("ignore", category=DeprecationWarning, message=".*@validator.*deprecated.*")
warnings.filterwarnings(
    "ignore", category=DeprecationWarning, message=".*@root_validator.*deprecated.*"
)
warnings.filterwarnings(
    "ignore", category=DeprecationWarning, message=".*class-based.*config.*deprecated.*"
)
# mlflow model registry stages
warnings.filterwarnings(
    "ignore", category=FutureWarning, message=".*get_latest_versions.*deprecated.*"
)
# fairlearn groupby.apply
warnings.filterwarnings(
    "ignore", category=DeprecationWarning, message=".*DataFrameGroupBy\\.apply.*"
)
# supabase gotrue
warnings.filterwarnings("ignore", category=DeprecationWarning, message=".*gotrue.*deprecated.*")
# anyio BlockingPortal alias
warnings.filterwarnings(
    "ignore", category=DeprecationWarning, message=".*BlockingPortal.*deprecated.*"
)
