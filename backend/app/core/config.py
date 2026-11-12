import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "ModelOps Observability API"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./modelops.db")
    cors_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://localhost:4173"
        ).split(",")
        if origin.strip()
    )
    demo_seed: bool = os.getenv("DEMO_SEED", "true").lower() == "true"
    otel_endpoint: str | None = os.getenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT") or os.getenv(
        "OTEL_EXPORTER_OTLP_ENDPOINT"
    )
    otel_headers: str | None = os.getenv("OTEL_EXPORTER_OTLP_HEADERS")
    deployment_environment: str = os.getenv("DEPLOYMENT_ENVIRONMENT", "development")


settings = Settings()
