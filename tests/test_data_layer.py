"""Tests for the Phase 1 data layer.

Covers:
- src/data/ingestion.py  — merge_sources deduplication
- src/data/validation.py — validate_schema, check_ranges
- src/data/quarantine.py — quarantine_rows writes a file + calls alert_on_quarantine
- src/data/versioning.py — snapshot_dataset returns a 64-char hex string
"""

from __future__ import annotations

import subprocess
from pathlib import Path
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from src.data.ingestion import merge_sources
from src.data.quarantine import alert_on_quarantine, quarantine_rows
from src.data.validation import ValidationResult, check_ranges, validate_schema
from src.data.versioning import snapshot_dataset

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture()
def base_frame() -> pd.DataFrame:
    """A minimal well-formed loan-application DataFrame."""
    return pd.DataFrame(
        {
            "applicant_id": ["A001", "A002", "A003"],
            "as_of_date": pd.to_datetime(["2024-01-01", "2024-01-01", "2024-01-02"]),
            "credit_score": [720, 640, 580],
            "annual_income": [75_000.0, 42_000.0, 31_000.0],
            "source": ["historical", "historical", "historical"],
        }
    )


@pytest.fixture()
def overlapping_frame() -> pd.DataFrame:
    """A second frame that overlaps A001/2024-01-01 from base_frame."""
    return pd.DataFrame(
        {
            "applicant_id": ["A001", "A004"],
            "as_of_date": pd.to_datetime(["2024-01-01", "2024-01-03"]),
            "credit_score": [725, 700],   # updated score for A001
            "annual_income": [80_000.0, 95_000.0],
            "source": ["live", "live"],
        }
    )


@pytest.fixture()
def schema_dict() -> dict[str, str]:
    return {
        "applicant_id": "object",
        "credit_score": "int64",
        "annual_income": "float64",
    }


@pytest.fixture()
def ranges_dict() -> dict[str, tuple[float, float]]:
    return {
        "credit_score": (300.0, 850.0),
        "annual_income": (0.0, 10_000_000.0),
    }


# ============================================================================
# ingestion.py — merge_sources
# ============================================================================


class TestMergeSources:
    """merge_sources must concatenate frames and deduplicate on (applicant_id, as_of_date)."""

    def test_deduplication_keeps_last_occurrence(
        self, base_frame: pd.DataFrame, overlapping_frame: pd.DataFrame
    ) -> None:
        """When two frames share the same (applicant_id, as_of_date), the last frame wins."""
        merged = merge_sources([base_frame, overlapping_frame])

        # Original: A001, A002, A003 + new: A001 (dup), A004 → 4 unique
        assert len(merged) == 4

        a001_row = merged[merged["applicant_id"] == "A001"]
        assert len(a001_row) == 1
        # The overlapping_frame (last) value should win
        assert int(a001_row["credit_score"].iloc[0]) == 725
        assert a001_row["source"].iloc[0] == "live"

    def test_non_overlapping_frames_all_rows_present(
        self, base_frame: pd.DataFrame
    ) -> None:
        """With no overlapping keys the result is simply the union."""
        extra = pd.DataFrame(
            {
                "applicant_id": ["A099"],
                "as_of_date": pd.to_datetime(["2024-06-01"]),
                "credit_score": [800],
                "annual_income": [120_000.0],
                "source": ["historical"],
            }
        )
        merged = merge_sources([base_frame, extra])
        assert len(merged) == len(base_frame) + 1

    def test_single_frame_unchanged(self, base_frame: pd.DataFrame) -> None:
        """A single-element list should be returned as-is (modulo index reset)."""
        merged = merge_sources([base_frame])
        assert len(merged) == len(base_frame)
        assert list(merged.columns) == list(base_frame.columns)

    def test_empty_list_raises(self) -> None:
        with pytest.raises(ValueError, match="empty list"):
            merge_sources([])

    def test_missing_dedup_key_raises(self) -> None:
        """A frame without 'applicant_id' should raise ValueError."""
        bad_frame = pd.DataFrame({"foo": [1, 2], "as_of_date": pd.to_datetime(["2024-01-01", "2024-01-02"])})
        with pytest.raises(ValueError, match="applicant_id"):
            merge_sources([bad_frame])

    def test_result_index_is_reset(
        self, base_frame: pd.DataFrame, overlapping_frame: pd.DataFrame
    ) -> None:
        """Output index should be 0-based and contiguous."""
        merged = merge_sources([base_frame, overlapping_frame])
        assert list(merged.index) == list(range(len(merged)))


# ============================================================================
# validation.py — validate_schema
# ============================================================================


