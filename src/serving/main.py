"""FastAPI application entrypoint; mounts routers and loads the production model once at startup."""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response

from src.monitoring.metrics import metrics_response
from src.serving.routes import explain, health, predict

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Load the production model and SHAP explainer on startup; clean up on shutdown."""
    import mlflow

    from src.config import get_settings
    from src.serving.explainer import build_explainer

    settings = get_settings()

    logger.info("Loading production model from %s …", settings.production_model_uri)
    try:
        model = mlflow.pyfunc.load_model(settings.production_model_uri)
        app.state.model = model
        logger.info("Production model loaded successfully.")
    except Exception:
        logger.exception(
            "Failed to load production model from %s — "
            "endpoints that depend on the model will return 503.",
            settings.production_model_uri,
        )
        app.state.model = None

    if app.state.model is not None:
        try:
            app.state.explainer = build_explainer(app.state.model)
            logger.info("SHAP explainer built successfully.")
        except Exception:
            logger.exception("Failed to build SHAP explainer.")
            app.state.explainer = None
    else:
        app.state.explainer = None

    yield  # — application runs here —

    logger.info("Shutting down Arbiter Serving API.")


app = FastAPI(
    title="Arbiter Serving API",
    description="Async credit-risk scoring and explanation endpoints for the Arbiter governance platform.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(predict.router)
app.include_router(explain.router)


@app.get("/metrics")
async def metrics() -> Response:
    """Expose Prometheus metrics in text exposition format."""
    body, content_type = metrics_response()
    return Response(content=body, media_type=content_type)
