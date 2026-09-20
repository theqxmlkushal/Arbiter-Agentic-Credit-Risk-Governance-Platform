"""Schema, null, type, and range enforcement — the gate between raw and quarantined/versioned data."""

import logging

import pandas as pd
from pydantic import BaseModel

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result model
# ---------------------------------------------------------------------------


class ValidationResult(BaseModel):
    """Structured outcome of a validation run.

    Attributes:
        is_valid: ``True`` only when *every* rule passed.
        failed_rules: Human-readable descriptions of every broken rule,
                      e.g. ``["missing_column:annual_income",
                               "dtype_mismatch:credit_score:expected int64 got float64"]``.
        row_count: Number of rows in the validated DataFrame (for observability).
        null_counts: Column-level null counts for columns that had nulls detected.
    """

    is_valid: bool
    failed_rules: list[str]
    row_count: int = 0
    null_counts: dict[str, int] = {}


# ---------------------------------------------------------------------------
# Schema validation
# ---------------------------------------------------------------------------


def validate_schema(df: pd.DataFrame, schema: dict[str, str]) -> ValidationResult:
    """Validate that *df* conforms to the column names and dtypes declared in *schema*.

    Rules checked (in order):
    1. Every key in *schema* must exist as a column in *df*.
    2. Each column's ``dtype`` string must match the expected value exactly
       (e.g. ``"int64"``, ``"float64"``, ``"object"``).
    3. Null counts are collected for informational logging (not a hard failure).

    Args:
        df:     The DataFrame to validate.
        schema: Mapping of ``column_name -> expected_pandas_dtype_string``.
                Example: ``{"applicant_id": "object", "credit_score": "int64"}``.

    Returns:
        A :class:`ValidationResult` summarising which rules passed or failed.
    """
    failed: list[str] = []
    null_counts: dict[str, int] = {}

    for col, expected_dtype in schema.items():
        if col not in df.columns:
            rule = f"missing_column:{col}"
            failed.append(rule)
            logger.debug("Schema rule FAILED — %s", rule)
            continue  # can't check dtype of a missing column

        actual_dtype = str(df[col].dtype)
        if actual_dtype != expected_dtype:
            rule = f"dtype_mismatch:{col}:expected {expected_dtype} got {actual_dtype}"
            failed.append(rule)
            logger.debug("Schema rule FAILED — %s", rule)

        # collect nulls even for passing columns (observability)
        null_n = int(df[col].isna().sum())
        if null_n:
            null_counts[col] = null_n
            logger.warning("Column '%s' has %d null value(s).", col, null_n)

    is_valid = len(failed) == 0
    result = ValidationResult(
        is_valid=is_valid,
        failed_rules=failed,
        row_count=len(df),
        null_counts=null_counts,
    )

    if is_valid:
        logger.info("Schema validation PASSED for %d rows across %d columns.", len(df), len(schema))
    else:
        logger.warning(
            "Schema validation FAILED — %d rule(s) broken: %s", len(failed), failed
        )

    return result


# ---------------------------------------------------------------------------
# Range validation
# ---------------------------------------------------------------------------


def check_ranges(df: pd.DataFrame, ranges: dict[str, tuple[float, float]]) -> list[str]:
    """Check that numeric columns fall within declared inclusive [min, max] bounds.

    Rows that contain values outside the specified ranges are reported as
    violations.  The function does **not** modify the DataFrame; callers
    should pass failing rows to :func:`src.data.quarantine.quarantine_rows`.

    Args:
        df:     The DataFrame to inspect.
        ranges: Mapping of ``column_name -> (min_value, max_value)`` (both
                bounds inclusive).  Columns absent from *df* are reported as
                a separate violation rather than raising an exception.

    Returns:
        A (possibly empty) list of violation strings.
        Each entry takes one of the forms:
        - ``"range_column_missing:<col>"`` — column declared in *ranges* not
          found in *df*.
        - ``"out_of_range:<col>:<n>_rows:[min,max]"`` — *n* rows violated the
          bound ``[min, max]``.
    """
    violations: list[str] = []

    for col, (lo, hi) in ranges.items():
        if col not in df.columns:
            msg = f"range_column_missing:{col}"
            violations.append(msg)
            logger.warning("Range check skipped — %s", msg)
            continue

        out_of_range_mask = (df[col] < lo) | (df[col] > hi)
        n_bad = int(out_of_range_mask.sum())
        if n_bad:
            msg = f"out_of_range:{col}:{n_bad}_rows:[{lo},{hi}]"
            violations.append(msg)
            logger.warning(
                "Range check FAILED — column '%s': %d row(s) outside [%s, %s].",
                col,
                n_bad,
                lo,
                hi,
            )

    if not violations:
        logger.info("Range checks PASSED for columns: %s", list(ranges.keys()))

    return violations
