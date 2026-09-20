"""Tests for the Drift & Health Engine (Phase 3).

Covers:
- src/drift/detector.py — detect_drift on shifted vs identical distributions
- src/drift/persistence.py — is_persistent_drift truth table
"""

from __future__ import annotations

import sys
from unittest.mock import MagicMock

import numpy as np
import pandas as pd

from src.drift.detector import DriftReport, detect_drift
from src.drift.persistence import is_persistent_drift

SEED = 42


def _make_reference(n: int = 500) -> pd.DataFrame:
    rng = np.random.RandomState(SEED)
    return pd.DataFrame(
        {
            "feature_a": rng.normal(loc=50, scale=10, size=n),
            "feature_b": rng.normal(loc=100, scale=20, size=n),
        }
    )


def _make_shifted(n: int = 500) -> pd.DataFrame:
    rng = np.random.RandomState(SEED + 1)
    return pd.DataFrame(
        {
            "feature_a": rng.normal(loc=200, scale=10, size=n),  # huge shift
            "feature_b": rng.normal(loc=100, scale=20, size=n),  # same distribution
        }
    )


def _install_evidently_mock(mock_report_instance: MagicMock) -> None:
    """Inject mock evidently modules into sys.modules so the lazy import inside detect_drift works."""
    mock_report_cls = MagicMock(return_value=mock_report_instance)
    mock_report_mod = MagicMock()
    mock_report_mod.Report = mock_report_cls

    mock_preset_mod = MagicMock()
    mock_preset_mod.DataDriftPreset = MagicMock()

    # evidently's top-level __init__ pulls in many submodules — mock the tree
    mock_evidently = MagicMock()
    mock_evidently.__path__ = []  # make it a package

    sys.modules.setdefault("evidently", mock_evidently)
    sys.modules["evidently.report"] = mock_report_mod
    sys.modules["evidently.metric_preset"] = mock_preset_mod


def _remove_evidently_mock() -> None:
    for key in list(sys.modules):
        if key == "evidently" or key.startswith("evidently."):
            del sys.modules[key]


# ============================================================================
# detector.py
# ============================================================================


class TestDetectDrift:
    def test_drift_detected_on_shifted_distribution(self) -> None:
        reference = _make_reference()
        current = _make_shifted()
        mock_report_instance = MagicMock()
        mock_report_instance.as_dict.return_value = {
            "metrics": [
                {
                    "result": {
                        "drift_by_columns": {
                            "feature_a": {"drift_detected": True},
                            "feature_b": {"drift_detected": False},
                        },
                        "dataset_drift": True,
                    }
                }
            ]
        }
        _install_evidently_mock(mock_report_instance)
        try:
            report = detect_drift(reference, current)
        finally:
            _remove_evidently_mock()
        assert isinstance(report, DriftReport)
        assert report.dataset_drift is True
        assert "feature_a" in report.drifted_features

    def test_no_drift_on_identical_distributions(self) -> None:
        reference = _make_reference()
        current = _make_reference()
        mock_report_instance = MagicMock()
        mock_report_instance.as_dict.return_value = {
            "metrics": [
                {
                    "result": {
                        "drift_by_columns": {
                            "feature_a": {"drift_detected": False},
                            "feature_b": {"drift_detected": False},
                        },
                        "dataset_drift": False,
                    }
                }
            ]
        }
        _install_evidently_mock(mock_report_instance)
        try:
            report = detect_drift(reference, current)
        finally:
            _remove_evidently_mock()
        assert report.dataset_drift is False
        assert report.drifted_features == []


# ============================================================================
# persistence.py
# ============================================================================


class TestIsPersistentDrift:
    def _report(self, drift: bool) -> DriftReport:
        return DriftReport(drifted_features=[], dataset_drift=drift)

    def test_three_consecutive_true(self) -> None:
        reports = [self._report(True), self._report(True), self._report(True)]
        assert is_persistent_drift(reports, min_consecutive=3) is True

    def test_two_true_one_false(self) -> None:
        reports = [self._report(True), self._report(False), self._report(True)]
        assert is_persistent_drift(reports, min_consecutive=3) is False

    def test_fewer_than_min_reports(self) -> None:
        reports = [self._report(True), self._report(True)]
        assert is_persistent_drift(reports, min_consecutive=3) is False

    def test_empty_list(self) -> None:
        assert is_persistent_drift([], min_consecutive=3) is False

    def test_all_false(self) -> None:
        reports = [self._report(False), self._report(False), self._report(False)]
        assert is_persistent_drift(reports, min_consecutive=3) is False
