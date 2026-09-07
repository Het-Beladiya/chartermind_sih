import math
import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.freight_rate import FreightRate
from app.models.port_snapshot import PortSnapshot
from app.models.user import User
from app.utils.constants import PORT_SPECS, ROUTE_BASELINE_RATES

router = APIRouter(prefix="/seed", tags=["Development & Database Seeding"])


@router.post(
    "/freight-rates",
    summary="Seed historical 90-day freight rates for all corridors (Dev/Debug)",
)
async def seed_freight_rates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Populates the freight_rates table with 90 days of daily historical benchmark observations
    across all 5 origins (Australia, Indonesia, South Africa, Mozambique, Russia) and
    all 5 East Coast Indian discharge ports.
    """
    if not settings.DEBUG and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database seeding is only permitted in DEBUG mode or by superusers",
        )

    # Clear existing seed data
    await db.execute(delete(FreightRate))

    today = date.today()
    rng = random.Random(42)  # Deterministic seed for reproducible testing
    records_count = 0

    commodities = {
        "Australia": "Coal",
        "Indonesia": "Coal",
        "South Africa": "Coal",
        "Mozambique": "Coal",
        "Russia": "Coal",
    }

    for origin, dest_map in ROUTE_BASELINE_RATES.items():
        cargo_type = commodities.get(origin, "Coal")
        for dest, base_rate in dest_map.items():
            route_label = f"{origin} → {dest}"
            current_val = base_rate * 0.94

            for days_back in range(90, 0, -1):
                rec_date = today - timedelta(days=days_back)
                # Small daily drift
                drift = (math.sin(days_back / 7.0) * 0.22) + ((rng.random() - 0.48) * 0.28)
                current_val = max(6.0, round(current_val + drift, 2))

                fr = FreightRate(
                    route=route_label,
                    origin=origin,
                    destination=dest,
                    cargo_type=cargo_type,
                    rate_usd_per_mt=Decimal(str(current_val)),
                    date=rec_date,
                    source="Baltic Exchange Index Feed",
                )
                db.add(fr)
                records_count += 1

    await db.commit()
    return {
        "status": "success",
        "message": f"Successfully seeded {records_count} historical freight rate records.",
        "days": 90,
        "routes": len(ROUTE_BASELINE_RATES) * 5,
    }


@router.post(
    "/port-snapshots",
    summary="Seed live port congestion snapshots for all 5 ports (Dev/Debug)",
)
async def seed_port_snapshots(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Populates port_snapshots with current operational congestion, berthing queues,
    and handling rates derived from port specifications.
    """
    if not settings.DEBUG and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database seeding is only permitted in DEBUG mode or by superusers",
        )

    # Clear previous snapshots
    await db.execute(delete(PortSnapshot))

    now = datetime.now(timezone.utc)
    for port in PORT_SPECS.values():
        snap = PortSnapshot(
            port_id=port.id,
            congestion_level=port.congestion,
            berthing_wait_days=Decimal(str(port.berthing_wait_days)),
            handling_rate_mt_per_day=Decimal(str(port.handling_rate_mt_per_day)),
            weather_risk=port.weather_risk,
            recorded_at=now,
        )
        db.add(snap)

    await db.commit()
    return {
        "status": "success",
        "message": f"Successfully seeded {len(PORT_SPECS)} port operational snapshots.",
        "ports": list(PORT_SPECS.keys()),
    }
