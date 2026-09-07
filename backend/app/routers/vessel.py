from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.cargo_request import CargoRequest
from app.models.user import User
from app.schemas.port import PortCompatibilityRequest
from app.schemas.vessel import (
    PortCompatibilityResult,
    VesselRecommendRequest,
    VesselScoreBreakdown,
    VesselSpec,
)
from app.services.vessel_scorer import check_port_compatibility, recommend_vessels
from app.utils.constants import PORT_SPECS, VESSEL_SPECS

router = APIRouter(prefix="/vessel", tags=["Vessel Optimizer & Suitability"])


@router.get(
    "/specs",
    response_model=List[VesselSpec],
    summary="List all commercial vessel class specifications",
)
async def list_vessel_specs(
    current_user: User = Depends(get_current_user),
) -> List[VesselSpec]:
    """Retrieve specifications for all 4 bulk carrier classes (Capesize, Panamax, Supramax, Handysize)."""
    return list(VESSEL_SPECS.values())


@router.get(
    "/specs/{class_id}",
    response_model=VesselSpec,
    summary="Get specifications of a specific vessel class",
)
async def get_vessel_spec(
    class_id: str,
    current_user: User = Depends(get_current_user),
) -> VesselSpec:
    """Retrieve dimensions, draft, and operational metrics for a vessel class code."""
    vessel = VESSEL_SPECS.get(class_id.lower())
    if not vessel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel class '{class_id}' not found. Available: {list(VESSEL_SPECS.keys())}",
        )
    return vessel


@router.post(
    "/recommend",
    response_model=List[VesselScoreBreakdown],
    summary="Score and rank all vessel classes for a cargo request",
)
async def recommend_vessels_endpoint(
    req: VesselRecommendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[VesselScoreBreakdown]:
    """
    Fetch cargo request from DB, evaluate dimensional berthing constraints,
    capacity fit, cost economics, and return scored vessels in descending rank order.
    """
    stmt = select(CargoRequest).where(
        CargoRequest.id == req.cargo_request_id,
        CargoRequest.user_id == current_user.id,
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
            detail=f"Destination port '{cargo.destination_port}' is not recognized in port specs",
        )

    return recommend_vessels(cargo, port, req.simulator_overrides)


@router.post(
    "/compatibility",
    response_model=PortCompatibilityResult,
    summary="Evaluate vessel berthing clearance at a destination port",
)
async def check_compatibility_endpoint(
    req: PortCompatibilityRequest,
    current_user: User = Depends(get_current_user),
) -> PortCompatibilityResult:
    """Verify laden draft, LOA, and beam against channel and quay restrictions."""
    vessel = VESSEL_SPECS.get(req.vessel_class_id.lower())
    if not vessel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel class '{req.vessel_class_id}' not found",
        )

    port = PORT_SPECS.get(req.port_id) or next(
        (p for p in PORT_SPECS.values() if p.id.lower() == req.port_id.lower()),
        None,
    )
    if not port:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Port '{req.port_id}' not found in port specifications",
        )

    return check_port_compatibility(vessel, port)
