import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import PromptVersion, Trace
from app.services.pricing import estimate_cost


def seed_demo_data(db: Session) -> None:
    if db.scalar(select(func.count()).select_from(Trace)):
        return

    rng = random.Random(42)
    models = [
        ("OpenAI", "gpt-4o-mini"),
        ("Anthropic", "claude-3-5-sonnet"),
        ("Google", "gemini-2.0-flash"),
        ("Meta", "llama-3.3-70b"),
    ]
    prompts = ["support-assistant@v3", "support-assistant@v2", "refund-policy@v1"]
    now = datetime.now(timezone.utc)
    for _ in range(560):
        provider, model = rng.choice(models)
        input_tokens = rng.randint(180, 2200)
        output_tokens = rng.randint(50, 850)
        status = "error" if rng.random() < 0.025 else "ok"
        quality = min(max(rng.gauss(0.89, 0.09), 0.35), 1.0)
        hallucination = min(max(rng.gauss(0.075, 0.065), 0.0), 0.48)
        db.add(
            Trace(
                timestamp=now - timedelta(
                    hours=rng.random() * 24 * 28,
                    minutes=rng.randint(0, 59),
                ),
                name=rng.choice(["chat.completion", "support.answer", "rag.query"]),
                provider=provider,
                model=model,
                environment="production" if rng.random() < 0.8 else "staging",
                status=status,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=round(max(120, rng.gauss(720, 230)), 1),
                cost_usd=estimate_cost(model, input_tokens, output_tokens),
                prompt_version=rng.choices(prompts, weights=[0.6, 0.28, 0.12])[0],
                feedback_score=round(rng.random(), 2) if rng.random() < 0.56 else None,
                quality_score=round(quality, 3),
                hallucination_score=round(hallucination, 3),
                input_text=rng.choice(
                    [
                        "How can I update my billing details?",
                        "Summarize the return policy for this order.",
                        "Help me troubleshoot a connection timeout.",
                        "Where can I find my latest invoice?",
                    ]
                ),
                output_text=rng.choice(
                    [
                        "You can update billing details from account settings.",
                        "The return window is 30 days after delivery.",
                        "Try reconnecting and check the service status page.",
                        "Your invoices are available in the billing dashboard.",
                    ]
                ),
                user_id=f"workspace-{rng.randint(1, 18):02d}",
            )
        )

    db.add_all(
        [
            PromptVersion(
                prompt_key="support-assistant",
                version="v3",
                description="Concise support answers with citation requirements",
                template="Answer using the provided context. Cite the source for every policy claim.",
                is_active=True,
                created_at=now - timedelta(days=2),
            ),
            PromptVersion(
                prompt_key="support-assistant",
                version="v2",
                description="Previous support baseline",
                template="Answer the user's support question clearly and accurately.",
                is_active=False,
                created_at=now - timedelta(days=9),
            ),
            PromptVersion(
                prompt_key="refund-policy",
                version="v1",
                description="Refund and return policy assistant",
                template="Explain the refund policy using only the supplied policy context.",
                is_active=True,
                created_at=now - timedelta(days=6),
            ),
        ]
    )
    db.commit()
