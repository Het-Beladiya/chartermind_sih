from typing import List, Optional, Union
from app.schemas.cargo import CargoRequestBase, CargoRequestResponse
from app.schemas.port import PortSpec
from app.schemas.vessel import PortCompatibilityResult, VesselScoreBreakdown, VesselSpec
from app.schemas.voyage import SimulatorOverrides
from app.utils.constants import ROUTE_BASELINE_RATES, VESSEL_RATE_MULTIPLIERS, VESSEL_SPECS


def check_port_compatibility(vessel: VesselSpec, port: PortSpec) -> PortCompatibilityResult:
    """
    Evaluate navigational and berthing constraints of a vessel at a destination port.
    
    Verifies draft clearance (water depth vs laden vessel draft), quay LOA clearance,
    and beam envelope (channel & gantry crane outreach).
    
    Returns:
        PortCompatibilityResult containing clearance booleans, safety margins, warnings,
        and an integer compatibility index (0-100).
    """
    draft_margin = round(port.max_draft - vessel.draft, 2)
    loa_margin = round(port.max_loa - vessel.loa, 2)
    beam_margin = round(port.max_beam - vessel.beam, 2)

    draft_ok = draft_margin >= 0.0
    loa_ok = loa_margin >= 0.0
    beam_ok = beam_margin >= 0.0

    is_compatible = draft_ok and loa_ok and beam_ok

    warnings: List[str] = []
    if not draft_ok:
        warnings.append(
            f"Vessel draft ({vessel.draft}m) exceeds {port.name} max draft ({port.max_draft}m) by {abs(draft_margin):.1f}m"
        )
    elif draft_margin < 1.0:
        warnings.append(f"Tight draft clearance ({draft_margin:.1f}m buffer at {port.name})")

    if not loa_ok:
        warnings.append(f"Vessel LOA ({vessel.loa}m) exceeds port limit ({port.max_loa}m)")
    if not beam_ok:
        warnings.append(f"Vessel beam ({vessel.beam}m) exceeds port crane envelope ({port.max_beam}m)")

    if is_compatible:
        score = 70.0
        if draft_margin > 2.0:
            score += 15.0
        elif draft_margin > 0.8:
            score += 8.0
        if loa_margin > 20.0:
            score += 10.0
        if beam_margin > 4.0:
            score += 5.0
    else:
        # Partial penalty score
        score = max(0.0, 40.0 - (0.0 if draft_ok else 30.0) - (0.0 if loa_ok else 10.0))

    return PortCompatibilityResult(
        is_compatible=is_compatible,
        score=min(100.0, float(round(score))),
        draft_fit=draft_ok,
        loa_fit=loa_ok,
        beam_fit=beam_ok,
        warnings=warnings,
    )


