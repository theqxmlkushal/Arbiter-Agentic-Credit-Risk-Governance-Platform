"""Aggregates performance + fairness + calibration into one ValidationReport object passed to the agent."""

from __future__ import annotations

import logging

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ValidationReport(BaseModel):
    """Structured output from the validation engine.

    Attributes:
        performance:            Dict with ``"roc_auc"`` and ``"gini"``.
        fairness:               Dict with ``"demographic_parity_difference"``
                                and ``"equalized_odds_difference"``.
        calibration:            Expected Calibration Error (float).
        passed_hard_constraints: ``True`` when all hard thresholds are met.
    """

    performance: dict[str, float]
    fairness: dict[str, float]
    calibration: float
    passed_hard_constraints: bool


def build_validation_report(
    perf: dict[str, float],
    fairness: dict[str, float],
    ece: float,
    *,
    min_auc: float = 0.75,
    max_dpd: float = 0.1,
    max_ece: float = 0.05,
) -> ValidationReport:
    """Build a :class:`ValidationReport` and evaluate hard constraints.

    Hard constraints (any violation → ``passed_hard_constraints = False``):

    * ``roc_auc >= min_auc`` (default 0.75)
    * ``|demographic_parity_difference| <= max_dpd`` (default 0.10)
    * ``calibration (ECE) <= max_ece`` (default 0.05)

    Args:
        perf:      Output of :func:`compute_performance`.
        fairness:  Output of :func:`compute_fairness`.
        ece:       Output of :func:`expected_calibration_error`.
        min_auc:   Minimum acceptable ROC-AUC.
        max_dpd:   Maximum acceptable absolute demographic parity difference.
        max_ece:   Maximum acceptable ECE.

    Returns:
        A :class:`ValidationReport` with ``passed_hard_constraints`` set.
    """
    auc_ok = perf.get("roc_auc", 0.0) >= min_auc
    dpd_ok = abs(fairness.get("demographic_parity_difference", 1.0)) <= max_dpd
    ece_ok = ece <= max_ece

    passed = auc_ok and dpd_ok and ece_ok

    report = ValidationReport(
        performance=perf,
        fairness=fairness,
        calibration=ece,
        passed_hard_constraints=passed,
    )

    logger.info(
        "Validation report built — AUC=%s (%s), DPD=%s (%s), ECE=%s (%s) → passed=%s",
        perf.get("roc_auc"),
        "OK" if auc_ok else "FAIL",
        fairness.get("demographic_parity_difference"),
        "OK" if dpd_ok else "FAIL",
        ece,
        "OK" if ece_ok else "FAIL",
        passed,
    )
    return report
