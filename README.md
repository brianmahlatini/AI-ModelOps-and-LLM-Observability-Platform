# AI ModelOps & LLM Observability Platform

An end-to-end observability starter for AI applications. Sentinel brings LLM request telemetry, token and cost accounting, latency and reliability signals, prompt version comparisons, and evaluation-risk indicators into one operator dashboard.

> **Demo data:** The dashboard seeds deterministic synthetic traces over 28 days on first startup. Evaluation and hallucination scores are illustrative signals, not factuality guarantees. Do not use the included heuristic evaluator or demo thresholds as a production safety control.

## What is included

- **Trace ingestion and exploration** — Persist model/provider, prompt version, environment, request status, token usage, latency, cost, optional feedback, and input/output text.
- **Operations metrics** — 14-day request volume, success rate, average and P95 latency, token volume, estimated spend, and model-level comparisons.
- **LLM quality signals** — Quality and hallucination-risk score reporting, plus an explicitly disclosed lexical-overlap evaluation endpoint.
- **Prompt registry view** — Inspect prompt versions and their observed request count and average quality score.
- **Threshold alerts and drift signals** — Surface reliability, tail-latency, quality-regression, and hallucination-risk conditions by comparing consecutive 14-day windows.
- **Metrics and distributed tracing** — Prometheus scrape endpoint and optional OpenTelemetry OTLP export for API spans. An OTLP-compatible Langfuse endpoint can be configured.
- **Containerized local stack** — React dashboard, FastAPI, PostgreSQL, Prometheus, and Grafana with a provisioned ModelOps dashboard.

## Architecture

```text
React + Vite dashboard
        │ /api/v1
        ▼
FastAPI ─────────────── OTLP collector / Langfuse (optional)
   │  │
   │  └── /api/v1/metrics ── Prometheus ── Grafana
   ▼
PostgreSQL (Docker) / SQLite (local development)
```

```text
backend/
  app/
    api/          Versioned REST endpoints
    core/         Environment-backed settings
    db/           SQLAlchemy models, engine, and sessions
    schemas/      Request and response contracts
    services/     Analytics, cost estimation, evaluation, and demo seeding
  tests/          API and behavior tests
frontend/
  src/
    api/          Typed API client
    components/   Dashboard panels and reusable UI
    hooks/        Dashboard data lifecycle
observability/    Prometheus scrape and Grafana datasource provisioning
```

## Run with Docker Compose

Requirements: Docker Desktop with Compose.

```bash
docker compose up --build
```

| Service | URL |
| --- | --- |
| Sentinel dashboard | <http://localhost:3000> |
| FastAPI docs | <http://localhost:8000/docs> |
| Prometheus | <http://localhost:9090> |
| Grafana | <http://localhost:3001> (`admin` / `admin` locally) |

Grafana provisions a **ModelOps Overview** dashboard with request, success-rate, P95-latency, and estimated-cost panels.

Set `GRAFANA_ADMIN_PASSWORD` in `.env` before exposing Grafana outside a local development machine. The compose PostgreSQL credentials are development-only.

## Run locally

### API

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API defaults to a local SQLite database (`backend/modelops.db` when started from this directory) and seeds 28 days of sample traces for period-over-period comparisons. Set `DEMO_SEED=false` to disable demo data or set `DATABASE_URL` to use another SQLAlchemy database URL.

### Dashboard

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` to the local API at `http://localhost:8000`.

## API reference

All application endpoints are under `/api/v1`; interactive OpenAPI docs are at `/docs`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/overview` | 14-day operational and evaluation aggregates |
| `GET` | `/traces?limit=50&provider=OpenAI&status=ok` | Filter and list recent traces |
| `GET` | `/traces/{trace_id}` | Retrieve a trace |
| `POST` | `/traces` | Ingest a model trace and estimate cost |
| `GET` | `/models` | Compare providers and models |
| `GET` | `/prompts` | View prompt versions and observed results |
| `GET` | `/evaluations` | List scored traces |
| `POST` | `/evaluations/run` | Run lexical-overlap evaluation proxies |
| `GET` | `/alerts` | Evaluate configured demo alert thresholds |
| `GET` | `/metrics` | Prometheus text exposition format |

Example trace ingestion:

```bash
curl -X POST http://localhost:8000/api/v1/traces \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "OpenAI",
    "model": "gpt-4o-mini",
    "input_tokens": 320,
    "output_tokens": 140,
    "latency_ms": 487,
    "prompt_version": "support-assistant@v3",
    "status": "ok"
  }'
```

The cost estimator uses the illustrative model rates in `backend/app/services/pricing.py`; unknown model names use a documented default estimate. Keep rates aligned with your provider contracts before using spend numbers for billing.

## OpenTelemetry and Langfuse

The API automatically instruments FastAPI request spans. To export them to an OTLP/HTTP-compatible collector, set:

```env
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://your-collector.example/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer%20your-token
```

For Langfuse, use its OTLP trace ingestion endpoint and the `Authorization=Basic%20<base64(public-key:secret-key)>` header. Copy the exact endpoint and credentials from your Langfuse project settings; never commit them. The application-specific trace ingestion endpoint currently persists its own normalized trace record and emits an API span. Provider model-call instrumentation should be added at the calling application boundary.

## Evaluation and production considerations

The bundled `lexical-overlap-proxy` measures token overlap with supplied input/context. It is intentionally transparent and is **not** an LLM judge, groundedness proof, drift detector, or production hallucination detector. Replace or augment it with representative, versioned evaluation datasets, calibrated model/human graders, and offline regression gates before deployment.

Likewise, the seeded health scores, alert thresholds, and pricing table are demonstration defaults. The quality-regression signal compares aggregate scores across fixed time windows; it is not feature-distribution or embedding drift detection. A production rollout should add tenant authentication/authorization, retention and PII controls, queue-backed ingestion, database migrations, durable alert delivery, per-provider pricing updates, calibrated drift/statistical tests, and SLOs based on your workload.

## Development checks

```powershell
# Backend
cd backend
$env:PYTHONPATH = "."
$env:DATABASE_URL = "sqlite:///./test-modelops.db"
pytest

# Frontend (from the repository root)
cd ..\frontend
npm install
npm run build
npm run lint
```

## License

This project is provided as an educational starter. Add a license that matches your intended use before redistribution.
