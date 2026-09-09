"""
What-If Voyage Scenario & Market Shock Simulation Service.
Runs deterministic scenario shocks (congestion %, weather, rate shifts, fuel prices)
against baseline voyage economics, computing cost deltas and a 2D sensitivity matrix.
"""

from typing import Dict, Any, List


class SimulatorService:
    def simulate_scenario(
        self,
        port_name: str,
        vessel_class: str,
        cargo_tonnes: float,
        distance_nm: float,
        congestion_shock_pct: float = 0.0,
        weather_shock: str = "Normal",
        freight_rate_shock_pct: float = 0.0,
        bunker_price_usd: float = 620.0,
    ) -> Dict[str, Any]:
        # Reference vessel specs
        speeds = {"Capesize": 13.0, "Panamax": 14.0, "Supramax": 13.5, "Handysize": 12.5}
        fuel_rates = {"Capesize": 46.0, "Panamax": 28.0, "Supramax": 23.0, "Handysize": 16.0}
        port_fuel_rates = {"Capesize": 4.5, "Panamax": 3.0, "Supramax": 2.5, "Handysize": 1.5}
        base_charter_rates = {"Capesize": 25000.0, "Panamax": 17500.0, "Supramax": 14500.0, "Handysize": 11000.0}

        speed = speeds.get(vessel_class, 13.0)
        fuel_burn = fuel_rates.get(vessel_class, 25.0)
        port_fuel_burn = port_fuel_rates.get(vessel_class, 2.5)
        base_rate = base_charter_rates.get(vessel_class, 16000.0)

        # Baseline Voyage
        base_sea_days = (distance_nm / (speed * 24.0)) * 1.05
        base_port_days = max(2.5, (cargo_tonnes / 12000.0) + 1.5)
        base_total_days = base_sea_days + base_port_days

        base_fuel_cost = ((base_sea_days * fuel_burn) + (base_port_days * port_fuel_burn)) * 620.0
        base_charter_cost = base_total_days * base_rate
        base_port_dues = 38000.0
        base_total_cost = base_fuel_cost + base_charter_cost + base_port_dues
        base_cost_per_tonne = base_total_cost / cargo_tonnes if cargo_tonnes > 0 else 0.0

        # Shocked Scenario
        weather_multipliers = {"Normal": 1.0, "Calm": 0.95, "Rough": 1.25, "Severe Storm": 1.65}
        weather_factor = weather_multipliers.get(weather_shock, 1.0)

        shocked_sea_days = base_sea_days * weather_factor
        shocked_port_days = base_port_days * (1.0 + (congestion_shock_pct / 100.0))
        if weather_shock in ["Rough", "Severe Storm"]:
            shocked_port_days += 1.5  # Port closure delay

        shocked_total_days = shocked_sea_days + shocked_port_days
        shocked_charter_rate = base_rate * (1.0 + (freight_rate_shock_pct / 100.0))

        shocked_fuel_cost = (
            (shocked_sea_days * fuel_burn) + (shocked_port_days * port_fuel_burn)
        ) * bunker_price_usd
        shocked_charter_cost = shocked_total_days * shocked_charter_rate
        shocked_total_cost = shocked_fuel_cost + shocked_charter_cost + base_port_dues
        shocked_cost_per_tonne = shocked_total_cost / cargo_tonnes if cargo_tonnes > 0 else 0.0

        # Deltas
        delta = {
            "additional_days": round(shocked_total_days - base_total_days, 1),
            "additional_cost_usd": round(shocked_total_cost - base_total_cost, 0),
            "cost_change_pct": round(((shocked_total_cost - base_total_cost) / (base_total_cost + 1e-6)) * 100.0, 1),
            "delta_freight_per_tonne": round(shocked_cost_per_tonne - base_cost_per_tonne, 2),
        }

        # 2D Sensitivity Matrix (Rate Shock vs Congestion Shock)
        rate_shifts = [-20, -10, 0, 10, 20]
        congestion_shifts = [-20, 0, 25, 50]
        sensitivity_matrix = []

        for r_shift in rate_shifts:
            row_data = {"rate_shock_pct": r_shift}
            for c_shift in congestion_shifts:
                s_port = base_port_days * (1.0 + (c_shift / 100.0))
                s_days = base_sea_days + s_port
                s_rate = base_rate * (1.0 + (r_shift / 100.0))
                s_fuel = ((base_sea_days * fuel_burn) + (s_port * port_fuel_burn)) * bunker_price_usd
                s_total = s_fuel + (s_days * s_rate) + base_port_dues
                s_cpt = s_total / cargo_tonnes if cargo_tonnes > 0 else 0.0
                row_data[f"c_{c_shift}_cost_per_t"] = round(s_cpt, 2)
            sensitivity_matrix.append(row_data)

        return {
            "status": "success",
            "baseline": {
                "sea_days": round(base_sea_days, 1),
                "port_days": round(base_port_days, 1),
                "total_voyage_days": round(base_total_days, 1),
                "fuel_cost_usd": round(base_fuel_cost, 0),
                "charter_cost_usd": round(base_charter_cost, 0),
                "total_voyage_cost_usd": round(base_total_cost, 0),
                "cost_per_tonne_usd": round(base_cost_per_tonne, 2),
            },
            "shocked": {
                "sea_days": round(shocked_sea_days, 1),
                "port_days": round(shocked_port_days, 1),
                "total_voyage_days": round(shocked_total_days, 1),
                "fuel_cost_usd": round(shocked_fuel_cost, 0),
                "charter_cost_usd": round(shocked_charter_cost, 0),
                "total_voyage_cost_usd": round(shocked_total_cost, 0),
                "cost_per_tonne_usd": round(shocked_cost_per_tonne, 2),
            },
            "delta": delta,
            "sensitivity_matrix": sensitivity_matrix,
        }
