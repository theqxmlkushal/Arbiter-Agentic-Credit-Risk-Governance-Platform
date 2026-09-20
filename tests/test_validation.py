"""Unit tests for src/validation/performance.py, fairness.py, calibration.py, and report.py (Phase 5)."""

from __future__ import annotations

import numpy as np
import pytest

from src.validation.calibration import expected_calibration_error
from src.validation.fairness import compute_fairness
from src.validation.performance import compute_performance, is_significant_improvement
from src.validation.report import ValidationReport, build_validation_report

SEED = 42


# ============================================================================
# performance.py
# ============================================================================


class TestComputePerformance:
    def test_perfectly_separable(self) -> None:
        y_true = np.array([0, 0, 0, 1, 1, 1])
        y_scores = np.array([0.1, 0.2, 0.3, 0.7, 0.8, 0.9])
        result = compute_performance(y_true, y_scores)
        assert result["roc_auc"] == pytest.approx(1.0)

    def test_random_predictions(self) -> None:
        rng = np.random.RandomState(SEED)
        y_true = rng.randint(0, 2, size=500)
        y_scores = rng.rand(500)
        result = compute_performance(y_true, y_scores)
        # AUC on random scores should be near 0.5
        assert result["roc_auc"] == pytest.approx(0.5, abs=0.08)
        assert result["gini"] == pytest.approx(2 * 0.5 - 1, abs=0.16)


class TestIsSignificantImprovement:
    def test_above_threshold(self) -> None:
        assert is_significant_improvement(0.80, 0.82, threshold=0.01) is True

    def test_below_threshold(self) -> None:
        assert is_significant_improvement(0.80, 0.805, threshold=0.01) is False

    def test_exact_threshold(self) -> None:
        assert is_significant_improvement(0.80, 0.81, threshold=0.01) is True


# ============================================================================
# fairness.py
# ============================================================================


class TestComputeFairness:
    def test_obvious_disparity(self) -> None:
        y_true = np.array([1, 1, 0, 0, 1, 1, 0, 0])
        y_pred = np.array([1, 1, 1, 1, 0, 0, 0, 0])  # biased against group 1
        sensitive = np.array([0, 0, 0, 0, 1, 1, 1, 1])
        result = compute_fairness(y_true, y_pred, sensitive)
        assert "demographic_parity_difference" in result
        assert "equalized_odds_difference" in result
        # The DPD should be nonzero — this is an engineered disparity
        assert abs(result["demographic_parity_difference"]) > 0.1

    def test_fair_predictions(self) -> None:
        # Perfect predictions → minimal DPD
        y_true = np.array([1, 0, 1, 0])
        y_pred = np.array([1, 0, 1, 0])
        sensitive = np.array([0, 0, 1, 1])
        result = compute_fairness(y_true, y_pred, sensitive)
        assert abs(result["demographic_parity_difference"]) == pytest.approx(0.0)


# ============================================================================
# calibration.py
# ============================================================================


class TestExpectedCalibrationError:
    def test_perfectly_calibrated(self) -> None:
        rng = np.random.RandomState(SEED)
        # Simulate perfect calibration: y_prob = true empirical rate
        y_true = rng.randint(0, 2, size=1000)
        y_prob = y_true.astype(float)  # probabilities exactly match outcomes
        ece = expected_calibration_error(y_true, y_prob, n_bins=10)
        assert ece == pytest.approx(0.0, abs=0.01)

    def test_badly_miscalibrated(self) -> None:
        # Always predict 0.9 but labels are random → high ECE
        y_true = np.array([0, 0, 0, 0, 1, 1, 1, 1, 0, 0])
        y_prob = np.full(10, 0.9)
        ece = expected_calibration_error(y_true, y_prob, n_bins=10)
        assert ece > 0.1  # should be clearly miscalibrated


# ============================================================================
# report.py
# ============================================================================


class TestBuildValidationReport:
    @pytest.mark.parametrize(
        "perf,fairness,ece,min_auc,max_dpd,max_ece,expected",
        [
            # Case 1: both pass
            (
                {"roc_auc": 0.85, "gini": 0.70},
                {"demographic_parity_difference": 0.05, "equalized_odds_difference": 0.03},
                0.03,
                0.75, 0.1, 0.05,
                True,
            ),
            # Case 2: perf fail (AUC too low)
            (
                {"roc_auc": 0.65, "gini": 0.30},
                {"demographic_parity_difference": 0.05, "equalized_odds_difference": 0.03},
                0.03,
                0.75, 0.1, 0.05,
                False,
            ),
            # Case 3: fairness fail (DPD too high)
            (
                {"roc_auc": 0.85, "gini": 0.70},
                {"demographic_parity_difference": 0.20, "equalized_odds_difference": 0.15},
                0.03,
                0.75, 0.1, 0.05,
                False,
            ),
            # Case 4: calibration fail
            (
                {"roc_auc": 0.85, "gini": 0.70},
                {"demographic_parity_difference": 0.05, "equalized_odds_difference": 0.03},
                0.10,
                0.75, 0.1, 0.05,
                False,
            ),
            # Case 5: boundary — AUC exactly at threshold
            (
                {"roc_auc": 0.75, "gini": 0.50},
                {"demographic_parity_difference": 0.0, "equalized_odds_difference": 0.0},
                0.0,
                0.75, 0.1, 0.05,
                True,
            ),
        ],
        ids=["both_pass", "perf_fail", "fairness_fail", "calibration_fail", "boundary_auc"],
    )
    def test_table_driven(
        self,
        perf: dict[str, float],
        fairness: dict[str, float],
        ece: float,
        min_auc: float,
        max_dpd: float,
        max_ece: float,
        expected: bool,
    ) -> None:
        report = build_validation_report(
            perf, fairness, ece,
            min_auc=min_auc, max_dpd=max_dpd, max_ece=max_ece,
        )
        assert isinstance(report, ValidationReport)
        assert report.passed_hard_constraints == expected
