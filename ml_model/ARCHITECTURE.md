# CharterMind System Architecture & Methodological Taxonomy

This document outlines the end-to-end data pipeline, system architecture, and honest methodological classification for the CharterMind Maritime Machine Learning project.

---

## 1. End-to-End ML Pipeline Flow

```
+---------------------------------------------------------------------------------------+
|                                  DATA INGESTION                                       |
|  - bdi_index_monthly.csv (308 monthly records, 1999-2024)                             |
|  - bdi_vessel_class_subindices.csv (3,022 daily observations, 4 vessel classes)       |
|  - india_eastcoast_port_specs.csv (7 major East Coast ports)                           |
|  - india_eastcoast_port_traffic_history.csv (10-year audited throughput)              |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                                PREPROCESSING & CLEANING                               |
|  - Datetime parsing and chronological sorting                                         |
|  - Null-handling and price float cleaning                                             |
|  - Anti-leakage boundary enforcement                                                  |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                         TIME-SERIES FEATURE ENGINEERING                               |
|  - Autoregressive Lags: lag_1, lag_2, lag_3, lag_6, lag_12                            |
|  - Rolling Moments on Shifted Series: rolling_mean_3, rolling_mean_6                  |
|  - Rolling Volatilities: rolling_std_3, rolling_std_6                                 |
|  - Return Dynamics: momentum_3, pct_change_1                                          |
|  - Seasonal Harmonics: sin_month, cos_month, quarter, month                           |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                                CHRONOLOGICAL VALIDATION                               |
|  - 5-Fold Walk-Forward Cross-Validation (TimeSeriesSplit)                             |
|  - Zero forward-looking lookahead bias                                                |
|  - Benchmarked against Naive Persistence, Seasonal Naive, Random Forest, & GBDT       |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                               MODEL TRAINING & ARTIFACTS                              |
|  - Closed-form Ridge Regression with L2 Regularization (alpha=10.0)                   |
|  - Calibrated Vessel Subindex Elasticity Inferences (BCI, BPI, BSI, BHI)              |
|  - Serialized Artifacts: bdi_forecast_model.joblib, model_metadata.json               |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                              FASTAPI INFERENCE LAYER                                  |
|  - app.main: FastAPI Application with CORS                                            |
|  - app.services.forecast_service (Recursive H-step forward forecast + CI bounds)       |
|  - app.services.vessel_service (Physical constraints + voyage economics)              |
|  - app.services.port_service (Traffic Z-scores & capacity utilization)                |
|  - app.services.idle_service (Pre-berthing queues & demurrage risk)                   |
|  - app.services.risk_service (Composite risk scoring & BIMCO clauses)                 |
|  - app.services.simulator_service (2D sensitivity matrix & what-if shocks)            |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                             STANDALONE CLIENTS & USERS                                |
|  - CLI Verification: python test_model.py                                             |
|  - Unit & Integration Tests: pytest tests/                                            |
|  - REST Clients (Swagger, Postman, curl, or decoupled frontend)                       |
+---------------------------------------------------------------------------------------+
```

---

## 2. Rigorous Component Classification

To uphold academic and engineering integrity for SIH evaluation, every analytical component in this system is explicitly classified into one of four distinct categories:

### A. REAL MACHINE LEARNING (Supervised Learning with Generalization)
Components that learn predictive weights from data, optimize a mathematical loss function, and execute `model.predict()` during inference:
1. **Baltic Dry Index Multi-Horizon Forecast**:
   - **Algorithm**: Ridge Regression ($L_2$ regularized linear model).
   - **Mechanism**: Learns feature coefficients $w_1 \dots w_{15}$ across 15 autoregressive and seasonal features.
   - **Artifact**: `ml_model/models/bdi_forecast_model.joblib`.
   - **Execution**: Direct `model.predict(feat_df)` inside `forecast_service.py` and `test_model.py`.
