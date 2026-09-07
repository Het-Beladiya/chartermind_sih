import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.cargo_request import CargoRequest
from app.models.user import User
from app.models.voyage_plan import VoyagePlan
from app.schemas.cargo import CargoRequestResponse
from app.schemas.voyage import (
    SimulatorOverrides,
    VoyageCostBreakdown,
    VoyagePlanRequest,
    VoyagePlanResponse,
)
from app.services.cost_calculator import calculate_voyage_cost
from app.services.idle_predictor import predict_idle_time
from app.services.risk_engine import calculate_risk_scores
from app.services.vessel_scorer import recommend_vessels
from app.utils.constants import PORT_SPECS, VESSEL_SPECS

router = APIRouter(prefix="/voyage", tags=["Voyage Planner & Optimization"])


def _run_voyage_pipeline(
    cargo: CargoRequest,
    overrides: Optional[SimulatorOverrides] = None,
    final_vessel_class: Optional[str] = None,
) -> Dict[str, Any]:
    """Internal helper to orchestrate vessel selection, risk, idle, and cost calculations."""
    port = PORT_SPECS.get(cargo.destination_port)
    if not port:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown port '{cargo.destination_port}'",
        )

    # 1. Recommend & Rank Vessels
    scored_vessels = recommend_vessels(cargo, port, overrides)
    top_recommended = scored_vessels[0]

    # 2. Select final vessel (user override or algorithm choice)
    selected_breakdown = top_recommended
    if final_vessel_class:
        matched = next(
            (s for s in scored_vessels if s.vessel.id.lower() == final_vessel_class.lower()),
            None,
        )
        if matched:
            selected_breakdown = matched

    vessel = selected_breakdown.vessel

    # 3. Calculate multi-vector risk scores
    risk_scores = calculate_risk_scores(cargo, vessel, port, overrides)

    # 4. Predict idle turnaround & waiting hours
    weather = overrides.weather if overrides else "Normal"
    congestion = overrides.congestion if overrides else port.congestion
    idle_result = predict_idle_time(
        port, vessel, weather, congestion, selected_breakdown.compatibility
    )

    # 5. Compute full voyage financial breakdown
    cost_breakdown = calculate_voyage_cost(
        cargo, vessel, port, idle_result, risk_scores, overrides
    )

    return {
        "vessel": vessel,
        "recommended_vessel_class": top_recommended.vessel.name,
        "final_vessel_class": vessel.name,
        "vessel_score": Decimal(str(selected_breakdown.final_score)),
        "risk_scores": risk_scores,
        "idle_result": idle_result,
        "cost_breakdown": cost_breakdown,
    }


