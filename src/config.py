"""Centralized, typed settings loaded from environment variables (Pydantic BaseSettings) so no module reads os.environ directly."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # MLflow
    mlflow_tracking_uri: str = "http://localhost:5000"

    # Supabase audit store
    supabase_url: str
    supabase_key: str

    # LLM (Groq)
    groq_api_key: str

    # Feature store / Redis online store
    redis_host: str = "localhost"
    redis_port: int = 6379

    # Feast
    feast_repo_path: str = "src/features"

    # DVC remote (optional — can be a local path or s3:// uri)
    dvc_remote_url: str = "gs://arbiter-dvc-store"

    # Serving
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    production_model_uri: str = "models:/credit_champion/Production"

    # Prefect
    prefect_api_url: str = "http://localhost:4200/api"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()  # type: ignore[call-arg]  # fields are populated from env at runtime
