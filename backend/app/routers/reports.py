import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.report import Report
from app.models.user import User
from app.models.voyage_plan import VoyagePlan
from app.schemas.report import ReportResponse, ReportType

router = APIRouter(prefix="/reports", tags=["Reports & Export Analytics"])


class GenerateReportRequest(BaseModel):
    voyage_plan_id: Optional[uuid.UUID] = Field(None, description="Linked voyage plan ID")
    report_type: ReportType = Field("voyage_cost", description="voyage_cost, forecast, risk, contract")
    title: str = Field(..., description="Report title")


@router.post(
    "/generate",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate and archive a full maritime dossier report",
)
async def generate_report_endpoint(
    req: GenerateReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Report:
    """
    Synthesize voyage calculations, freight benchmarks, and operational risk factors
    into a comprehensive JSON report and store in PostgreSQL.
    """
    content_payload: Dict[str, Any] = {
        "report_type": req.report_type,
        "title": req.title,
        "generated_by": current_user.name or current_user.email,
        "company": current_user.company,
    }

    if req.voyage_plan_id:
        stmt = (
            select(VoyagePlan)
            .options(selectinload(VoyagePlan.cargo_request))
            .where(
                VoyagePlan.id == req.voyage_plan_id,
                VoyagePlan.user_id == current_user.id,
            )
        )
        result = await db.execute(stmt)
        plan = result.scalar_one_or_none()
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Voyage plan {req.voyage_plan_id} not found",
            )

        content_payload["voyage_plan"] = {
            "id": str(plan.id),
            "vessel_class": plan.final_vessel_class,
            "freight_cost_usd": float(plan.freight_cost_usd),
            "total_cost_usd": float(plan.total_cost_usd),
            "total_cost_inr": float(plan.total_cost_inr),
            "cost_per_mt_usd": float(plan.cost_per_mt_usd),
            "freight_rate_per_mt": float(plan.freight_rate_per_mt),
            "expected_idle_hours": float(plan.expected_idle_hours),
            "risk_score_overall": float(plan.risk_score_overall),
            "risk_bucket": plan.risk_bucket,
        }
        if plan.cargo_request:
            content_payload["cargo"] = {
                "id": str(plan.cargo_request.id),
                "type": plan.cargo_request.cargo_type,
                "quantity_mt": float(plan.cargo_request.cargo_quantity_mt),
                "origin": plan.cargo_request.origin_country,
                "destination": plan.cargo_request.destination_port,
            }

    report = Report(
        user_id=current_user.id,
        voyage_plan_id=req.voyage_plan_id,
        title=req.title,
        report_type=req.report_type,
        content_json=content_payload,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.get(
    "",
    response_model=List[ReportResponse],
    summary="List all generated reports for current user",
)
async def list_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Report]:
    """Retrieve all archived reports for the authenticated user ordered by generated_at DESC."""
    stmt = (
        select(Report)
        .where(Report.user_id == current_user.id)
        .order_by(desc(Report.generated_at))
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/{report_id}",
    response_model=ReportResponse,
    summary="Get details and structured content of a specific report",
)
async def get_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Report:
    """Fetch complete JSON payload of an archived report."""
    stmt = select(Report).where(
        Report.id == report_id,
        Report.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found",
        )
    return report
