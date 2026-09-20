"""Liveness/readiness probe for Kubernetes."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    """Return a simple liveness indicator.

    K8s readiness / liveness probes hit this endpoint.  A 200 response
    signals that the pod is ready to accept traffic.
    """
    return {"status": "ok"}
