from pydantic import BaseModel, Field


class EvaluationRequest(BaseModel):
    input: str = Field(min_length=1, max_length=12_000)
    output: str = Field(min_length=1, max_length=12_000)
    context: str = Field(default="", max_length=12_000)


class EvaluationResult(BaseModel):
    groundedness: float
    relevance: float
    hallucination_risk: float
    method: str
    disclaimer: str
