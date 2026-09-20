"""Routes failed rows to a quarantine table/bucket instead of dropping them silently, and raises an alert."""

import logging
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

# Default location for quarantine files.  Override via config if needed.
_QUARANTINE_DIR = Path("quarantine")


# ---------------------------------------------------------------------------
# Quarantine writer
# ---------------------------------------------------------------------------


def quarantine_rows(
    df: pd.DataFrame,
    reason: str,
    *,
    quarantine_dir: Path | None = None,
) -> Path:
    """Persist *df* to a timestamped Parquet file in the quarantine folder.

    The written file path follows the pattern::

        quarantine/<reason>_<YYYY-MM-DD_HHMMSS_ffffff>.parquet

    Two metadata columns are added to every quarantined record before writing:

    * ``quarantine_reason`` — the *reason* string passed by the caller.
    * ``quarantined_at``    — a UTC timestamp (``pd.Timestamp``).

    After writing, :func:`alert_on_quarantine` is called automatically.

    Args:
        df:             Rows that failed validation (must not be empty).
        reason:         Short machine-readable label, e.g. ``"schema_fail"``
                        or ``"out_of_range"``.
        quarantine_dir: Override the default ``quarantine/`` directory.
                        Useful for tests pointing to a ``tmp_path``.

    Returns:
        The :class:`~pathlib.Path` of the written Parquet file.

    Raises:
        ValueError: If *df* is empty — quarantining zero rows is a caller bug.
    """
    if df.empty:
        raise ValueError(
            "quarantine_rows received an empty DataFrame — there are no rows to quarantine."
        )

    target_dir = (quarantine_dir or _QUARANTINE_DIR).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)

    now = pd.Timestamp.utcnow()
    timestamp_str = now.strftime("%Y-%m-%d_%H%M%S_%f")
    filename = f"{reason}_{timestamp_str}.parquet"
    dest = target_dir / filename

    # Annotate before persisting so metadata is baked into the file.
    annotated = df.copy()
    annotated["quarantine_reason"] = reason
    annotated["quarantined_at"] = now

    annotated.to_parquet(dest, index=False)
    logger.info("Quarantined %d row(s) [reason=%r] → %s", len(df), reason, dest)

    alert_on_quarantine(count=len(df), reason=reason)
    return dest


# ---------------------------------------------------------------------------
# Alert dispatcher
# ---------------------------------------------------------------------------


def alert_on_quarantine(count: int, reason: str) -> None:
    """Emit a structured warning when rows are quarantined.

    Currently logs at WARNING level.  Future integrations should be added
    here without changing the call-site in :func:`quarantine_rows`.

    Args:
        count:  Number of rows that were quarantined.
        reason: The quarantine reason label.

    TODO:
        - Integrate with Slack webhook (post to ``#mlops-alerts`` channel).
        - Increment a Prometheus counter::

              quarantine_rows_total.labels(reason=reason).inc(count)

        - Raise a Prefect flow run notification if ``count`` exceeds a
          configurable threshold.
    """
    logger.warning(
        "QUARANTINE ALERT — %d row(s) quarantined [reason=%r]. "
        "Downstream pipeline steps will not see these rows.",
        count,
        reason,
    )
    # TODO: Slack integration
    # slack_client.chat_postMessage(channel="#mlops-alerts", text=f"...")
    # TODO: Prometheus counter
    # QUARANTINE_COUNTER.labels(reason=reason).inc(count)