def score_vessel(
    vessel: VesselSpec,
    cargo: Union[CargoRequestBase, CargoRequestResponse],
    port: PortSpec,
    priority: str = "medium",
    overrides: Optional[SimulatorOverrides] = None,
) -> VesselScoreBreakdown:
    """
    Compute a multi-criteria recommendation score (0-100) for a given vessel class.
    
    Evaluates:
    1. Capacity Fit: Penalizes under-loading (paying for empty deadweight) and over-loading.
    2. Port Compatibility: Berthing constraints and safety clearances at destination port.
    3. Cost Competitiveness: Estimated per-ton freight vs market baseline and charter ceiling.
    4. Availability: Spot regional tonnage availability in the origin loading basin.
    5. Idle Time: Anchorage turnaround risk based on port congestion and draft.
    """
    compat = check_port_compatibility(vessel, port)
    qty = float(cargo.cargo_quantity_mt)

    # 1. Capacity Fit Score
    if qty < vessel.dwt_min:
        under_ratio = qty / vessel.dwt_min
        capacity_fit_score = max(20.0, float(round(under_ratio * 85.0)))
    elif qty > vessel.dwt_max:
        over_ratio = vessel.dwt_max / qty
        capacity_fit_score = max(10.0, float(round(over_ratio * 75.0)))
    else:
        # Within ideal range
        center_fit = 1.0 - abs(qty - vessel.dwt_avg) / (vessel.dwt_max - vessel.dwt_min)
        capacity_fit_score = float(round(85.0 + center_fit * 15.0))

    # 2. Port Compatibility Score
    port_score = compat.score if compat.is_compatible else 5.0

    # 3. Cost Competitiveness Score
    origin = cargo.origin_country
    dest = cargo.destination_port
    base_rate = ROUTE_BASELINE_RATES.get(origin, {}).get(dest, 18.0)
    rate_multiplier = VESSEL_RATE_MULTIPLIERS.get(vessel.id.lower(), 1.0)

    # Quantity scale discount
    scale_discount = min(0.08, max(0.0, (qty - 30000.0) / 300000.0 * 0.08))
    estimated_freight_per_mt = round(base_rate * rate_multiplier * (1.0 - scale_discount), 2)

    if overrides and overrides.freight_rate_offset_percent:
        estimated_freight_per_mt = round(
            estimated_freight_per_mt * (1.0 + overrides.freight_rate_offset_percent / 100.0), 2
        )

    estimated_total_freight = round(estimated_freight_per_mt * qty, 2)

    max_freight = float(cargo.max_acceptable_freight) if cargo.max_acceptable_freight else base_rate * 1.3
    cost_ratio = estimated_freight_per_mt / max_freight if max_freight > 0 else 1.0
    cost_competitiveness_score = min(100.0, max(15.0, float(round((1.4 - cost_ratio) * 100.0))))

    # 4. Availability Score
    avail_status = overrides.vessel_availability if overrides and overrides.vessel_availability else vessel.availability
    if avail_status == "Limited":
        availability_score = 65.0
    elif avail_status == "Scarce":
        availability_score = 25.0
    else:
        availability_score = 95.0

    # 5. Idle Time Score
    port_congestion = overrides.congestion if overrides and overrides.congestion else port.congestion
    idle_time_score = 80.0
    if port_congestion in ("High", "Critical"):
        idle_time_score -= 30.0
    if not compat.is_compatible:
        idle_time_score = 10.0
    elif (port.max_draft - vessel.draft) < 1.0:
        idle_time_score -= 15.0

    # Dynamic Weighting Allocation
    norm_priority = (priority or "medium").lower().replace("_", " ")
    if "lowest cost" in norm_priority or "cost" in norm_priority or norm_priority == "low":
        w_cost, w_cap, w_port, w_avail, w_idle = 0.45, 0.20, 0.20, 0.08, 0.07
    elif "fastest" in norm_priority or "speed" in norm_priority or norm_priority in ("critical", "high"):
        w_avail, w_idle, w_port, w_cap, w_cost = 0.30, 0.25, 0.25, 0.10, 0.10
    elif "lowest risk" in norm_priority or "risk" in norm_priority:
        w_port, w_avail, w_idle, w_cap, w_cost = 0.40, 0.25, 0.20, 0.10, 0.05
    else:
        w_cap, w_port, w_cost, w_avail, w_idle = 0.20, 0.30, 0.25, 0.15, 0.10

    final_score = (
        capacity_fit_score * w_cap
        + port_score * w_port
        + cost_competitiveness_score * w_cost
        + availability_score * w_avail
        + idle_time_score * w_idle
    )

    if not compat.is_compatible:
        final_score = min(final_score, 28.0)  # Incompatible vessels cannot rank high

    final_score = min(99.0, max(12.0, float(round(final_score))))

    # Commercial and Operational Reasons
    reasons: List[str] = []
    draft_margin = round(port.max_draft - vessel.draft, 1)
    if compat.is_compatible and compat.score >= 80.0:
        reasons.append(f"Optimal physical compatibility with {port.name} ({draft_margin}m draft safety margin)")
    if capacity_fit_score >= 85.0:
        reasons.append(f"Perfect parcel fit for {int(qty):,} MT cargo with minimal deadweight waste")
    if cost_competitiveness_score >= 80.0:
        savings = int(round((base_rate * 1.2 - estimated_freight_per_mt) * qty))
        reasons.append(f"Competitive freight economy at ${estimated_freight_per_mt}/MT, saving ~${savings:,} vs spot alternatives")
    if avail_status == "Available":
        reasons.append(f"Prompt regional fleet availability in the {cargo.origin_country} loading basin")
    if not compat.is_compatible:
        reasons.append(f"Physical berth constraint: Draft/LOA exceeds {port.name} limitations")

    return VesselScoreBreakdown(
        vessel=vessel,
        final_score=final_score,
        capacity_fit_score=capacity_fit_score,
        port_compatibility_score=port_score,
        cost_competitiveness_score=cost_competitiveness_score,
        availability_score=availability_score,
        idle_time_score=idle_time_score,
        is_best_choice=False,
        compatibility=compat,
        reasons=reasons,
        estimated_freight_per_mt=estimated_freight_per_mt,
        estimated_total_freight=estimated_total_freight,
    )


def recommend_vessels(
    cargo: Union[CargoRequestBase, CargoRequestResponse],
    port: PortSpec,
    overrides: Optional[SimulatorOverrides] = None,
) -> List[VesselScoreBreakdown]:
    """
    Evaluate and rank all 4 commercial vessel classes (Capesize, Panamax, Supramax, Handysize)
    for a specific cargo shipment and discharge port.
    
    Returns:
        Sorted list of VesselScoreBreakdown in descending order of score, with the top vessel
        flagged as `is_best_choice = True`.
    """
    scored: List[VesselScoreBreakdown] = [
        score_vessel(vessel, cargo, port, cargo.priority, overrides)
        for vessel in VESSEL_SPECS.values()
    ]

    # Sort descending by final score
    scored.sort(key=lambda s: s.final_score, reverse=True)

    if scored:
        scored[0].is_best_choice = True

    return scored
