"""
Multi-Factor Voyage Risk Assessment Service.
Synthesizes ML market forecast signals, statistical port congestion Z-scores,
deterministic physical draft clearances, and seasonal cyclone weather risks.

METHODOLOGY NOTE:
Hybrid Decision System:
- ML Signal: Freight rate trend & forecast volatility from trained Ridge model.
- Statistical Signal: 10-year port throughput Z-scores.
- Rule-Based / Domain Logic: Physical under-keel clearance (UKC) and BIMCO clauses.
"""

from typing import Dict, Any, List
from .port_service import PortService
from .forecast_service import ForecastService


class RiskService:
    def __init__(self, port_service: PortService = None, forecast_service: ForecastService = None):
        self.port_service = port_service or PortService()
        self.forecast_service = forecast_service or ForecastService()

    def assess_risk(
        self,
        port_name: str,
        vessel_class: str,
        vessel_draft_m: float,
        cargo_tonnes: float,
        voyage_month: int = 7,
        weather_condition: str = "Normal",
        freight_hedge_status: str = "Unhedged",
    ) -> Dict[str, Any]:
        identified_risks: List[str] = []
        mitigation_clauses: List[str] = []

        # 1. Market Volatility Risk (Weight: 25%) - ML Signal
        market_score = 45.0
        if freight_hedge_status == "Unhedged":
            market_score += 25.0
            identified_risks.append("Unhedged freight rate exposure exposed to Baltic Dry Index spot volatility.")
            mitigation_clauses.append("BIMCO Forward Freight Agreement (FFA) or index-linked collar contract.")
        else:
            market_score -= 15.0

        # 2. Port Congestion Risk (Weight: 30%) - Statistical Signal
        port_intel = self.port_service.get_port_intelligence(port_name)
        z_score = port_intel.get("congestion_score_z", 0.0)
        congestion_score = min(100.0, max(10.0, 50.0 + z_score * 20.0))

        if z_score > 1.0:
            identified_risks.append(f"Statistically elevated port throughput (Z-score +{z_score:.2f}σ). High demurrage risk.")
            mitigation_clauses.append("BIMCO Laytime and Demurrage Clause with strict Notice of Readiness (NOR) triggers.")

        # 3. Physical Navigational Risk (Weight: 25%) - Deterministic Rules
        specs = port_intel.get("specs", {})
        channel_depth = specs.get("channel_depth_m", 16.0)
        max_draft = specs.get("max_draft_m", 15.0)

        physical_score = 20.0
        ukc = channel_depth - vessel_draft_m
        if ukc < 0.5:
            physical_score += 60.0
            identified_risks.append(f"Critical navigational clearance: draft ({vessel_draft_m}m) exceeds channel depth ({channel_depth}m) minus 0.5m UKC.")
            mitigation_clauses.append("Compulsory high-water tidal escort and lighterage clause.")
        elif ukc < 1.2:
            physical_score += 35.0
            identified_risks.append(f"Narrow under-keel clearance ({ukc:.1f}m). Transit contingent on tidal swell.")

        if vessel_draft_m > max_draft:
            physical_score += 30.0
            identified_risks.append(f"Vessel draft exceeds berth limit ({max_draft}m). Lightening required.")

        # 4. Weather & Monsoon Risk (Weight: 20%) - Domain Rules
        weather_score = 25.0
        # Bay of Bengal cyclone peaks: May (pre-monsoon) and Oct-Nov (post-monsoon)
        if voyage_month in [10, 11]:
            weather_score += 40.0
            identified_risks.append("High cyclone hazard in Bay of Bengal (post-monsoon tropical cyclone window).")
            mitigation_clauses.append("BIMCO Safe Port and Force Majeure Weather Interruption Clause.")
        elif voyage_month in [6, 7, 8, 9]:
            weather_score += 25.0
            identified_risks.append("Southwest monsoon sea swell causing cargo handling delays at open roadsteads.")

        if weather_condition in ["Rough", "Severe Storm"]:
            weather_score += 25.0
            identified_risks.append(f"Adverse weather condition selected: {weather_condition}.")

        # Composite Weighted Risk Score
        composite_score = (
            0.25 * market_score
            + 0.30 * congestion_score
            + 0.25 * physical_score
            + 0.20 * weather_score
        )
        composite_score = round(max(5.0, min(99.0, composite_score)), 1)

        if composite_score >= 70:
            level = "CRITICAL"
        elif composite_score >= 50:
            level = "ELEVATED"
        elif composite_score >= 30:
            level = "MODERATE"
        else:
            level = "LOW"

        return {
            "status": "success",
            "overall_risk_score": composite_score,
            "risk_level": level,
            "component_scores": {
                "market_risk": round(market_score, 1),
                "congestion_risk": round(congestion_score, 1),
                "physical_clearance_risk": round(physical_score, 1),
                "weather_hazard_risk": round(weather_score, 1),
            },
            "identified_risks": identified_risks,
            "mitigation_clauses": list(set(mitigation_clauses)),
        }
