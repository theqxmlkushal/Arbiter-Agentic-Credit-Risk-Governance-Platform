"""Feast feature view + entity definitions — the single source of truth for what a 'feature' means across training and serving.

Running ``feast apply`` and ``feast materialize`` against this repo:
--------------------------------------------------------------------
1. ``feast apply`` registers the Entity, FeatureView, and FileSource with the
   Feast metadata store (``feature_store.yaml`` lives in this directory).
2. ``feast materialize`` (or ``feast materialize-incremental <timestamp>``)
   reads from the offline ``FileSource`` Parquet and pushes feature values into
   the Redis online store so they are available for low-latency ``get_online_features``
   calls at serving time.
3. In production these two commands would be orchestrated by a Prefect flow
   (``src/orchestration/flows.py``) or triggered by a CI/CD pipeline after
   a new dataset snapshot is DVC-pushed.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from feast import Entity, FeatureView, Field, FileSource  # type: ignore[import-untyped]
from feast.types import Float32, Int32  # type: ignore[import-untyped]
from feast.value_type import ValueType  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Entity
# ---------------------------------------------------------------------------

applicant = Entity(
    name="applicant_id",
    join_keys=["applicant_id"],
    value_type=ValueType.STRING,
    description="Unique identifier for a loan applicant.",
)

# ---------------------------------------------------------------------------
# Source — points at the DVC-versioned Parquet offline store
# ---------------------------------------------------------------------------

source = FileSource(
    path="data/versioned/features.parquet",
    timestamp_field="event_ts",
)

# ---------------------------------------------------------------------------
# Feature View
# ---------------------------------------------------------------------------

credit_features_view = FeatureView(
    name="credit_features",
    entities=[applicant],
    ttl=timedelta(days=1),
    schema=[
        Field(name="debt_to_income", dtype=Float32),
        Field(name="credit_utilization", dtype=Float32),
        Field(name="num_delinquencies_24mo", dtype=Int32),
        Field(name="employment_length_years", dtype=Float32),
        Field(name="loan_to_value", dtype=Float32),
    ],
    source=source,
    online=True,
    description="Core credit-risk features materialised from the offline Parquet store.",
)

logger.info(
    "Feast feature definitions loaded: entity=%s, view=%s",
    applicant.name,
    credit_features_view.name,
)
