from typing import Union
from app.schemas.cargo import CargoRequestBase, CargoRequestResponse
from app.schemas.contract import ContractComparisonResult, ContractStrategy
from app.schemas.risk import RiskScoreResult
from app.schemas.vessel import VesselSpec
from app.schemas.voyage import VoyageCostBreakdown
from app.utils.constants import USD_TO_INR_RATE


def compare_contracts(
    cargo: Union[CargoRequestBase, CargoRequestResponse],
    vessel: VesselSpec,
    cost_breakdown: VoyageCostBreakdown,
    risk_scores: RiskScoreResult,
) -> ContractComparisonResult:
    """
    Evaluate financial and operational trade-offs between Spot Market Chartering
    versus Long-Term Contract of Affreightment (CoA / Multiple-Voyage).
    
    Economics:
    - Spot Charter: Carries an 8% prompt volatility market premium (1.08x baseline).
    - CoA / Multiple-Voyage: Captures volume charter discounts (~6.5% discount, 0.935x baseline).
    - Mitigates forward rate spikes, secures guaranteed vessel laycan priority,
      and reduces demurrage risk exposure.
    """
    base_rate = float(cost_breakdown.freight_rate_per_mt)
    qty = float(cargo.cargo_quantity_mt)
    voyages = max(1, cargo.number_of_voyages)
    total_volume = qty * voyages

    # 1. Spot Rate (8% prompt spot market premium)
    spot_rate_per_mt = round(base_rate * 1.08, 2)
    spot_total_cost_usd = round(spot_rate_per_mt * total_volume, 2)

    # 2. Multiple-Voyage / CoA Rate (6.5% volume commitment discount)
    multi_voyage_rate_per_mt = round(base_rate * 0.935, 2)
    multi_voyage_total_cost_usd = round(multi_voyage_rate_per_mt * total_volume, 2)

    # 3. Savings Calculations
    savings_usd = round(spot_total_cost_usd - multi_voyage_total_cost_usd, 2)
    savings_inr = round(savings_usd * USD_TO_INR_RATE, 2)
    savings_lakhs = round(savings_inr / 100000.0, 2)
    savings_percent = round(((spot_total_cost_usd - multi_voyage_total_cost_usd) / spot_total_cost_usd) * 100.0, 1) if spot_total_cost_usd > 0 else 0.0

    # 4. Comparative Risk Indices
    spot_risk_score = min(95.0, round(risk_scores.overall_score + 12.0, 1))
    multi_voyage_risk_score = max(15.0, round(risk_scores.overall_score - 18.0, 1))

    # 5. Recommendation Strategy
    if savings_usd > 0 and (voyages > 1 or cargo.contract_duration != "Spot"):
        recommended_strategy: ContractStrategy = "Multiple-Voyage"
        reasoning = (
            f"Multiple-Voyage (CoA) structure guarantees tonnage allocation and locks in a {savings_percent}% rate hedge, "
            f"yielding estimated cumulative savings of ₹{savings_lakhs:,.2f} Lakhs (${savings_usd:,.0f} USD) with significantly "
            f"reduced spot volatility exposure ({multi_voyage_risk_score}/100 vs {spot_risk_score}/100)."
        )
    else:
        recommended_strategy = "Spot"
        reasoning = (
            f"Single voyage parcel ({int(qty):,} MT) does not warrant multi-year CoA commitments; prompt spot fixture "
            f"provides maximum scheduling flexibility despite an 8% prompt liquidity premium."
        )

    return ContractComparisonResult(
        recommended_strategy=recommended_strategy,
        spot_total_cost_usd=spot_total_cost_usd,
        multi_voyage_total_cost_usd=multi_voyage_total_cost_usd,
        savings_usd=savings_usd,
        savings_inr=savings_inr,
        savings_lakhs=savings_lakhs,
        savings_percent=savings_percent,
        spot_risk_score=spot_risk_score,
        multi_voyage_risk_score=multi_voyage_risk_score,
        spot_freight_rate_per_mt=spot_rate_per_mt,
        multi_voyage_freight_rate_per_mt=multi_voyage_rate_per_mt,
        reasoning=reasoning,
    )
