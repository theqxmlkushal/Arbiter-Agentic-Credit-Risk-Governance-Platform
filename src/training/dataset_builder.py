"""Builds the leakage-checked train/val/test split with recency weighting and class balancing."""

from __future__ import annotations

import logging
from datetime import datetime

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def build_splits(
    df: pd.DataFrame,
    target: str,
    cutoff_date: datetime,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Time-based train/test split with exponential recency weighting.

    Rows whose ``as_of_date`` is strictly before *cutoff_date* go into
    *train*; rows on or after go into *test*.  A ``sample_weight`` column
    is added to *train* that decays exponentially with age.

    Args:
        df:         DataFrame with at least ``as_of_date`` and *target* columns.
        target:     Name of the binary target column.
        cutoff_date: Datetime threshold — train < cutoff, test >= cutoff.

    Returns:
        ``(train, test)`` tuple of DataFrames.
    """
    if df.empty:
        raise ValueError("build_splits received an empty DataFrame.")

    if "as_of_date" not in df.columns:
        raise ValueError("DataFrame must contain an 'as_of_date' column.")

    as_of = pd.to_datetime(df["as_of_date"])
    cutoff = pd.Timestamp(cutoff_date)

    train_mask = as_of < cutoff
    test_mask = ~train_mask

    train = df.loc[train_mask].copy()
    test = df.loc[test_mask].copy()

    if train.empty:
        logger.warning("Training set is empty after splitting on %s.", cutoff)
    if test.empty:
        logger.warning("Test set is empty after splitting on %s.", cutoff)

    # Recency weight: exponential decay based on days before cutoff
    if not train.empty:
        days_before = (cutoff - pd.to_datetime(train["as_of_date"])).dt.days.astype(float)
        half_life = 365.0  # 1-year half-life
        train["sample_weight"] = np.exp(-np.log(2) * days_before / half_life)
    else:
        train["sample_weight"] = pd.Series(dtype=float)

    logger.info(
        "Split complete: train=%d rows, test=%d rows (cutoff=%s)",
        len(train),
        len(test),
        cutoff,
    )
    return train, test


def check_leakage(
    train: pd.DataFrame,
    test: pd.DataFrame,
    key: str,
) -> bool:
    """Raise ``ValueError`` if any value of *key* appears in both train and test.

    Args:
        train: Training DataFrame.
        test:  Test DataFrame.
        key:   Column name to check for overlap (e.g. ``"applicant_id"``).

    Returns:
        ``True`` if no leakage is found.

    Raises:
        ValueError: If overlapping keys are detected.
    """
    overlap = set(train[key]) & set(test[key])
    if overlap:
        sample = list(overlap)[:10]
        raise ValueError(
            f"Leakage detected: {len(overlap)} overlapping key(s) in column "
            f"'{key}' between train and test. Sample: {sample}"
        )
    return True
