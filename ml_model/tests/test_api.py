"""
Integration Tests for FastAPI Endpoints using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["models_loaded"]["bdi_forecast_model"] is True


def test_model_info_endpoint():
    res = client.get("/api/model-info")
    assert res.status_code == 200
    data = res.json()
    assert data["model_name"] == "Ridge"


def test_ports_endpoint():
    res = client.get("/api/ports")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["ports"]) >= 7


def test_forecast_endpoint():
    res = client.post("/api/forecast", json={"horizons_months": 6})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["forecast"]) == 6
    assert data["forecast"][0]["predicted_bdi"] > 0


def test_forecast_endpoint_invalid_input():
    # horizons_months > 24 should fail validation (422)
    res = client.post("/api/forecast", json={"horizons_months": 50})
    assert res.status_code == 422


def test_vessel_recommendations_endpoint():
    payload = {
        "port_name": "Paradip",
        "cargo_tonnes": 55000,
        "distance_nm": 1800,
        "bunker_price_usd": 630,
        "target_horizon_months": 2,
    }
    res = client.post("/api/vessel-recommendations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["all_options"]) > 0


def test_port_intelligence_endpoint():
    res = client.post("/api/port-intelligence", json={"port_name": "Visakhapatnam"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "congestion_score_z" in data


def test_idle_time_endpoint():
    payload = {
        "port_name": "Paradip",
        "vessel_draft_m": 14.5,
        "vessel_class": "Panamax",
        "month": 7,
        "weather_condition": "Rough",
    }
    res = client.post("/api/idle-time", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["expected_wait_hours"] > 0


def test_risk_endpoint():
    payload = {
        "port_name": "Paradip",
        "vessel_class": "Capesize",
        "vessel_draft_m": 17.5,
        "cargo_tonnes": 150000,
        "voyage_month": 11,
        "weather_condition": "Severe Storm",
        "freight_hedge_status": "Unhedged",
    }
    res = client.post("/api/risk", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["overall_risk_score"] > 0
    assert len(data["mitigation_clauses"]) > 0


def test_simulate_endpoint():
    payload = {
        "port_name": "Paradip",
        "vessel_class": "Panamax",
        "cargo_tonnes": 60000,
        "distance_nm": 2000,
        "congestion_shock_pct": 25.0,
        "weather_shock": "Rough",
        "freight_rate_shock_pct": 10.0,
        "bunker_price_usd": 680.0,
    }
    res = client.post("/api/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "delta" in data
    assert "sensitivity_matrix" in data
