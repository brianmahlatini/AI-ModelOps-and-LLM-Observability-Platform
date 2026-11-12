import re

from app.schemas.evaluation import EvaluationRequest, EvaluationResult


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def evaluate(request: EvaluationRequest) -> EvaluationResult:
    """Return transparent lexical proxies, not a claim of factual verification."""
    answer_terms = _tokens(request.output)
    prompt_terms = _tokens(request.input)
    context_terms = _tokens(request.context)
    if context_terms:
        groundedness = len(answer_terms & context_terms) / max(len(answer_terms), 1)
    else:
        groundedness = 0.5
    relevance = len(answer_terms & prompt_terms) / max(len(prompt_terms), 1)
    relevance = min(relevance * 2, 1.0)
    hallucination_risk = 1 - groundedness if context_terms else 0.5
    return EvaluationResult(
        groundedness=round(groundedness, 4),
        relevance=round(relevance, 4),
        hallucination_risk=round(hallucination_risk, 4),
        method="lexical-overlap-proxy",
        disclaimer=(
            "Heuristic signal only; lexical overlap does not establish factuality. "
            "Use a calibrated evaluator and human review for production decisions."
        ),
    )
