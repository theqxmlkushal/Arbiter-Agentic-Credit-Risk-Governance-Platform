"""Feature transformation functions applied before writing to the offline store.

Every function is pure (no side effects), fully typed, and handles edge cases
such as division by zero by returning ``None``.
"""

from __future__ import annotations


def compute_debt_to_income(monthly_debt: float, monthly_income: float) -> float | None:
    """Ratio of total monthly debt payments to gross monthly income.

    Returns ``None`` when *monthly_income* is zero or negative to avoid
    division by zero — the caller should treat ``None`` as a missing feature.
    """
    if monthly_income <= 0:
        return None
    return monthly_debt / monthly_income


def compute_credit_utilization(credit_used: float, credit_limit: float) -> float | None:
    """Fraction of available revolving credit currently used (0.0–1.0+).

    Returns ``None`` when *credit_limit* is zero or negative.
    """
    if credit_limit <= 0:
        return None
    return credit_used / credit_limit


def compute_num_delinquencies_24mo(delinq_count: int) -> int:
    """Pass-through with a floor of 0 — negative counts are clamped."""
    return max(delinq_count, 0)


def compute_employment_length_years(months_employed: int) -> float | None:
    """Convert months of employment to years, returning ``None`` for negative input."""
    if months_employed < 0:
        return None
    return months_employed / 12.0


def compute_loan_to_value(loan_amount: float, collateral_value: float) -> float | None:
    """Loan-to-value ratio.  Returns ``None`` when collateral is non-positive."""
    if collateral_value <= 0:
        return None
    return loan_amount / collateral_value
