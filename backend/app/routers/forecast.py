from datetime import date, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.cargo_request import CargoRequest
from app.models.freight_rate import FreightRate
from app.models.user import User
from app.schemas.forecast import (
    ForecastRequest,
    ForecastResult,
    OptimalCharterWindow,
)
from app.services.forecast_engine import determine_optimal_window, generate_forecast
from app.services.risk_engine import calculate_risk_scores
from app.utils.constants import PORT_SPECS, ROUTE_BASELINE_RATES, VESSEL_SPECS

router = APIRouter(prefix="/forecast", tags=["Freight Rate Forecasting & Market Timing"])


class ForecastCombinedResponse(BaseModel):
    forecast: ForecastResult
    optimal_window: OptimalCharterWindow


@router.post(
    "/generate",
    response_model=ForecastCombinedResponse,
    summary="Generate ML freight rate forecast and optimal chartering window",
)
async def generate_forecast_endpoint(
    req: ForecastRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ForecastCombinedResponse:
    """
    Produce multi-day time-series projections, confidence intervals, and an actionable
    chartering window advisory (Charter Now vs Wait) for the requested cargo shipment.
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

    route_name = f"{cargo.origin_country} → {cargo.destination_port}"

    # Check latest rate from FreightRate database table
    rate_stmt = (
        select(FreightRate)
        .where(
            FreightRate.origin == cargo.origin_country,
            FreightRate.destination == cargo.destination_port,
        )
        .order_by(desc(FreightRate.date))
        .limit(1)
    )
    rate_res = await db.execute(rate_stmt)
    db_rate = rate_res.scalar_one_or_none()

    if db_rate:
        base_rate = float(db_rate.rate_usd_per_mt)
    else:
        base_rate = ROUTE_BASELINE_RATES.get(cargo.origin_country, {}).get(
            cargo.destination_port, 18.0
        )

    port = PORT_SPECS.get(cargo.destination_port) or list(PORT_SPECS.values())[0]
    default_vessel = VESSEL_SPECS.get(
        (cargo.preferred_vessel_type or "panamax").lower(),
        VESSEL_SPECS["panamax"],
    )

    # 1. Generate Forecast
    forecast_result = generate_forecast(
        route=route_name,
        base_rate=base_rate,
        horizon_days=req.horizon_days,
        overrides=req.simulator_overrides,
    )

    # 2. Risk evaluation to inform timing window
    risk_scores = calculate_risk_scores(cargo, default_vessel, port, req.simulator_overrides)

    # 3. Determine Optimal Window
    optimal_window = determine_optimal_window(forecast_result, cargo, risk_scores)

    return ForecastCombinedResponse(
        forecast=forecast_result,
        optimal_window=optimal_window,
    )


@router.get(
    "/rates",
    summary="List recent historical freight rate benchmark entries",
)
async def list_rates(
    origin: Optional[str] = Query(None, description="Filter by origin country"),
    destination: Optional[str] = Query(None, description="Filter by destination port"),
    days: int = Query(90, ge=7, le=365, description="Lookback days window"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Retrieve historical spot rates from PostgreSQL for trade corridors over the past 90 days."""
    cutoff_date = date.today() - timedelta(days=days)
    stmt = select(FreightRate).where(FreightRate.date >= cutoff_date)

    if origin:
        stmt = stmt.where(FreightRate.origin == origin)
    if destination:
        stmt = stmt.where(FreightRate.destination == destination)

    stmt = stmt.order_by(desc(FreightRate.date))
    result = await db.execute(stmt)
    rates = result.scalars().all()

    return [
        {
            "id": r.id,
            "route": r.route,
            "origin": r.origin,
            "destination": r.destination,
            "cargo_type": r.cargo_type,
            "rate_usd_per_mt": float(r.rate_usd_per_mt),
            "date": r.date.isoformat(),
            "source": r.source,
        }
        for r in rates
    ]


@router.get(
    "/routes",
    response_model=List[str],
    summary="List all supported maritime trading corridors",
)
async def list_routes(
    current_user: User = Depends(get_current_user),
) -> List[str]:
    """Return all active bulk shipping routes between overseas origins and Indian East Coast ports."""
    routes: List[str] = []
    for origin, dest_map in ROUTE_BASELINE_RATES.items():
        for dest in dest_map.keys():
            routes.append(f"{origin} → {dest}")
    return routes
