"""
FastAPI Application Entrypoint for CharterMind Maritime Intelligence.
Exposes independent REST endpoints for freight forecasting, vessel optimization,
port statistics, idle-time queueing, risk analysis, and scenario simulation.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    HealthResponse,
    ForecastRequest,
    ForecastResponse,
    VesselRecommendationRequest,
    VesselRecommendationResponse,
    PortIntelligenceRequest,
    PortIntelligenceResponse,
    IdleTimeRequest,
    IdleTimeResponse,
    RiskRequest,
    RiskResponse,
    SimulatorRequest,
    SimulatorResponse,
)
from .services import (
    ForecastService,
    VesselService,
    PortService,
    IdleService,
    RiskService,
    SimulatorService,
)

app = FastAPI(
    title="CharterMind ML Engine API",
    description="Independent machine-learning and maritime intelligence service for SIH.",
    version="1.0.0",
)

# Enable CORS so any frontend (React on port 3000, etc.) can communicate seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service Instances
forecast_svc = ForecastService()
port_svc = PortService()
vessel_svc = VesselService(forecast_service=forecast_svc)
idle_svc = IdleService()
risk_svc = RiskService(port_service=port_svc, forecast_service=forecast_svc)
simulator_svc = SimulatorService()


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "ok",
        "models_loaded": {
            "bdi_forecast_model": forecast_svc.model is not None,
            "vessel_class_models": bool(forecast_svc.vessel_models),
            "port_profiles": bool(port_svc.profiles),
        },
        "version": "1.0.0",
    }


@app.get("/api/model-info")
def get_model_info():
    return forecast_svc.metadata


@app.get("/api/ports")
def list_ports():
    ports = port_svc.get_all_ports()
    return {"status": "success", "count": len(ports), "ports": ports}


@app.post("/api/forecast", response_model=ForecastResponse)
def get_forecast(req: ForecastRequest):
    try:
        return forecast_svc.generate_forecast(horizons_months=req.horizons_months)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/vessel-recommendations", response_model=VesselRecommendationResponse)
def get_vessel_recommendations(req: VesselRecommendationRequest):
    try:
        return vessel_svc.optimize_fleet(
            port_name=req.port_name,
            cargo_tonnes=req.cargo_tonnes,
            distance_nm=req.distance_nm,
            bunker_price_usd=req.bunker_price_usd,
            target_horizon_months=req.target_horizon_months,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/port-intelligence", response_model=PortIntelligenceResponse)
def get_port_intelligence(req: PortIntelligenceRequest):
    try:
        return port_svc.get_port_intelligence(port_name=req.port_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/idle-time", response_model=IdleTimeResponse)
def get_idle_time(req: IdleTimeRequest):
    try:
        return idle_svc.estimate_idle_time(
            port_name=req.port_name,
            vessel_draft_m=req.vessel_draft_m,
            vessel_class=req.vessel_class,
            month=req.month,
            weather_condition=req.weather_condition,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk", response_model=RiskResponse)
def get_risk_assessment(req: RiskRequest):
    try:
        return risk_svc.assess_risk(
            port_name=req.port_name,
            vessel_class=req.vessel_class,
            vessel_draft_m=req.vessel_draft_m,
            cargo_tonnes=req.cargo_tonnes,
            voyage_month=req.voyage_month,
            weather_condition=req.weather_condition,
            freight_hedge_status=req.freight_hedge_status,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulate", response_model=SimulatorResponse)
def run_simulation(req: SimulatorRequest):
    try:
        return simulator_svc.simulate_scenario(
            port_name=req.port_name,
            vessel_class=req.vessel_class,
            cargo_tonnes=req.cargo_tonnes,
            distance_nm=req.distance_nm,
            congestion_shock_pct=req.congestion_shock_pct,
            weather_shock=req.weather_shock,
            freight_rate_shock_pct=req.freight_rate_shock_pct,
            bunker_price_usd=req.bunker_price_usd,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
