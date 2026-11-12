from fastapi.testclient import TestClient

from app.main import app


def test_health_and_overview() -> None:
    with TestClient(app) as client:
        assert client.get("/api/v1/health").json()["status"] == "ok"
        overview = client.get("/api/v1/overview").json()
        assert overview["total_requests"] > 0
        assert 0 <= overview["success_rate"] <= 1
        assert len(overview["series"]) == 14
        assert overview["requests_change_pct"] is not None
        assert overview["scored_traces"] > 0


def test_create_trace_cost_and_filtering() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/traces",
            json={
                "provider": "OpenAI",
                "model": "gpt-4o-mini",
                "latency_ms": 410,
                "input_tokens": 1000,
                "output_tokens": 500,
                "status": "ok",
            },
        )
        assert response.status_code == 201
        trace = response.json()
        assert trace["cost_usd"] == 0.00045
        filtered = client.get("/api/v1/traces", params={"provider": "OpenAI", "limit": 5})
        assert all(item["provider"] == "OpenAI" for item in filtered.json())


def test_evaluation_returns_disclosed_heuristic() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/evaluations/run",
            json={
                "input": "What is the return policy?",
                "output": "The return policy allows a return within 30 days.",
                "context": "Customers may return an item within 30 days.",
            },
        )
        assert response.status_code == 200
        assert response.json()["method"] == "lexical-overlap-proxy"
        assert "does not establish factuality" in response.json()["disclaimer"]
