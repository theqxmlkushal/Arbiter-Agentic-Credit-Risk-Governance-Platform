"""Loads deterministic YAML policy rules and evaluates a ValidationReport against them — the non-negotiable rule layer the agent cannot reason its way around."""

from __future__ import annotations

import logging
from typing import Literal

import yaml

from src.validation.report import ValidationReport

logger = logging.getLogger(__name__)


def load_policy(path: str) -> dict:
    """Load a YAML governance policy file.

    Args:
        path: Filesystem path to the YAML policy.

    Returns:
        Parsed policy dict.
    """
    with open(path) as f:
        policy = yaml.safe_load(f)
    logger.info("Loaded policy from %s: %s", path, list(policy.keys()))
    return policy


def evaluate_policy(
    report: ValidationReport,
    policy: dict,
) -> Literal["pass", "fail", "review"]:
    """Evaluate a :class:`ValidationReport` against a governance policy.

    Decision logic (in priority order):

    1. **fail** — any hard-constraint violation:
       * ``roc_auc < min_auc``
       * ``sample size < min_sample_size`` (if present in policy)
    2. **review** — borderline violations (over threshold but not egregious):
       * ``|dpd| > max_dpd`` and ``|dpd| <= 2 * max_dpd``
       * ``ece > max_ece`` and ``ece <= 2 * max_ece``
    3. **pass** — all constraints satisfied.

    Boundary policy: values **at** the threshold are considered passing
    (e.g. ``roc_auc == 0.75`` passes when ``min_auc == 0.75``).

    Args:
        report: Output of :func:`build_validation_report`.
        policy: Parsed policy dict from :func:`load_policy`.

    Returns:
        ``"pass"``, ``"fail"``, or ``"review"``.
    """
    min_auc = policy.get("min_auc", 0.75)
    max_dpd = policy.get("max_dpd", 0.1)
    max_ece = policy.get("max_ece", 0.05)

    auc = report.performance.get("roc_auc", 0.0)
    dpd = abs(report.fairness.get("demographic_parity_difference", 0.0))
    ece = report.calibration

    # --- Hard fail: AUC below minimum ---
    if auc < min_auc:
        logger.warning("Policy FAIL: roc_auc=%.4f < min_auc=%.4f", auc, min_auc)
        return "fail"

    # --- Hard fail: sample size (if defined) ---
    min_sample = policy.get("min_sample_size")
    if min_sample is not None:
        # The report doesn't carry sample size directly; check row_count if available
        row_count = report.performance.get("row_count", float("inf"))
        if row_count < min_sample:
            logger.warning("Policy FAIL: sample_size=%d < min_sample_size=%d", row_count, min_sample)
            return "fail"

    # --- Review: borderline fairness ---
    if dpd > max_dpd:
        if dpd <= 2 * max_dpd:
            logger.info(
                "Policy REVIEW: dpd=%.4f is borderline (max=%.4f, 2x=%.4f)",
                dpd, max_dpd, 2 * max_dpd,
            )
            return "review"
        logger.warning("Policy FAIL: dpd=%.4f is egregiously above threshold", dpd)
        return "fail"

    # --- Review: borderline calibration ---
    if ece > max_ece:
        if ece <= 2 * max_ece:
            logger.info(
                "Policy REVIEW: ece=%.4f is borderline (max=%.4f, 2x=%.4f)",
                ece, max_ece, 2 * max_ece,
            )
            return "review"
        logger.warning("Policy FAIL: ece=%.4f is egregiously above threshold", ece)
        return "fail"

    logger.info("Policy PASS — all constraints satisfied.")
    return "pass"