2. **Vessel Class Elasticity Subindex Models**:
   - **Algorithm**: Non-linear polynomial/logarithmic Ridge Regressors.
   - **Mechanism**: Learns elasticity mappings from aggregate BDI to Capesize, Panamax, Supramax, and Handysize indices ($R^2 > 0.999$).
   - **Artifact**: `ml_model/models/vessel_class_models.json`.

---

### B. STATISTICAL MODELING (Empirical Distributions & Moments)
Components derived from historical data distributions, confidence intervals, and standardized statistical deviations:
1. **Port Congestion Z-Score Engine**:
   - Standardizes the latest port cargo volume against its 10-year empirical mean and standard deviation:
     $$Z = \frac{X_{\text{latest}} - \mu_{10\text{yr}}}{\sigma_{10\text{yr}}}$$
   - Identifies statistical outliers indicating berth strain.
2. **Expanding Forecast Empirical Uncertainty Bounds**:
   - Computes dynamic confidence intervals using the walk-forward root-mean-squared error ($\text{RMSE}$) scaled by forecast horizon:
     $$\sigma_h = \text{RMSE}_{\text{cv}} \cdot \sqrt{h}$$
     $$\text{CI}_{80\%} = \hat{y}_h \pm 1.28 \cdot \sigma_h, \quad \text{CI}_{95\%} = \hat{y}_h \pm 1.96 \cdot \sigma_h$$

---

### C. RULE-BASED / DETERMINISTIC PHYSICS (Domain Calculations)
Components where physical laws, maritime safety regulations, or maritime contract terms dictate exact outcomes:
1. **Port Navigational Feasibility Engine**:
   - Evaluates physical vessel dimensions against port parameters:
     - Minimum Under-Keel Clearance (UKC): $\text{Draft} + 0.5\text{m} \le \text{Channel Depth}$
     - Length Overall (LOA) limit: $\text{LOA}_{\text{vessel}} \le \text{LOA}_{\text{port}}$
     - Beam clearance: $\text{Beam}_{\text{vessel}} \le \text{Beam}_{\text{port}}$
     - Deadweight limit: $\text{Cargo}_{\text{tonnes}} \le \text{DWT}_{\text{vessel}}$
2. **Voyage Economics & Bunker Fuel Engine**:
   - Deterministic calculations for steaming days, port loading days, fuel consumption (sea/port fuel burn $\times$ bunker price), and port dues.
3. **What-If Scenario Sensitivity Engine**:
   - Deterministic sensitivity matrix computing mathematical deltas for congestion %, bunker price shifts, and freight shocks.

---

### D. HYBRID SYSTEMS (Synthesized Decisions)
Components that deliberately combine ML predictions, statistical signals, and physical rules:
1. **Multi-Factor Voyage Risk Assessment Engine (`risk_service.py`)**:
   - **Market Risk (25%)**: ML Signal (predicted rate volatility & trend).
   - **Congestion Risk (30%)**: Statistical Signal (port throughput Z-scores).
   - **Physical Navigational Risk (25%)**: Rule-based (UKC and draft constraints).
   - **Weather Hazard Risk (20%)**: Domain logic (Bay of Bengal seasonal cyclone frequencies).
2. **Port Idle-Time & Demurrage Queueing Engine (`idle_service.py`)**:
   - Combines historical Port Authority pre-berthing detention averages with tidal wait penalties, seasonal monsoon multipliers, and vessel daily demurrage rates.
   - *Academic Transparency*: Documented clearly as hybrid/rule-based because individual vessel-by-vessel turnaround logs are not published in public port datasets.

---

## 3. Separation from Frontend

The `ml_model/` directory operates in total isolation:
- **No Node.js / Vite / React dependency**.
- **No browser DOM or localStorage dependencies**.
- Can be zipped and transferred to any Linux, macOS, or Windows machine running Python 3.10+.
- Serves any REST client via standard JSON payloads over HTTP on port 8000.
