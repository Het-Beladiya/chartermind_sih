import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.cargo_request import CargoRequest
from app.models.user import User
from app.schemas.cargo import (
    CargoRequestCreate,
    CargoRequestResponse,
    CargoRequestUpdate,
)

router = APIRouter(prefix="/cargo", tags=["Cargo Demand Management"])


@router.post(
    "",
    response_model=CargoRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new cargo shipping request",
)
async def create_cargo_request(
    cargo_in: CargoRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CargoRequest:
    """Register a new bulk cargo parcel requirement in PostgreSQL for the current charterer."""
    cargo = CargoRequest(
        user_id=current_user.id,
        cargo_type=cargo_in.cargo_type,
        cargo_quantity_mt=cargo_in.cargo_quantity_mt,
        origin_country=cargo_in.origin_country,
        destination_port=cargo_in.destination_port,
        required_delivery_date=cargo_in.required_delivery_date,
        loading_window_start=cargo_in.loading_window_start,
        loading_window_end=cargo_in.loading_window_end,
        discharge_window_start=cargo_in.discharge_window_start,
        discharge_window_end=cargo_in.discharge_window_end,
        preferred_vessel_type=cargo_in.preferred_vessel_type,
        max_acceptable_freight=cargo_in.max_acceptable_freight,
        number_of_voyages=cargo_in.number_of_voyages,
        contract_duration=cargo_in.contract_duration,
        priority=cargo_in.priority,
        status="active",
    )
    db.add(cargo)
    await db.commit()
    await db.refresh(cargo)
    return cargo


@router.get(
    "",
    response_model=List[CargoRequestResponse],
    summary="List all cargo requests for current user",
)
async def list_cargo_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[CargoRequest]:
    """Retrieve all active and completed cargo requests belonging to the authenticated user."""
    stmt = (
        select(CargoRequest)
        .where(
            CargoRequest.user_id == current_user.id,
            CargoRequest.status != "deleted",
        )
        .order_by(desc(CargoRequest.created_at))
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/{cargo_id}",
    response_model=CargoRequestResponse,
    summary="Get details of a specific cargo request",
)
async def get_cargo_request(
    cargo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CargoRequest:
    """Fetch cargo parcel details by UUID. Must belong to the current authenticated user."""
    stmt = select(CargoRequest).where(
        CargoRequest.id == cargo_id,
        CargoRequest.user_id == current_user.id,
        CargoRequest.status != "deleted",
    )
    result = await db.execute(stmt)
    cargo = result.scalar_one_or_none()
    if not cargo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cargo request {cargo_id} not found or access denied",
        )
    return cargo


@router.put(
    "/{cargo_id}",
    response_model=CargoRequestResponse,
    summary="Update an existing cargo request",
)
async def update_cargo_request(
    cargo_id: uuid.UUID,
    update_data: CargoRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CargoRequest:
    """Modify parameters of an existing cargo demand parcel."""
    stmt = select(CargoRequest).where(
        CargoRequest.id == cargo_id,
        CargoRequest.user_id == current_user.id,
        CargoRequest.status != "deleted",
    )
    result = await db.execute(stmt)
    cargo = result.scalar_one_or_none()
    if not cargo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cargo request {cargo_id} not found",
        )

    # Apply non-null updates
    for field, value in update_data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(cargo, field, value)

    await db.commit()
    await db.refresh(cargo)
    return cargo


@router.delete(
    "/{cargo_id}",
    summary="Soft delete a cargo request",
)
async def delete_cargo_request(
    cargo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Flag a cargo request as 'deleted' (soft delete)."""
    stmt = select(CargoRequest).where(
        CargoRequest.id == cargo_id,
        CargoRequest.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    cargo = result.scalar_one_or_none()
    if not cargo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cargo request {cargo_id} not found",
        )

    cargo.status = "deleted"
    await db.commit()
    return {"status": "success", "message": f"Cargo request {cargo_id} has been deleted"}
