from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.cargo_request import CargoRequest
from app.models.user import User
from app.schemas.contract import (
    ContractCompareRequest,
    ContractComparisonResult,
)
from app.schemas.forecast import ForecastRequest, OptimalCharterWindow
from app.services.contract_advisor import compare_contracts
from app.services.cost_calculator import calculate_voyage_cost
from app.services.forecast_engine import determine_optimal_window, generate_forecast
from app.services.idle_predictor import predict_idle_time
from app.services.risk_engine import calculate_risk_scores
from app.services.vessel_scorer import recommend_vessels
from app.utils.constants import PORT_SPECS, ROUTE_BASELINE_RATES

router = APIRouter(prefix="/contract", tags=["Contract Advisor & Strategy"])


@router.post(
    "/compare",
    response_model=ContractComparisonResult,
    summary="Compare Spot Chartering vs Multiple-Voyage Contract of Affreightment (CoA)",
)
async def compare_contracts_endpoint(
    req: ContractCompareRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ContractComparisonResult:
    """
    Simulate financial hedging, rate volume discounts, and operational risk exposure
    between spot fixture and long-term multiple-voyage CoA commitments.
    """
    stmt = (
        select(CargoRequest)
        .where(
            CargoRequest.id == req.cargo_request_id,
            CargoRequest.user_id == current_user.id,
        )
    )
    result = await db.execute(stmt)
    cargo = result.scalar_one_or_none()
    if not cargo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cargo request {req.cargo_request_id} not found",
        )

    port = PORT_SPECS.get(cargo.destination_port)
    if not port:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Port '{cargo.destination_port}' not found in specifications",
        )

    # 1. Resolve optimal vessel recommendation
    ranked_vessels = recommend_vessels(cargo, port, req.simulator_overrides)
    top_vessel_breakdown = ranked_vessels[0]
    vessel = top_vessel_breakdown.vessel

    # 2. Pipeline calculation
    risk_scores = calculate_risk_scores(cargo, vessel, port, req.simulator_overrides)
    weather = req.simulator_overrides.weather if req.simulator_overrides else "Normal"
    congestion = req.simulator_overrides.congestion if req.simulator_overrides else port.congestion
    idle_result = predict_idle_time(
        port, vessel, weather, congestion, top_vessel_breakdown.compatibility
    )
    cost_breakdown = calculate_voyage_cost(
        cargo, vessel, port, idle_result, risk_scores, req.simulator_overrides
    )

    return compare_contracts(cargo, vessel, cost_breakdown, risk_scores)


@router.post(
    "/optimal-window",
    response_model=OptimalCharterWindow,
    summary="Determine optimal chartering fixture execution window",
)
async def optimal_window_endpoint(
    req: ForecastRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OptimalCharterWindow:
    """Evaluate market rate trend to formulate charter execution advisory (Charter Now vs Wait)."""
    stmt = (
        select(CargoRequest)
        .where(
            CargoRequest.id == req.cargo_request_id,
            CargoRequest.user_id == current_user.id,
        )
    )
    result = await db.execute(stmt)
    cargo = result.scalar_one_or_none()
    if not cargo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cargo request {req.cargo_request_id} not found",
        )

    port = PORT_SPECS.get(cargo.destination_port) or list(PORT_SPECS.values())[0]
    ranked = recommend_vessels(cargo, port, req.simulator_overrides)
    vessel = ranked[0].vessel

    base_rate = ROUTE_BASELINE_RATES.get(cargo.origin_country, {}).get(
        cargo.destination_port, 18.0
    )
    route_name = f"{cargo.origin_country} → {cargo.destination_port}"

    forecast_res = generate_forecast(
        route=route_name,
        base_rate=base_rate,
        horizon_days=req.horizon_days,
        overrides=req.simulator_overrides,
    )
    risk_res = calculate_risk_scores(cargo, vessel, port, req.simulator_overrides)

    return determine_optimal_window(forecast_res, cargo, risk_res)
