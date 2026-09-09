"""
Vessel Optimization & Port Compatibility Service.
Deterministic physical constraints engine (Draft with 0.5m UKC, LOA, Beam, DWT)
coupled with full voyage economics based on predicted charter rates.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd

from .forecast_service import ForecastService

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PORT_SPECS_PATH = BASE_DIR / "data" / "india_eastcoast_port_specs.csv"

REFERENCE_VESSEL_FLEET = [
    {
        "vessel_id": "V-CAPE-01",
        "name": "Newcastlemax Ocean Pioneer",
        "vessel_class": "Capesize",
        "deadweight_dwt": 180000,
        "draft_m": 18.2,
        "loa_m": 292.0,
        "beam_m": 45.0,
        "speed_knots": 13.0,
        "fuel_consumption_tonnes_day": 48.0,
        "port_fuel_consumption_tonnes_day": 4.5,
    },
    {
        "vessel_id": "V-CAPE-02",
        "name": "Standard Cape Valiant",
        "vessel_class": "Capesize",
        "deadweight_dwt": 160000,
        "draft_m": 17.5,
        "loa_m": 280.0,
        "beam_m": 43.0,
        "speed_knots": 13.5,
        "fuel_consumption_tonnes_day": 44.0,
        "port_fuel_consumption_tonnes_day": 4.0,
    },
    {
        "vessel_id": "V-PAN-01",
        "name": "Kamsarmax Eastern Glory",
        "vessel_class": "Panamax",
        "deadweight_dwt": 82000,
        "draft_m": 14.4,
        "loa_m": 229.0,
        "beam_m": 32.26,
        "speed_knots": 14.0,
        "fuel_consumption_tonnes_day": 29.0,
        "port_fuel_consumption_tonnes_day": 3.0,
    },
    {
        "vessel_id": "V-PAN-02",
        "name": "Standard Panamax Trader",
        "vessel_class": "Panamax",
        "deadweight_dwt": 74000,
        "draft_m": 13.8,
        "loa_m": 225.0,
        "beam_m": 32.2,
        "speed_knots": 13.5,
        "fuel_consumption_tonnes_day": 26.5,
        "port_fuel_consumption_tonnes_day": 2.8,
    },
    {
        "vessel_id": "V-SUPRA-01",
        "name": "Ultramax Eco Star",
        "vessel_class": "Supramax",
        "deadweight_dwt": 64000,
        "draft_m": 13.3,
        "loa_m": 199.9,
        "beam_m": 32.26,
        "speed_knots": 14.0,
        "fuel_consumption_tonnes_day": 24.0,
        "port_fuel_consumption_tonnes_day": 2.5,
    },
    {
        "vessel_id": "V-SUPRA-02",
        "name": "Supramax Navigator",
        "vessel_class": "Supramax",
        "deadweight_dwt": 56000,
        "draft_m": 12.8,
        "loa_m": 190.0,
        "beam_m": 32.2,
        "speed_knots": 13.5,
        "fuel_consumption_tonnes_day": 22.0,
        "port_fuel_consumption_tonnes_day": 2.2,
    },
    {
        "vessel_id": "V-HANDY-01",
        "name": "Handysize Pearl",
        "vessel_class": "Handysize",
        "deadweight_dwt": 38000,
        "draft_m": 10.5,
        "loa_m": 180.0,
        "beam_m": 29.8,
        "speed_knots": 13.0,
        "fuel_consumption_tonnes_day": 17.5,
        "port_fuel_consumption_tonnes_day": 1.8,
    },
    {
        "vessel_id": "V-HANDY-02",
        "name": "Coastal Mini Handy",
        "vessel_class": "Handysize",
        "deadweight_dwt": 28000,
        "draft_m": 9.6,
        "loa_m": 165.0,
        "beam_m": 27.0,
        "speed_knots": 12.5,
        "fuel_consumption_tonnes_day": 15.0,
        "port_fuel_consumption_tonnes_day": 1.5,
    },
]


class VesselService:
    def __init__(self, forecast_service: Optional[ForecastService] = None):
        self.forecast_service = forecast_service or ForecastService()
        self.specs_df = pd.DataFrame()
        if PORT_SPECS_PATH.exists():
            self.specs_df = pd.read_csv(PORT_SPECS_PATH)

    def optimize_fleet(
        self,
        port_name: str,
        cargo_tonnes: float,
        distance_nm: float = 2000.0,
        bunker_price_usd: float = 620.0,
        target_horizon_months: int = 1,
    ) -> Dict[str, Any]:
        # Locate target port
        matched = None
        for p in self.specs_df["port_name"].unique():
            if p.lower() == port_name.lower():
                matched = p
                break
        if not matched:
            matched = "Paradip"

        port_specs = self.specs_df[self.specs_df["port_name"] == matched].iloc[0].to_dict()

        # Fetch predicted market TCE rates from ML forecast service
        forecast_res = self.forecast_service.generate_forecast(horizons_months=target_horizon_months)
        step_idx = min(target_horizon_months - 1, len(forecast_res["forecast"]) - 1)
        point = forecast_res["forecast"][step_idx]

        market_rates = {
            "Capesize": point["tce_capesize_usd"],
            "Panamax": point["tce_panamax_usd"],
            "Supramax": point["tce_supramax_usd"],
            "Handysize": point["tce_handysize_usd"],
        }

        evaluated_options: List[Dict[str, Any]] = []

        for v in REFERENCE_VESSEL_FLEET:
            rejection_reasons = []

            # 1. Physical Constraints (UKC = 0.5m)
            channel_depth = float(port_specs.get("channel_depth_m", 16.0))
            max_draft = float(port_specs.get("max_vessel_draft_m", port_specs.get("max_draft_m", 15.0)))
            max_loa = float(port_specs.get("max_vessel_loa_m", port_specs.get("max_loa_m", 280.0)))
            max_beam = float(port_specs.get("max_vessel_beam_m", port_specs.get("max_beam_m", 45.0)))

            req_depth = v["draft_m"] + 0.5
            if req_depth > channel_depth:
                rejection_reasons.append(
                    f"Draft + 0.5m UKC ({req_depth:.1f}m) exceeds channel depth ({channel_depth:.1f}m)"
                )
            if v["draft_m"] > max_draft:
                rejection_reasons.append(
                    f"Berthing draft ({v['draft_m']}m) exceeds max permissible ({max_draft:.1f}m)"
                )
            if v["loa_m"] > max_loa:
                rejection_reasons.append(
                    f"LOA ({v['loa_m']}m) exceeds port limit ({max_loa:.1f}m)"
                )
            if v["beam_m"] > max_beam:
                rejection_reasons.append(
                    f"Beam ({v['beam_m']}m) exceeds channel clearance ({max_beam:.1f}m)"
                )
            if cargo_tonnes > v["deadweight_dwt"]:
                rejection_reasons.append(
                    f"Cargo ({cargo_tonnes:,.0f}t) exceeds vessel deadweight ({v['deadweight_dwt']:,.0f}t)"
                )

            compatible = len(rejection_reasons) == 0

            # 2. Voyage Duration
            sea_days = (distance_nm / (v["speed_knots"] * 24.0)) * 1.05  # 5% weather factor
            handling_rate_tpd = 15000.0 if v["vessel_class"] in ["Capesize", "Panamax"] else 9000.0
            port_days = max(2.5, (cargo_tonnes / handling_rate_tpd) + 1.5)  # includes pre-berthing
            total_voyage_days = sea_days + port_days

            # 3. Cost Breakdown
            fuel_sea = sea_days * v["fuel_consumption_tonnes_day"]
            fuel_port = port_days * v["port_fuel_consumption_tonnes_day"]
            total_fuel_cost = (fuel_sea + fuel_port) * bunker_price_usd

            daily_charter_rate = market_rates.get(v["vessel_class"], 18000.0)
            total_charter_cost = total_voyage_days * daily_charter_rate

            port_dues = port_specs.get("max_deadweight_dwt", 80000) * 0.45

            total_voyage_cost = total_fuel_cost + total_charter_cost + port_dues
            freight_per_tonne = total_voyage_cost / cargo_tonnes if cargo_tonnes > 0 else 0.0

            # Optimization Scoring (lower cost per tonne with high payload efficiency)
            payload_utilization = min(1.0, cargo_tonnes / v["deadweight_dwt"])
            base_score = 100.0 - (freight_per_tonne * 1.5) + (payload_utilization * 25.0)
            score = max(5.0, min(99.0, base_score)) if compatible else 0.0

            evaluated_options.append({
                "vessel_id": v["vessel_id"],
                "name": v["name"],
                "vessel_class": v["vessel_class"],
                "deadweight_dwt": v["deadweight_dwt"],
                "draft_m": v["draft_m"],
                "loa_m": v["loa_m"],
                "beam_m": v["beam_m"],
                "speed_knots": v["speed_knots"],
                "fuel_consumption_tonnes_day": v["fuel_consumption_tonnes_day"],
                "port_fuel_consumption_tonnes_day": v["port_fuel_consumption_tonnes_day"],
                "compatible": compatible,
                "rejection_reasons": rejection_reasons,
                "sea_days": round(sea_days, 1),
                "port_days": round(port_days, 1),
                "total_voyage_days": round(total_voyage_days, 1),
                "fuel_cost_usd": round(total_fuel_cost, 0),
                "charter_cost_usd": round(total_charter_cost, 0),
                "port_dues_usd": round(port_dues, 0),
                "total_voyage_cost_usd": round(total_voyage_cost, 0),
                "freight_rate_usd_per_tonne": round(freight_per_tonne, 2),
                "score": round(score, 1),
            })

        # Sort compatible vessels by score descending
        compatible_sorted = sorted(
            [opt for opt in evaluated_options if opt["compatible"]],
            key=lambda x: x["score"],
            reverse=True,
        )
        recommended = compatible_sorted[0] if compatible_sorted else None

        return {
            "status": "success",
            "target_port": matched,
            "port_specs": port_specs,
            "cargo_tonnes": cargo_tonnes,
            "distance_nm": distance_nm,
            "recommended_vessel": recommended,
            "all_options": evaluated_options,
        }
