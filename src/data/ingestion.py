"""Pulls raw records from multiple sources (historical CSV/DB dump, live loan applications, label feed)
into a single normalized DataFrame.
"""

import logging
from datetime import datetime
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Individual loaders
# ---------------------------------------------------------------------------


def load_historical(path: str) -> pd.DataFrame:
    """Load a historical dataset from a Parquet file and tag every row with its source.

    Args:
        path: Absolute or relative path to the Parquet file (or directory of
              Parquet part-files, supported natively by ``pd.read_parquet``).

    Returns:
        A DataFrame with an additional ``source`` column set to ``"historical"``.

    Raises:
        FileNotFoundError: If *path* does not exist on the local filesystem.
        ValueError: If the resulting DataFrame is empty after loading.
    """
    resolved = Path(path).resolve()
    if not resolved.exists():
        raise FileNotFoundError(f"Historical data path not found: {resolved}")

    logger.info("Loading historical dataset from %s", resolved)
    df = pd.read_parquet(resolved)

    if df.empty:
        raise ValueError(f"Historical dataset at {resolved} loaded 0 rows — check the source file.")

    df["source"] = "historical"
    logger.info("Loaded %d rows from historical source %s", len(df), resolved)
    return df


def load_live_batch(since: datetime) -> pd.DataFrame:
    """Load live loan-application records received after *since*.

    In production this would query a database or streaming sink (e.g. Kafka
    offset, Supabase Realtime, or a REST endpoint).  The current implementation
    is a **stub** that raises ``NotImplementedError`` so the caller knows it must
    be wired up before use.

    Args:
        since: Inclusive lower bound on the ``received_at`` timestamp column.

    Returns:
        A DataFrame with an additional ``source`` column set to ``"live"``.

    Raises:
        NotImplementedError: Until the live data source is connected.
    """
    # TODO(phase-2): replace with real database / Kafka / REST query.
    logger.warning(
        "load_live_batch called with since=%s but live source is not yet wired up.", since
    )
    raise NotImplementedError("load_live_batch is a stub — connect a real data source in Phase 2.")


# ---------------------------------------------------------------------------
# Merge / deduplication
# ---------------------------------------------------------------------------


def merge_sources(frames: list[pd.DataFrame]) -> pd.DataFrame:
    """Concatenate multiple source DataFrames and deduplicate on (applicant_id, as_of_date).

    Deduplication keeps the **last** occurrence of each ``(applicant_id,
    as_of_date)`` pair, under the assumption that later frames contain more
    up-to-date label information (e.g. a label feed arriving after the
    historical snapshot).

    Args:
        frames: One or more DataFrames produced by the individual loaders.
                All must share the same schema (columns and dtypes).

    Returns:
        A single, deduplicated DataFrame with a reset integer index.

    Raises:
        ValueError: If *frames* is empty, or if neither ``applicant_id`` nor
                    ``as_of_date`` is present in the concatenated columns.
    """
    if not frames:
        raise ValueError("merge_sources received an empty list of DataFrames — nothing to merge.")

    logger.info("Merging %d source frames …", len(frames))
    merged = pd.concat(frames, ignore_index=True)

    _dedup_keys = ["applicant_id", "as_of_date"]
    missing_keys = [k for k in _dedup_keys if k not in merged.columns]
    if missing_keys:
        raise ValueError(
            f"Cannot deduplicate: column(s) {missing_keys} not found in merged DataFrame. "
            f"Available columns: {merged.columns.tolist()}"
        )

    before = len(merged)
    # keep='last' preserves the most-recently-appended frame's row on conflict
    merged = merged.drop_duplicates(subset=_dedup_keys, keep="last").reset_index(drop=True)
    after = len(merged)

    dropped = before - after
    if dropped:
        logger.info(
            "Deduplication removed %d duplicate row(s) on %s; %d rows remain.",
            dropped,
            _dedup_keys,
            after,
        )
    else:
        logger.info("No duplicate rows found; %d rows in merged frame.", after)

    return merged
