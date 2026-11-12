from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Trace


def get_traces(db: Session, limit: int = 100) -> list[Trace]:
    return list(
        db.scalars(select(Trace).order_by(Trace.timestamp.desc()).limit(limit)).all()
    )


def get_overview(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=14)
    previous_cutoff = now - timedelta(days=28)
    traces = list(
        db.scalars(select(Trace).where(Trace.timestamp >= previous_cutoff)).all()
    )
    current_traces = [
        trace
        for trace in traces
        if _as_utc(trace.timestamp) >= cutoff
    ]
    previous_traces = [
        trace
        for trace in traces
        if previous_cutoff <= _as_utc(trace.timestamp) < cutoff
    ]
    total = len(current_traces)
    successful = sum(trace.status == "ok" for trace in current_traces)
    latencies = sorted(trace.latency_ms for trace in current_traces)
    previous_latencies = sorted(trace.latency_ms for trace in previous_traces)
    quality = [
        trace.quality_score
        for trace in current_traces
        if trace.quality_score is not None
    ]
    hallucination = [
        trace.hallucination_score
        for trace in current_traces
        if trace.hallucination_score is not None
    ]
    previous_success_rate = (
        sum(trace.status == "ok" for trace in previous_traces) / len(previous_traces)
        if previous_traces
        else None
    )
    previous_quality = [
        trace.quality_score
        for trace in previous_traces
        if trace.quality_score is not None
    ]
    current_cost = sum(trace.cost_usd for trace in current_traces)
    previous_cost = sum(trace.cost_usd for trace in previous_traces)
    current_p95 = _percentile_95(latencies)
    previous_p95 = _percentile_95(previous_latencies)
    daily: dict[str, dict[str, float]] = defaultdict(
        lambda: {"requests": 0, "cost": 0, "quality_sum": 0, "quality_count": 0}
    )
    for trace in traces:
        trace_time = _as_utc(trace.timestamp)
        if trace_time < cutoff:
            continue
        day = trace_time.strftime("%Y-%m-%d")
        daily[day]["requests"] += 1
        daily[day]["cost"] += trace.cost_usd
        if trace.quality_score is not None:
            daily[day]["quality_sum"] += trace.quality_score
            daily[day]["quality_count"] += 1

    series = []
    today = now.date()
    for offset in range(13, -1, -1):
        day = (today - timedelta(days=offset)).isoformat()
        item = daily[day]
        series.append(
            {
                "date": day,
                "requests": int(item["requests"]),
                "cost_usd": round(item["cost"], 4),
                "quality_score": round(
                    item["quality_sum"] / item["quality_count"], 3
                )
                if item["quality_count"]
                else None,
            }
        )

    return {
        "total_requests": total,
        "success_rate": round(successful / total, 4) if total else 0,
        "avg_latency_ms": round(sum(latencies) / total, 1) if total else 0,
        "p95_latency_ms": current_p95,
        "total_cost_usd": round(current_cost, 4),
        "input_tokens": sum(trace.input_tokens for trace in current_traces),
        "output_tokens": sum(trace.output_tokens for trace in current_traces),
        "avg_quality_score": round(sum(quality) / len(quality), 3) if quality else None,
        "scored_traces": len(quality),
        "previous_scored_traces": len(previous_quality),
        "quality_change_pp": round(
            (sum(quality) / len(quality) - sum(previous_quality) / len(previous_quality))
            * 100,
            2,
        )
        if quality and previous_quality
        else None,
        "hallucination_rate": round(
            sum(score >= 0.5 for score in hallucination) / len(hallucination), 4
        )
        if hallucination
        else None,
        "requests_change_pct": _percent_change(total, len(previous_traces)),
        "success_rate_change_pp": round(
            (successful / total - previous_success_rate) * 100, 2
        )
        if total and previous_success_rate is not None
        else None,
        "p95_latency_change_pct": _percent_change(current_p95, previous_p95),
        "cost_change_pct": _percent_change(current_cost, previous_cost),
        "series": series,
    }


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _percentile_95(values: list[float]) -> float:
    return round(values[min(int(len(values) * 0.95), len(values) - 1)], 1) if values else 0


def _percent_change(current: float, previous: float) -> float | None:
    return round((current - previous) / previous * 100, 2) if previous else None


def get_model_comparison(db: Session) -> list[dict]:
    grouped: dict[tuple[str, str], list[Trace]] = defaultdict(list)
    for trace in db.scalars(select(Trace)).all():
        grouped[(trace.provider, trace.model)].append(trace)
    results = []
    for (provider, model), traces in grouped.items():
        count = len(traces)
        scores = [trace.quality_score for trace in traces if trace.quality_score is not None]
        results.append(
            {
                "provider": provider,
                "model": model,
                "requests": count,
                "success_rate": round(
                    sum(trace.status == "ok" for trace in traces) / count, 4
                ),
                "avg_latency_ms": round(
                    sum(trace.latency_ms for trace in traces) / count, 1
                ),
                "avg_cost_usd": round(
                    sum(trace.cost_usd for trace in traces) / count, 6
                ),
                "avg_quality_score": round(sum(scores) / len(scores), 3)
                if scores
                else None,
            }
        )
    return sorted(results, key=lambda item: item["requests"], reverse=True)


def get_alerts(overview: dict) -> list[dict]:
    alerts = []
    if overview["success_rate"] < 0.98:
        alerts.append(
            {
                "id": "reliability",
                "severity": "critical" if overview["success_rate"] < 0.95 else "warning",
                "title": "Request success rate below target",
                "description": f"Success rate is {overview['success_rate']:.1%}; target is 98%.",
                "metric": "success_rate",
                "value": overview["success_rate"],
            }
        )
    if overview["p95_latency_ms"] > 1200:
        alerts.append(
            {
                "id": "latency",
                "severity": "warning",
                "title": "P95 latency elevated",
                "description": f"P95 response time is {overview['p95_latency_ms']:.0f} ms.",
                "metric": "p95_latency_ms",
                "value": overview["p95_latency_ms"],
            }
        )
    if overview["quality_change_pp"] is not None and overview["quality_change_pp"] <= -5:
        alerts.append(
            {
                "id": "quality-drift",
                "severity": "warning",
                "title": "Evaluation quality has regressed",
                "description": (
                    f"Average quality score is down "
                    f"{abs(overview['quality_change_pp']):.1f} percentage points "
                    "versus the previous 14-day window."
                ),
                "metric": "quality_change_pp",
                "value": overview["quality_change_pp"],
            }
        )
    if overview["hallucination_rate"] is not None and overview["hallucination_rate"] > 0.05:
        alerts.append(
            {
                "id": "hallucination",
                "severity": "critical",
                "title": "High hallucination-risk evaluations",
                "description": (
                    f"{overview['hallucination_rate']:.1%} of scored traces exceeded "
                    "the risk threshold."
                ),
                "metric": "hallucination_rate",
                "value": overview["hallucination_rate"],
            }
        )
    return alerts
