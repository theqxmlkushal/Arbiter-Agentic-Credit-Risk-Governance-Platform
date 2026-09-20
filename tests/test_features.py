"""Tests for the Feast feature store layer (Phase 2).

Covers:
- src/features/transformations.py — unit tests for each pure function + edge cases
- src/features/online_store.py — cache-hit test (mocked FeatureStore)
- src/features/feature_repo.py — import/dry-run validation
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.features.online_store import clear_cache, get_online_features
from src.features.transformations import (
    compute_credit_utilization,
    compute_debt_to_income,
    compute_employment_length_years,
    compute_loan_to_value,
    compute_num_delinquencies_24mo,
)

# ============================================================================
# transformations.py
# ============================================================================


class TestComputeDebtToIncome:
    def test_normal_case(self) -> None:
        assert compute_debt_to_income(1500, 5000) == pytest.approx(0.3)

    def test_zero_income_returns_none(self) -> None:
        assert compute_debt_to_income(1500, 0) is None

    def test_negative_income_returns_none(self) -> None:
        assert compute_debt_to_income(1500, -1000) is None

    def test_zero_debt(self) -> None:
        assert compute_debt_to_income(0, 5000) == pytest.approx(0.0)


class TestComputeCreditUtilization:
    def test_normal_case(self) -> None:
        assert compute_credit_utilization(3000, 10000) == pytest.approx(0.3)

    def test_zero_limit_returns_none(self) -> None:
        assert compute_credit_utilization(3000, 0) is None

    def test_negative_limit_returns_none(self) -> None:
        assert compute_credit_utilization(3000, -5000) is None

    def test_over_limit(self) -> None:
        assert compute_credit_utilization(12000, 10000) == pytest.approx(1.2)


class TestComputeNumDelinquencies24Mo:
    def test_normal(self) -> None:
        assert compute_num_delinquencies_24mo(3) == 3

    def test_zero(self) -> None:
        assert compute_num_delinquencies_24mo(0) == 0

    def test_negative_clamped_to_zero(self) -> None:
        assert compute_num_delinquencies_24mo(-5) == 0


class TestComputeEmploymentLengthYears:
    def test_normal(self) -> None:
        assert compute_employment_length_years(36) == pytest.approx(3.0)

    def test_zero(self) -> None:
        assert compute_employment_length_years(0) == pytest.approx(0.0)

    def test_negative_returns_none(self) -> None:
        assert compute_employment_length_years(-12) is None


class TestComputeLoanToValue:
    def test_normal(self) -> None:
        assert compute_loan_to_value(200_000, 250_000) == pytest.approx(0.8)

    def test_zero_collateral_returns_none(self) -> None:
        assert compute_loan_to_value(200_000, 0) is None

    def test_negative_collateral_returns_none(self) -> None:
        assert compute_loan_to_value(200_000, -100_000) is None


# ============================================================================
# online_store.py — cache test
# ============================================================================


class TestOnlineStoreCache:
    @pytest.mark.asyncio
    async def test_cache_hit_returns_cached_value_without_recalling_feast(
        self,
    ) -> None:
        """Second call within TTL should hit cache (call_count == 1)."""
        clear_cache()
        mock_store = MagicMock()
        mock_resp = MagicMock()
        mock_resp.to_dict.return_value = {"debt_to_income": 0.25}
        mock_store.get_online_features.return_value = mock_resp

        mock_feat_mod = MagicMock()
        mock_feat_mod.FeatureStore.return_value = mock_store

        with patch.dict("sys.modules", {"feast": mock_feat_mod}):
            r1 = await get_online_features("A001", ["credit_features:debt_to_income"], ttl_s=60)
            r2 = await get_online_features("A001", ["credit_features:debt_to_income"], ttl_s=60)

        assert r1 == {"debt_to_income": 0.25}
        assert r2 == {"debt_to_income": 0.25}
        # Feast should have been called only once
        assert mock_store.get_online_features.call_count == 1

        clear_cache()


# ============================================================================
# feature_repo.py — dry-run import
# ============================================================================


class TestFeatureRepoImport:
    def test_import_feature_repo_no_errors(self) -> None:
        """Importing the module should not raise."""
        feast = pytest.importorskip("feast")  # noqa: F841 — not installed in CI

        import src.features.feature_repo as fr  # noqa: F401

        assert fr.applicant.name == "applicant_id"
        assert fr.credit_features_view.name == "credit_features"
