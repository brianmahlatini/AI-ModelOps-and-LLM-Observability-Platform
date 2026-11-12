from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TraceCreate(BaseModel):
    name: str = Field(default="llm.generate", max_length=120)
    provider: str = Field(min_length=1, max_length=60)
    model: str = Field(min_length=1, max_length=120)
    environment: str = Field(default="production", max_length=40)
    status: str = Field(default="ok", pattern="^(ok|error)$")
    input_tokens: int = Field(default=0, ge=0)
    output_tokens: int = Field(default=0, ge=0)
    latency_ms: float = Field(ge=0)
    prompt_version: str = Field(default="support-assistant@v1", max_length=80)
    feedback_score: float | None = Field(default=None, ge=0, le=1)
    quality_score: float | None = Field(default=None, ge=0, le=1)
    hallucination_score: float | None = Field(default=None, ge=0, le=1)
    input_text: str = Field(default="", max_length=20_000)
    output_text: str = Field(default="", max_length=20_000)
    user_id: str | None = Field(default=None, max_length=120)


class TraceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    name: str
    provider: str
    model: str
    environment: str
    status: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    cost_usd: float
    prompt_version: str
    feedback_score: float | None
    quality_score: float | None
    hallucination_score: float | None
    input_text: str
    output_text: str
