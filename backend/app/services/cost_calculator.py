from decimal import Decimal
from typing import Optional, Union
from app.schemas.cargo import CargoRequestBase, CargoRequestResponse
from app.schemas.idle import IdlePredictionResult
from app.schemas.port import PortSpec
from app.schemas.risk import RiskScoreResult
from app.schemas.vessel import VesselSpec
from app.schemas.voyage import SimulatorOverrides, VoyageCostBreakdown
from app.utils.constants import ROUTE_BASELINE_RATES, USD_TO_INR_RATE, VESSEL_RATE_MULTIPLIERS


def calculate_voyage_cost(
    cargo: Union[CargoRequestBase, CargoRequestResponse],
    vessel: VesselSpec,
    port: PortSpec,
    idle_result: IdlePredictionResult,
    risk_scores: RiskScoreResult,
    overrides: Optional[SimulatorOverrides] = None,
) -> VoyageCostBreakdown:
    """
    Calculate full landed voyage charter costs, port charges, handling tariffs,
    anchorage idle expenses, and demurrage exposure in both USD and INR.
    
    Formula Breakdown:
    - Freight Rate ($/MT): base_route_rate * vessel_multiplier * (1 - scale_discount) * (1 + offset)
    - Scale Discount: Up to 8% discount for high volume parcels (30k to 330k MT)
    - Port Charges ($): port.base_port_fee_usd + qty * $0.42/MT (statutory dues, pilotage)
    - Cargo Handling ($): port.cargo_handling_cost_per_mt * qty (stevedoring, crane, conveyor)
    - Idle Waiting ($): idle_result.idle_cost_usd
    - Demurrage Exposure ($): (risk_score / 100) * demurrage_rate_per_day * (idle_hours / 24) * 0.6
    - Currency Conversion: 1 USD = 83.5 INR
    """
    qty = float(cargo.cargo_quantity_mt)
    origin = cargo.origin_country
    dest = cargo.destination_port

    base_rate = ROUTE_BASELINE_RATES.get(origin, {}).get(dest, 18.0)
    vessel_multiplier = VESSEL_RATE_MULTIPLIERS.get(vessel.id.lower(), 1.0)

    # 1. Volume Scale Discount
    scale_discount = min(0.08, max(0.0, (qty - 30000.0) / 300000.0 * 0.08))
    freight_rate_per_mt = round(base_rate * vessel_multiplier * (1.0 - scale_discount), 2)

    # Simulator Freight Rate Offset
    if overrides and overrides.freight_rate_offset_percent:
        freight_rate_per_mt = round(
            freight_rate_per_mt * (1.0 + overrides.freight_rate_offset_percent / 100.0), 2
        )

    freight_cost_usd = round(freight_rate_per_mt * qty, 2)

    # 2. Port Charges
    port_charges_usd = round(port.base_port_fee_usd + qty * 0.42, 2)

    # 3. Cargo Loading & Discharge Handling
    loading_discharge_cost_usd = round(port.cargo_handling_cost_per_mt * qty, 2)

    # 4. Idle Waiting Cost
    idle_waiting_cost_usd = round(idle_result.idle_cost_usd, 2)

    # 5. Delay Demurrage Exposure
    risk_factor = risk_scores.overall_score / 100.0
    idle_days = idle_result.expected_idle_hours / 24.0
    demurrage_exposure_usd = round(
        risk_factor * vessel.demurrage_rate_per_day * idle_days * 0.6, 2
    )

    # Total Sums
    total_cost_usd = round(
        freight_cost_usd
        + port_charges_usd
        + loading_discharge_cost_usd
        + idle_waiting_cost_usd
        + demurrage_exposure_usd,
        2,
    )

    cost_per_mt_usd = round(total_cost_usd / qty, 2) if qty > 0 else 0.0
    total_cost_inr = round(total_cost_usd * USD_TO_INR_RATE, 2)
    total_cost_inr_lakhs = round(total_cost_inr / 100000.0, 2)
    total_cost_inr_crores = round(total_cost_inr / 10000000.0, 2)

    # Cost Share Percentages
    pct_freight = round((freight_cost_usd / total_cost_usd) * 100.0, 1) if total_cost_usd > 0 else 0.0
    pct_port = round((port_charges_usd / total_cost_usd) * 100.0, 1) if total_cost_usd > 0 else 0.0
    pct_handling = round((loading_discharge_cost_usd / total_cost_usd) * 100.0, 1) if total_cost_usd > 0 else 0.0
    pct_idle = round((idle_waiting_cost_usd / total_cost_usd) * 100.0, 1) if total_cost_usd > 0 else 0.0
    pct_demurrage = round((demurrage_exposure_usd / total_cost_usd) * 100.0, 1) if total_cost_usd > 0 else 0.0

    percentages = {
        "freight": pct_freight,
        "port": pct_port,
        "handling": pct_handling,
        "idle": pct_idle,
        "demurrage": pct_demurrage,
    }

    return VoyageCostBreakdown(
        freight_cost_usd=Decimal(str(freight_cost_usd)),
        port_charges_usd=Decimal(str(port_charges_usd)),
        loading_discharge_cost_usd=Decimal(str(loading_discharge_cost_usd)),
        idle_waiting_cost_usd=Decimal(str(idle_waiting_cost_usd)),
        demurrage_exposure_usd=Decimal(str(demurrage_exposure_usd)),
        total_cost_usd=Decimal(str(total_cost_usd)),
        total_cost_inr=Decimal(str(total_cost_inr)),
        total_cost_inr_lakhs=total_cost_inr_lakhs,
        total_cost_inr_crores=total_cost_inr_crores,
        cost_per_mt_usd=Decimal(str(cost_per_mt_usd)),
        freight_rate_per_mt=Decimal(str(freight_rate_per_mt)),
        percentages=percentages,
    )
