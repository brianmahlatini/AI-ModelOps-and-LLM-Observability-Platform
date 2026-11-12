from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from opentelemetry import trace

from app.db.database import get_db
from app.db.models import PromptVersion, Trace
from app.schemas.evaluation import EvaluationRequest
from app.schemas.trace import TraceCreate, TraceRead
from app.services.analytics import (
    get_alerts,
    get_model_comparison,
    get_overview,
    get_traces,
)
from app.services.evaluation import evaluate
from app.services.pricing import estimate_cost

router = APIRouter(prefix="/api/v1")
tracer = trace.get_tracer("modelops.api")


@router.get("/overview")
def overview(db: Session = Depends(get_db)) -> dict:
    return get_overview(db)


@router.get("/traces", response_model=list[TraceRead])
def traces(
    limit: int = Query(default=50, ge=1, le=200),
    provider: str | None = None,
    status: str | None = Query(default=None, pattern="^(ok|error)$"),
    db: Session = Depends(get_db),
) -> list[Trace]:
    query = select(Trace).order_by(Trace.timestamp.desc())
    if provider:
        query = query.where(Trace.provider == provider)
    if status:
        query = query.where(Trace.status == status)
    return list(db.scalars(query.limit(limit)).all())


@router.post("/traces", response_model=TraceRead, status_code=201)
def create_trace(payload: TraceCreate, db: Session = Depends(get_db)) -> Trace:
    cost = estimate_cost(payload.model, payload.input_tokens, payload.output_tokens)
    with tracer.start_as_current_span("modelops.trace.ingest") as span:
        span.set_attribute("gen_ai.system", payload.provider)
        span.set_attribute("gen_ai.request.model", payload.model)
        span.set_attribute("gen_ai.usage.input_tokens", payload.input_tokens)
        span.set_attribute("gen_ai.usage.output_tokens", payload.output_tokens)
        span.set_attribute("gen_ai.usage.cost_usd", cost)
        trace_record = Trace(
            **payload.model_dump(),
            timestamp=datetime.now(timezone.utc),
            cost_usd=cost,
        )
        db.add(trace_record)
        db.commit()
        db.refresh(trace_record)
        span.set_attribute("modelops.trace.id", trace_record.id)
        return trace_record


@router.get("/models")
def models(db: Session = Depends(get_db)) -> list[dict]:
    return get_model_comparison(db)


@router.get("/prompts")
def prompts(db: Session = Depends(get_db)) -> list[dict]:
    versions = db.scalars(
        select(PromptVersion).order_by(PromptVersion.prompt_key, PromptVersion.created_at.desc())
    ).all()
    result = []
    for version in versions:
        matching = db.scalars(
            select(Trace).where(
                Trace.prompt_version == f"{version.prompt_key}@{version.version}"
            )
        ).all()
        scores = [
            trace.quality_score
            for trace in matching
            if trace.quality_score is not None
        ]
        result.append(
            {
                "prompt_key": version.prompt_key,
                "version": version.version,
                "description": version.description,
                "template": version.template,
                "is_active": version.is_active,
                "created_at": version.created_at,
                "requests": len(matching),
                "avg_quality_score": round(sum(scores) / len(scores), 3)
                if scores
                else None,
            }
        )
    return result


@router.get("/alerts")
def alerts(db: Session = Depends(get_db)) -> list[dict]:
    return get_alerts(get_overview(db))


@router.get("/evaluations")
def evaluations(
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict]:
    scored = db.scalars(
        select(Trace)
        .where(Trace.quality_score.is_not(None))
        .order_by(Trace.timestamp.desc())
        .limit(limit)
    ).all()
    return [
        {
            "trace_id": trace.id,
            "timestamp": trace.timestamp,
            "model": trace.model,
            "provider": trace.provider,
            "prompt_version": trace.prompt_version,
            "quality_score": trace.quality_score,
            "hallucination_score": trace.hallucination_score,
        }
        for trace in scored
    ]


@router.post("/evaluations/run")
def run_evaluation(payload: EvaluationRequest) -> dict:
    return evaluate(payload).model_dump()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "modelops-api"}


@router.get("/metrics", include_in_schema=False)
def prometheus_metrics(db: Session = Depends(get_db)) -> Response:
    overview_data = get_overview(db)
    body = "\n".join(
        [
            "# HELP modelops_requests_in_window Model requests in the last 14 days",
            "# TYPE modelops_requests_in_window gauge",
            f"modelops_requests_in_window {overview_data['total_requests']}",
            "# HELP modelops_success_rate Request success ratio in the last 14 days",
            "# TYPE modelops_success_rate gauge",
            f"modelops_success_rate {overview_data['success_rate']}",
            "# HELP modelops_latency_p95_ms P95 model response latency in milliseconds",
            "# TYPE modelops_latency_p95_ms gauge",
            f"modelops_latency_p95_ms {overview_data['p95_latency_ms']}",
            "# HELP modelops_cost_in_window_usd Estimated model cost in USD over 14 days",
            "# TYPE modelops_cost_in_window_usd gauge",
            f"modelops_cost_in_window_usd {overview_data['total_cost_usd']}",
            "",
        ]
    )
    return Response(content=body, media_type="text/plain; version=0.0.4")


@router.get("/traces/{trace_id}", response_model=TraceRead)
def trace_detail(trace_id: str, db: Session = Depends(get_db)) -> Trace:
    trace = db.get(Trace, trace_id)
    if trace is None:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trace
