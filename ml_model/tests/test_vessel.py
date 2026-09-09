"""
Tests for Vessel Optimization, Physical Compatibility, and Economics.
"""

from app.services.vessel_service import VesselService


def test_vessel_rejection_for_shallow_port():
    svc = VesselService()
    # Kolkata has max draft 7.5m; Capesize (18.2m draft) MUST be rejected
    res = svc.optimize_fleet(
        port_name="Kolkata",
        cargo_tonnes=70000.0,
        distance_nm=1500.0,
        bunker_price_usd=620.0,
        target_horizon_months=1,
    )
    assert res["status"] == "success"
    # Find Capesize in all_options
    cape = next(v for v in res["all_options"] if v["vessel_class"] == "Capesize")
    assert not cape["compatible"]
    assert any("exceeds" in r for r in cape["rejection_reasons"])


def test_vessel_optimization_positive_economics():
    svc = VesselService()
    res = svc.optimize_fleet(
        port_name="Dhamra",
        cargo_tonnes=65000.0,
        distance_nm=2000.0,
        bunker_price_usd=620.0,
        target_horizon_months=1,
    )
    assert res["status"] == "success"
    assert res["recommended_vessel"] is not None
    assert res["recommended_vessel"]["freight_rate_usd_per_tonne"] > 0
    assert res["recommended_vessel"]["total_voyage_cost_usd"] > 0
