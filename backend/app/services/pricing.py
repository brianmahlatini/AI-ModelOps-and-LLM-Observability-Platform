PRICE_PER_MILLION_TOKENS: dict[str, tuple[float, float]] = {
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "claude-3-5-sonnet": (3.00, 15.00),
    "claude-3-5-haiku": (0.80, 4.00),
    "gemini-2.0-flash": (0.10, 0.40),
    "llama-3.3-70b": (0.59, 0.79),
}


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    input_rate, output_rate = PRICE_PER_MILLION_TOKENS.get(model, (1.0, 3.0))
    return (input_tokens * input_rate + output_tokens * output_rate) / 1_000_000
