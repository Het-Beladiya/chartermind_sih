from typing import Dict, List, Optional, Union
from app.schemas.cargo import CargoRequestBase, CargoRequestResponse
from app.schemas.port import PortSpec
from app.schemas.risk import RiskScoreResult
from app.schemas.vessel import VesselSpec
from app.schemas.voyage import RiskBucket, SimulatorOverrides


def calculate_risk_scores(
    cargo: Union[CargoRequestBase, CargoRequestResponse],
    vessel: VesselSpec,
    port: PortSpec,
    overrides: Optional[SimulatorOverrides] = None,
) -> RiskScoreResult:
    """
    Evaluate multi-vector maritime risk scores (0-100) across 5 critical dimensions:
    1. Market Risk: Geopolitical distance, freight volatility, and spot market shifts.
    2. Port Risk: Port queue congestion, berth availability, and lock navigation risks.
    3. Weather Risk: Monsoon swells, cyclone alerts, and rough sea states.
    4. Vessel Risk: Fleet availability tightness, vintage, and regional positioning.
    5. Commodity Risk: Cargo liquefaction (Bauxite), moisture decay (Grain), or coal dusting.
    
    Returns:
        RiskScoreResult with sub-scores, weighted composite score, risk bucket,
        primary risk driver, and executive summary sentence.
    """
    congestion = overrides.congestion if overrides and overrides.congestion else port.congestion
    weather = overrides.weather if overrides and overrides.weather else "Normal"
    avail = overrides.vessel_availability if overrides and overrides.vessel_availability else vessel.availability

    # 1. Market Risk
    market_risk = 46.0
    if cargo.origin_country == "Russia":
        market_risk += 32.0
    elif cargo.origin_country == "Australia":
        market_risk += 14.0

    if overrides and overrides.freight_rate_offset_percent and overrides.freight_rate_offset_percent > 10.0:
        market_risk += 18.0

    # 2. Port Risk
    port_risk = 28.0
    if congestion == "Medium":
        port_risk += 22.0
    elif congestion == "High":
        port_risk += 44.0
    elif congestion == "Critical":
        port_risk += 62.0

    # 3. Weather Risk
    if weather == "Rough":
        weather_risk = 58.0
    elif weather == "Severe":
        weather_risk = 88.0
    else:
        weather_risk = 18.0

    if port.weather_risk == "High":
        weather_risk += 12.0

    # 4. Vessel Risk
    vessel_risk = 22.0
    if avail == "Limited":
        vessel_risk += 36.0
    elif avail == "Scarce":
        vessel_risk += 66.0

    # 5. Commodity Risk
    commodity_risk = 30.0
    if cargo.cargo_type == "Coal":
        commodity_risk += 8.0
    elif cargo.cargo_type == "Grain":
        commodity_risk += 15.0
    elif cargo.cargo_type == "Iron Ore":
        commodity_risk += 5.0
    elif cargo.cargo_type == "Bauxite":
        commodity_risk += 22.0

    # Clamp sub-scores to [0, 100]
    market_risk = min(100.0, max(0.0, round(market_risk, 1)))
    port_risk = min(100.0, max(0.0, round(port_risk, 1)))
    weather_risk = min(100.0, max(0.0, round(weather_risk, 1)))
    vessel_risk = min(100.0, max(0.0, round(vessel_risk, 1)))
    commodity_risk = min(100.0, max(0.0, round(commodity_risk, 1)))

    # Weighted Average: Market 25%, Port 30%, Weather 20%, Vessel 15%, Commodity 10%
    overall_score = round(
        market_risk * 0.25
        + port_risk * 0.30
        + weather_risk * 0.20
        + vessel_risk * 0.15
        + commodity_risk * 0.10,
        1,
    )

    # Risk Bucket
    if overall_score < 35.0:
        bucket: RiskBucket = "Low"
    elif overall_score < 55.0:
        bucket = "Medium"
    elif overall_score < 75.0:
        bucket = "High"
    else:
        bucket = "Critical"

    # Identify dominant primary driver
    driver_candidates: List[Dict[str, Union[str, float]]] = [
        {"name": "Market Risk", "score": market_risk, "cause": "geopolitical corridor volatility"},
        {"name": "Port Risk", "score": port_risk, "cause": f"anchorage queue wait times at {port.name}"},
        {"name": "Weather Risk", "score": weather_risk, "cause": f"marine sea-state and {weather.lower()} swell advisories"},
        {"name": "Vessel Risk", "score": vessel_risk, "cause": f"{avail.lower()} spot bulker tonnage availability"},
        {"name": "Commodity Risk", "score": commodity_risk, "cause": f"{cargo.cargo_type} moisture and handling sensitivities"},
    ]
    driver_candidates.sort(key=lambda x: float(x["score"]), reverse=True)
    primary = driver_candidates[0]

    summary_sentence = (
        f"Overall risk is {bucket} ({overall_score}/100), driven primarily by elevated {primary['name']} "
        f"({primary['score']}/100) due to {primary['cause']}."
    )

    return RiskScoreResult(
        market_risk=market_risk,
        port_risk=port_risk,
        weather_risk=weather_risk,
        vessel_risk=vessel_risk,
        commodity_risk=commodity_risk,
        overall_score=overall_score,
        bucket=bucket,
        primary_driver=str(primary["name"]),
        summary_sentence=summary_sentence,
    )