class TestValidateSchema:
    """validate_schema returns ValidationResult with accurate failure messages."""

    def test_clean_frame_passes(
        self, base_frame: pd.DataFrame, schema_dict: dict[str, str]
    ) -> None:
        result = validate_schema(base_frame, schema_dict)
        assert isinstance(result, ValidationResult)
        assert result.is_valid is True
        assert result.failed_rules == []
        assert result.row_count == len(base_frame)

    def test_missing_column_detected(self, base_frame: pd.DataFrame) -> None:
        schema = {"applicant_id": "object", "nonexistent_col": "float64"}
        result = validate_schema(base_frame, schema)
        assert result.is_valid is False
        assert any("missing_column:nonexistent_col" in r for r in result.failed_rules)

    def test_dtype_mismatch_detected(self, base_frame: pd.DataFrame) -> None:
        # credit_score is int64 but we tell validate_schema it should be float64
        schema = {"credit_score": "float64"}
        result = validate_schema(base_frame, schema)
        assert result.is_valid is False
        assert any("dtype_mismatch:credit_score" in r for r in result.failed_rules)
        assert any("int64" in r for r in result.failed_rules)

    def test_multiple_failures_all_reported(self, base_frame: pd.DataFrame) -> None:
        schema = {
            "missing_col_one": "object",
            "missing_col_two": "int64",
            "credit_score": "object",  # wrong dtype
        }
        result = validate_schema(base_frame, schema)
        assert result.is_valid is False
        assert len(result.failed_rules) == 3

    def test_null_counts_populated(self) -> None:
        df = pd.DataFrame(
            {"applicant_id": ["A001", None], "credit_score": [700, 650]}
        )
        schema = {"applicant_id": "object", "credit_score": "int64"}
        result = validate_schema(df, schema)
        # A null doesn't automatically fail schema (dtype may still match)
        assert "applicant_id" in result.null_counts
        assert result.null_counts["applicant_id"] == 1


# ============================================================================
# validation.py — check_ranges
# ============================================================================


class TestCheckRanges:
    def test_all_in_range_returns_empty(
        self, base_frame: pd.DataFrame, ranges_dict: dict[str, tuple[float, float]]
    ) -> None:
        violations = check_ranges(base_frame, ranges_dict)
        assert violations == []

    def test_out_of_range_credit_score(self, base_frame: pd.DataFrame) -> None:
        df = base_frame.copy()
        df.loc[0, "credit_score"] = 200  # below minimum of 300
        violations = check_ranges(df, {"credit_score": (300.0, 850.0)})
        assert len(violations) == 1
        assert "out_of_range:credit_score" in violations[0]
        assert "1_rows" in violations[0]

    def test_multiple_violations_all_reported(self, base_frame: pd.DataFrame) -> None:
        df = base_frame.copy()
        df.loc[0, "credit_score"] = 200
        df.loc[1, "annual_income"] = -1.0
        violations = check_ranges(
            df,
            {"credit_score": (300.0, 850.0), "annual_income": (0.0, 10_000_000.0)},
        )
        assert len(violations) == 2

    def test_missing_column_reported_not_raised(self, base_frame: pd.DataFrame) -> None:
        violations = check_ranges(base_frame, {"nonexistent": (0.0, 1.0)})
        assert len(violations) == 1
        assert "range_column_missing:nonexistent" in violations[0]

    def test_boundary_values_are_inclusive(self, base_frame: pd.DataFrame) -> None:
        df = base_frame.copy()
        df["credit_score"] = 300  # exact lower bound
        violations = check_ranges(df, {"credit_score": (300.0, 850.0)})
        assert violations == []


# ============================================================================
# quarantine.py
# ============================================================================


