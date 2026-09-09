# CharterMind Machine Learning & Backend System

This directory (`ml_model/`) is a **completely standalone, self-contained Machine Learning project** created for the SIH maritime freight intelligence challenge.

It contains **all datasets, feature engineering pipelines, training routines, trained model binaries, inference services, FastAPI endpoints, and automated tests** required to operate independently without requiring the React frontend or any JavaScript runtime.

---

## Folder Structure

```
ml_model/
├── data/
│   ├── bdi_index_monthly.csv             # 308 monthly BDI records (1999-2024)
│   ├── bdi_vessel_class_subindices.csv   # 3,022 daily records across 4 vessel classes
│   ├── india_eastcoast_port_specs.csv    # Navigational & physical port constraints
│   ├── india_eastcoast_port_traffic_history.csv # 10-year audited port throughput
│   ├── vessel_class_rate_ratio_reference.csv    # Benchmark DWT & rate multipliers
│   ├── bdi_index_daily_sample.csv        # Intraday sample readings
│   └── README.md                         # Detailed dataset catalog & schema
│
├── models/
│   ├── bdi_forecast_model.joblib         # Trained Ridge Regression model binary
│   ├── model_metadata.json               # Hyperparameters, feature importances & metrics
│   ├── vessel_class_models.json          # Elasticity weights for Capesize/Panamax/Supramax/Handysize
│   └── port_profiles.json                # Statistical traffic moments and detention days
│
├── training/
│   ├── feature_engineering.py            # Non-leaking time-series lags & rolling features
│   ├── train_forecast.py                 # Multi-horizon Ridge model training script
│   ├── train_vessel.py                   # Vessel class elasticity calibrator
│   └── evaluate_models.py                # Chronological benchmark vs. Naive & Tree baselines
│
├── app/
│   ├── main.py                           # Standalone FastAPI REST application with CORS
│   ├── schemas.py                        # Pydantic input/output validation schemas
│   └── services/
│       ├── forecast_service.py           # Multi-horizon recursive inference & CI bounds
│       ├── vessel_service.py             # Physical compatibility & voyage cost optimizer
│       ├── port_service.py               # Throughput statistics & congestion Z-scores
│       ├── idle_service.py               # Pre-berthing queueing & demurrage estimator
│       ├── risk_service.py               # 4-factor composite operational risk engine
│       └── simulator_service.py          # What-if scenario sensitivity engine
│
├── metrics/
│   └── metrics.json                      # Benchmark comparison metrics (MAE, RMSE, MAPE, R², DA)
│
├── tests/
│   ├── test_forecast.py                  # Unit tests for feature engineering & model inference
│   ├── test_vessel.py                    # Physical feasibility & economics verification
│   └── test_api.py                       # Integration tests for all FastAPI endpoints
│
├── test_model.py                         # Standalone command-line inference verification script
├── requirements.txt                      # Explicit Python dependencies
├── .env.example                          # Environment configuration template
├── README.md                             # Beginner-friendly setup & execution guide
├── MODEL_CARD.md                         # Formal SIH Model Card documentation
└── ARCHITECTURE.md                       # Architectural pipeline & classification document
```

---

## Quick Start Guide

### Windows (Command Prompt / PowerShell)

```cmd
:: 1. Navigate to the ML project folder
cd ml_model

:: 2. Create a virtual environment
python -m venv .venv

:: 3. Activate the virtual environment
.venv\Scripts\activate

:: 4. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

:: 5. Run independent CLI verification (Loads model & tests real inference)
python test_model.py

:: 6. Launch the standalone FastAPI backend
uvicorn app.main:app --reload --port 8000
```

### Linux / macOS (Terminal)

```bash
# 1. Navigate to the ML project folder
cd ml_model

# 2. Create a virtual environment
python3 -m venv .venv

# 3. Activate the virtual environment
source .venv/bin/activate

# 4. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 5. Run independent CLI verification
python3 test_model.py

# 6. Launch the standalone FastAPI backend
uvicorn app.main:app --reload --port 8000
```

---

## Testing & Verification

### 1. Command-Line Inference Test
Runs direct `model.predict()` without starting a web server:
```bash
python test_model.py
```

### 2. Automated Pytest Test Suite
Runs all 15 integration and unit tests:
```bash
pytest -v tests/
```

### 3. Interactive API Documentation
Once the server is running on port `8000`:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc UI: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Retraining Models from Scratch

All training routines run independently from the command line:

```bash
# Retrain the multi-horizon Freight Forecast Ridge model
python training/train_forecast.py

# Retrain vessel class elasticity subindex models
python training/train_vessel.py

# Run benchmark evaluation across competing algorithms against Naive baselines
python training/evaluate_models.py
```

---

## API Request Examples (curl / REST)

### 1. Health Check
```bash
curl -X GET http://127.0.0.1:8000/api/health
```

### 2. Multi-Horizon BDI Forecast (6 Months)
```bash
curl -X POST http://127.0.0.1:8000/api/forecast \
  -H "Content-Type: application/json" \
  -d '{"horizons_months": 6}'
```

### 3. Vessel Optimization & Port Feasibility
```bash
curl -X POST http://127.0.0.1:8000/api/vessel-recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "port_name": "Dhamra",
    "cargo_tonnes": 65000,
    "distance_nm": 2000,
    "bunker_price_usd": 620,
    "target_horizon_months": 1
  }'
```

### 4. Indian East Coast Port Intelligence
```bash
curl -X POST http://127.0.0.1:8000/api/port-intelligence \
  -H "Content-Type: application/json" \
  -d '{"port_name": "Paradip"}'
```

### 5. Port Idle-Time & Demurrage Risk
```bash
curl -X POST http://127.0.0.1:8000/api/idle-time \
  -H "Content-Type: application/json" \
  -d '{
    "port_name": "Paradip",
    "vessel_draft_m": 14.5,
    "vessel_class": "Panamax",
    "month": 7,
    "weather_condition": "Rough"
  }'
```

### 6. Voyage Risk Assessment
```bash
curl -X POST http://127.0.0.1:8000/api/risk \
  -H "Content-Type: application/json" \
  -d '{
    "port_name": "Paradip",
    "vessel_class": "Capesize",
    "vessel_draft_m": 17.5,
    "cargo_tonnes": 150000,
    "voyage_month": 11,
    "weather_condition": "Severe Storm",
    "freight_hedge_status": "Unhedged"
  }'
```

### 7. What-If Scenario Simulator
```bash
curl -X POST http://127.0.0.1:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "port_name": "Paradip",
    "vessel_class": "Panamax",
    "cargo_tonnes": 60000,
    "distance_nm": 2000,
    "congestion_shock_pct": 25.0,
    "weather_shock": "Rough",
    "freight_rate_shock_pct": 10.0,
    "bunker_price_usd": 680.0
  }'
```
