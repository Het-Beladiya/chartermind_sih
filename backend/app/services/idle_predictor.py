from typing import List, Optional
from app.schemas.idle import IdleFactor, IdlePredictionResult
from app.schemas.port import PortSpec
from app.schemas.vessel import PortCompatibilityResult, VesselSpec
from app.schemas.voyage import CongestionLevel, WeatherCondition
from app.services.vessel_scorer import check_port_compatibility


def predict_idle_time(
    port: PortSpec,
    vessel: VesselSpec,
    weather: Optional[WeatherCondition] = "Normal",
    congestion: Optional[CongestionLevel] = None,
    compat: Optional[PortCompatibilityResult] = None,
) -> IdlePredictionResult:
    """
    Predict vessel anchorage idle waiting time, turnaround hours, and demurrage exposure costs.
    
    Considers:
    - Port baseline waiting queue days
    - Active or simulated congestion level adjustments
    - Marine swell and severe weather allowances
    - Berth compatibility, tidal windows, and draft safety margins
    - Mechanized cargo conveyor handling discharge speed
    """
    if compat is None:
        compat = check_port_compatibility(vessel, port)

    active_congestion = congestion or port.congestion
    active_weather = weather or "Normal"

    base_hours = port.berthing_wait_days * 24.0
    factors: List[IdleFactor] = []

    # 1. Congestion adjustment
    if active_congestion == "Low":
        congestion_hours = -8.0
    elif active_congestion == "Medium":
        congestion_hours = 12.0
    elif active_congestion == "High":
        congestion_hours = 36.0
    elif active_congestion == "Critical":
        congestion_hours = 64.0
    else:
        congestion_hours = 0.0

    factors.append(
        IdleFactor(
            name=f"Port Congestion ({active_congestion})",
            impact="Low" if active_congestion == "Low" else "Medium" if active_congestion == "Medium" else "High",
            hours=abs(congestion_hours),
            direction="up" if congestion_hours >= 0 else "down",
        )
    )

    # 2. Weather adjustment
    if active_weather == "Rough":
        weather_hours = 16.0
    elif active_weather == "Severe":
        weather_hours = 44.0
    else:
        weather_hours = 0.0

    factors.append(
        IdleFactor(
            name=f"Weather Conditions ({active_weather})",
            impact="Low" if active_weather == "Normal" else "Medium" if active_weather == "Rough" else "High",
            hours=weather_hours,
            direction="up" if weather_hours > 0 else "down",
        )
    )

    # 3. Berth compatibility & draft clearance
    draft_margin = port.max_draft - vessel.draft
    if not compat.is_compatible:
        berth_hours = 48.0
    elif draft_margin < 1.0:
        berth_hours = 14.0
    else:
        berth_hours = -6.0

    factors.append(
        IdleFactor(
            name="Berth Compatibility & Draft Buffer",
            impact="High" if abs(berth_hours) > 20 else "Low",
            hours=abs(berth_hours),
            direction="up" if berth_hours >= 0 else "down",
        )
    )

    # 4. Port handling discharge efficiency
    if port.handling_rating >= 4.5:
        handling_hours = -18.0
        handling_label = "Very High"
    elif port.handling_rating <= 3.0:
        handling_hours = 14.0
        handling_label = "Moderate"
    else:
        handling_hours = -8.0
        handling_label = "High"

    factors.append(
        IdleFactor(
            name=f"Port Handling Rate ({handling_label})",
            impact="Medium",
            hours=abs(handling_hours),
            direction="up" if handling_hours >= 0 else "down",
        )
    )

    total_idle_hours = max(6.0, round(base_hours + congestion_hours + weather_hours + berth_hours + handling_hours, 1))
    idle_cost_usd = round(total_idle_hours * vessel.hourly_rate, 2)

    days_str = round(total_idle_hours / 24.0, 1)
    explanation = (
        f"Estimated waiting buffer is {total_idle_hours} hours (~{days_str} days) at {port.name}, "
        f"primarily influenced by {active_congestion.lower()} queue wait and {handling_label.lower()} crane turnaround."
    )

    return IdlePredictionResult(
        expected_idle_hours=total_idle_hours,
        idle_cost_usd=idle_cost_usd,
        factors=factors,
        explanation=explanation,
    )