class TestQuarantineRows:
    def test_writes_parquet_file(self, tmp_path: Path, base_frame: pd.DataFrame) -> None:
        with patch("src.data.quarantine.alert_on_quarantine"):
            dest = quarantine_rows(base_frame, reason="test_reason", quarantine_dir=tmp_path)

        assert dest.exists()
        assert dest.suffix == ".parquet"
        # Filename embeds the reason
        assert "test_reason" in dest.name

    def test_written_file_contains_metadata_columns(
        self, tmp_path: Path, base_frame: pd.DataFrame
    ) -> None:
        with patch("src.data.quarantine.alert_on_quarantine"):
            dest = quarantine_rows(base_frame, reason="schema_fail", quarantine_dir=tmp_path)

        recovered = pd.read_parquet(dest)
        assert "quarantine_reason" in recovered.columns
        assert "quarantined_at" in recovered.columns
        assert (recovered["quarantine_reason"] == "schema_fail").all()

    def test_written_file_has_correct_row_count(
        self, tmp_path: Path, base_frame: pd.DataFrame
    ) -> None:
        with patch("src.data.quarantine.alert_on_quarantine"):
            dest = quarantine_rows(base_frame, reason="out_of_range", quarantine_dir=tmp_path)

        recovered = pd.read_parquet(dest)
        # original rows preserved (metadata columns are additive)
        assert len(recovered) == len(base_frame)

    def test_alert_called_exactly_once(
        self, tmp_path: Path, base_frame: pd.DataFrame
    ) -> None:
        with patch("src.data.quarantine.alert_on_quarantine") as mock_alert:
            quarantine_rows(base_frame, reason="dtype_fail", quarantine_dir=tmp_path)

        mock_alert.assert_called_once()
        # Called with positional-or-keyword args: count, reason
        args, kwargs = mock_alert.call_args
        # Support both positional and keyword call styles
        count_val = args[0] if args else kwargs.get("count")
        reason_val = args[1] if len(args) > 1 else kwargs.get("reason")
        assert count_val == len(base_frame)
        assert reason_val == "dtype_fail"

    def test_empty_dataframe_raises(self, tmp_path: Path) -> None:
        empty = pd.DataFrame()
        with pytest.raises(ValueError, match="empty DataFrame"):
            quarantine_rows(empty, reason="bad", quarantine_dir=tmp_path)

    def test_creates_quarantine_dir_if_absent(
        self, tmp_path: Path, base_frame: pd.DataFrame
    ) -> None:
        new_dir = tmp_path / "deep" / "nested" / "quarantine"
        assert not new_dir.exists()
        with patch("src.data.quarantine.alert_on_quarantine"):
            quarantine_rows(base_frame, reason="r", quarantine_dir=new_dir)
        assert new_dir.exists()


class TestAlertOnQuarantine:
    def test_logs_warning(self, caplog: pytest.LogCaptureFixture) -> None:
        import logging

        with caplog.at_level(logging.WARNING, logger="src.data.quarantine"):
            alert_on_quarantine(count=5, reason="schema_fail")

        assert any("5" in msg for msg in caplog.messages)
        assert any("schema_fail" in msg for msg in caplog.messages)


# ============================================================================
# versioning.py — snapshot_dataset
# ============================================================================


class TestSnapshotDataset:
    def test_returns_64_char_hex_string(
        self, tmp_path: Path, base_frame: pd.DataFrame
    ) -> None:
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0)
            result = snapshot_dataset(base_frame, "test_snap", versioned_dir=tmp_path)

        assert isinstance(result, str)
        assert len(result) == 64
        # SHA-256 hex digest — only lowercase hex chars
        assert all(c in "0123456789abcdef" for c in result)

    def test_writes_parquet_file_to_versioned_dir(
        self, tmp_path: Path, base_frame: pd.DataFrame
    ) -> None:
        with patch("subprocess.run"):
            snapshot_dataset(base_frame, "my_dataset", versioned_dir=tmp_path)

        expected = tmp_path / "my_dataset.parquet"
        assert expected.exists()

    def test_calls_dvc_add(self, tmp_path: Path, base_frame: pd.DataFrame) -> None:
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0)
            snapshot_dataset(base_frame, "snap", versioned_dir=tmp_path)

        mock_run.assert_called_once()
        cmd_args = mock_run.call_args[0][0]  # first positional arg → list
        assert cmd_args[0] == "dvc"
        assert cmd_args[1] == "add"

    def test_dvc_failure_propagates(
        self, tmp_path: Path, base_frame: pd.DataFrame
    ) -> None:
        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = subprocess.CalledProcessError(
                returncode=1, cmd=["dvc", "add", "x"]
            )
            with pytest.raises(subprocess.CalledProcessError):
                snapshot_dataset(base_frame, "snap", versioned_dir=tmp_path)

    def test_empty_dataframe_raises(self, tmp_path: Path) -> None:
        empty = pd.DataFrame()
        with pytest.raises(ValueError, match="empty DataFrame"):
            snapshot_dataset(empty, "bad", versioned_dir=tmp_path)

    def test_hash_is_deterministic_for_same_data(
        self, tmp_path: Path, base_frame: pd.DataFrame
    ) -> None:
        """Same DataFrame written twice must produce identical digests."""
        dir_a = tmp_path / "a"
        dir_b = tmp_path / "b"
        with patch("subprocess.run"):
            h1 = snapshot_dataset(base_frame, "snap", versioned_dir=dir_a)
            h2 = snapshot_dataset(base_frame, "snap", versioned_dir=dir_b)
        assert h1 == h2