@router.post(
    "/plan",
    response_model=VoyagePlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate and persist an optimized voyage plan",
)
async def create_voyage_plan(
    req: VoyagePlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyagePlanResponse:
    """
    Executes the comprehensive maritime calculation engine and saves the optimized plan to PostgreSQL:
    1. Fetches CargoRequest for authenticated user
    2. Recommends best vessel class
    3. Evaluates composite risk scores
    4. Predicts anchorage idle time
    5. Calculates full landed freight cost breakdown
    6. Persists VoyagePlan
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

    pipeline = _run_voyage_pipeline(cargo, req.simulator_overrides, req.final_vessel_class)
    cost: VoyageCostBreakdown = pipeline["cost_breakdown"]
    risk = pipeline["risk_scores"]
    idle = pipeline["idle_result"]

    overrides_dict = req.simulator_overrides.model_dump() if req.simulator_overrides else {}

    plan = VoyagePlan(
        cargo_request_id=cargo.id,
        user_id=current_user.id,
        recommended_vessel_class=pipeline["recommended_vessel_class"],
        final_vessel_class=pipeline["final_vessel_class"],
        vessel_score=pipeline["vessel_score"],
        freight_cost_usd=cost.freight_cost_usd,
        port_charges_usd=cost.port_charges_usd,
        loading_discharge_cost_usd=cost.loading_discharge_cost_usd,
        idle_waiting_cost_usd=cost.idle_waiting_cost_usd,
        demurrage_exposure_usd=cost.demurrage_exposure_usd,
        total_cost_usd=cost.total_cost_usd,
        total_cost_inr=cost.total_cost_inr,
        cost_per_mt_usd=cost.cost_per_mt_usd,
        freight_rate_per_mt=cost.freight_rate_per_mt,
        expected_idle_hours=Decimal(str(idle.expected_idle_hours)),
        risk_score_overall=Decimal(str(risk.overall_score)),
        risk_bucket=risk.bucket,
        simulator_overrides=overrides_dict,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)

    res = VoyagePlanResponse.model_validate(plan)
    res.cost_breakdown = cost
    res.cargo_request = CargoRequestResponse.model_validate(cargo)
    return res


@router.post(
    "/simulate",
    response_model=VoyagePlanResponse,
    summary="Simulate voyage plan without persisting to DB (What-If)",
)
async def simulate_voyage_plan(
    req: VoyagePlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyagePlanResponse:
    """Executes the calculation pipeline with What-If scenario overrides without modifying PostgreSQL."""
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

    pipeline = _run_voyage_pipeline(cargo, req.simulator_overrides, req.final_vessel_class)
    cost: VoyageCostBreakdown = pipeline["cost_breakdown"]
    risk = pipeline["risk_scores"]
    idle = pipeline["idle_result"]

    overrides_dict = req.simulator_overrides.model_dump() if req.simulator_overrides else {}

    # Build simulated transient VoyagePlan response
    transient_id = uuid.uuid4()
    from datetime import datetime, timezone

    return VoyagePlanResponse(
        id=transient_id,
        cargo_request_id=cargo.id,
        user_id=current_user.id,
        recommended_vessel_class=pipeline["recommended_vessel_class"],
        final_vessel_class=pipeline["final_vessel_class"],
        vessel_score=pipeline["vessel_score"],
        freight_cost_usd=cost.freight_cost_usd,
        port_charges_usd=cost.port_charges_usd,
        loading_discharge_cost_usd=cost.loading_discharge_cost_usd,
        idle_waiting_cost_usd=cost.idle_waiting_cost_usd,
        demurrage_exposure_usd=cost.demurrage_exposure_usd,
        total_cost_usd=cost.total_cost_usd,
        total_cost_inr=cost.total_cost_inr,
        cost_per_mt_usd=cost.cost_per_mt_usd,
        freight_rate_per_mt=cost.freight_rate_per_mt,
        expected_idle_hours=Decimal(str(idle.expected_idle_hours)),
        risk_score_overall=Decimal(str(risk.overall_score)),
        risk_bucket=risk.bucket,
        simulator_overrides=overrides_dict,
        created_at=datetime.now(timezone.utc),
        cost_breakdown=cost,
        cargo_request=CargoRequestResponse.model_validate(cargo),
    )


@router.get(
    "/plans",
    response_model=List[VoyagePlanResponse],
    summary="List all voyage plans for the current user",
)
async def list_voyage_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[VoyagePlanResponse]:
    """Retrieve saved voyage plans for the authenticated user ordered by created_at DESC."""
    stmt = (
        select(VoyagePlan)
        .options(selectinload(VoyagePlan.cargo_request))
        .where(VoyagePlan.user_id == current_user.id)
        .order_by(desc(VoyagePlan.created_at))
    )
    result = await db.execute(stmt)
    plans = result.scalars().all()

    responses: List[VoyagePlanResponse] = []
    for p in plans:
        item = VoyagePlanResponse.model_validate(p)
        if p.cargo_request:
            item.cargo_request = CargoRequestResponse.model_validate(p.cargo_request)
        responses.append(item)
    return responses


@router.get(
    "/plans/{plan_id}",
    response_model=VoyagePlanResponse,
    summary="Get details of a specific voyage plan",
)
async def get_voyage_plan(
    plan_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyagePlanResponse:
    """Retrieve a single saved voyage plan with its cost breakdown and linked cargo parcel."""
    stmt = (
        select(VoyagePlan)
        .options(selectinload(VoyagePlan.cargo_request))
        .where(
            VoyagePlan.id == plan_id,
            VoyagePlan.user_id == current_user.id,
        )
    )
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voyage plan {plan_id} not found",
        )

    res = VoyagePlanResponse.model_validate(plan)
    if plan.cargo_request:
        res.cargo_request = CargoRequestResponse.model_validate(plan.cargo_request)
    return res
