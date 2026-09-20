"""Tests for the Training & Model Registry (Phase 4).

Covers:
- dataset_builder.py — time-based split, check_leakage
- trainer.py — train_candidate with local MLflow tracking URI
- distributed_backend.py — no-crash when Ray is absent
- registry.py — transition_stage mock
"""

from __future__ import annotations

from datetime import datetime
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest

from src.training.dataset_builder import build_splits, check_leakage
from src.training.distributed_backend import enable_distributed_backend

# ============================================================================
# dataset_builder.py
# ============================================================================


class TestBuildSplits:
    def _df(self) -> pd.DataFrame:
        return pd.DataFrame(
            {
                "applicant_id": ["A001", "A002", "A003", "A004", "A005"],
                "as_of_date": pd.to_datetime(
                    ["2023-01-01", "2023-06-01", "2024-01-01", "2024-06-01", "2025-01-01"]
                ),
                "target": [0, 1, 0, 1, 0],
            }
        )

    def test_no_temporal_leakage(self) -> None:
        train, test = build_splits(self._df(), "target", datetime(2024, 1, 1))
        # All train rows must be strictly before cutoff
        assert (pd.to_datetime(train["as_of_date"]) < pd.Timestamp("2024-01-01")).all()
        # All test rows must be on/after cutoff
        assert (pd.to_datetime(test["as_of_date"]) >= pd.Timestamp("2024-01-01")).all()

    def test_sample_weight_column_exists_in_train(self) -> None:
        train, _ = build_splits(self._df(), "target", datetime(2024, 1, 1))
        assert "sample_weight" in train.columns
        assert train["sample_weight"].notna().all()

    def test_empty_dataframe_raises(self) -> None:
        with pytest.raises(ValueError, match="empty"):
            build_splits(pd.DataFrame(), "target", datetime(2024, 1, 1))

    def test_no_as_of_date_raises(self) -> None:
        with pytest.raises(ValueError, match="as_of_date"):
            build_splits(pd.DataFrame({"x": [1]}), "target", datetime(2024, 1, 1))


class TestCheckLeakage:
    def test_no_overlap_passes(self) -> None:
        train = pd.DataFrame({"id": ["A", "B"]})
        test = pd.DataFrame({"id": ["C", "D"]})
        assert check_leakage(train, test, "id") is True

    def test_overlap_raises(self) -> None:
        train = pd.DataFrame({"id": ["A", "B"]})
        test = pd.DataFrame({"id": ["B", "C"]})
        with pytest.raises(ValueError, match="Leakage"):
            check_leakage(train, test, "id")


# ============================================================================
# trainer.py
# ============================================================================


class TestTrainCandidate:
    def test_produces_mlflow_run(self, tmp_path: object) -> None:
        from unittest.mock import MagicMock
        from src.training.trainer import train_candidate

        rng = np.random.RandomState(42)
        X = rng.rand(100, 4)
        y = (X[:, 0] > 0.5).astype(int)

        mock_run = MagicMock()
        mock_run.info.run_id = "fake-run-id-12345"

        with patch("mlflow.set_tracking_uri"), \
             patch("mlflow.start_run", return_value=MagicMock(__enter__=MagicMock(return_value=mock_run), __exit__=MagicMock(return_value=False))), \
             patch("mlflow.log_params"), \
             patch("mlflow.log_metric"), \
             patch("mlflow.sklearn.log_model"):
            run_id = train_candidate(
                "logistic_regression",
                X,
                y,
                {"max_iter": 50, "random_state": 42},
                tracking_uri=f"file://{tmp_path}",
            )

        assert isinstance(run_id, str)
        assert run_id == "fake-run-id-12345"


# ============================================================================
# distributed_backend.py
# ============================================================================


class TestDistributedBackend:
    def test_does_not_crash_when_ray_absent(self) -> None:
        with patch.dict("sys.modules", {"ray": None, "ray.util": None, "ray.util.joblib": None}):
            # Should log a warning, not crash
            enable_distributed_backend(address="auto")


# ============================================================================
# registry.py
# ============================================================================


class TestRegistry:
    def test_transition_stage_calls_client(self) -> None:
        with patch("src.training.registry.MlflowClient") as mock_cls:
            from src.training.registry import transition_stage

            transition_stage("my_model", 1, "Staging")
            mock_cls.return_value.transition_model_version_stage.assert_called_once_with(
                name="my_model",
                version=1,
                stage="Staging",
            )
