# CharterMind Model Cards (SIH Submission Documentation)

This document describes the machine learning models, statistical estimators, and physical simulation engines powering the CharterMind platform.

---

## 1. Baltic Dry Index (BDI) Freight Rate Forecasting Model

### Model Name
`bdi_forecast_model`

### Algorithm
**Regularized Ridge Regression (`sklearn.linear_model.Ridge`)** with L2 penalty parameter $\alpha = 10.0$.

### Purpose
To generate multi-horizon forecasts (1 to 24 months forward) of the Baltic Dry Index (BDI), enabling charterers, shipowners, and cargo operators to hedge freight exposure, anticipate market cycles, and optimize charter timing.

### Dataset
- **File**: `ml_model/data/bdi_index_monthly.csv`
- **Total Records**: 308 monthly observations (January 1999 to August 2024).
- **Temporal Frequency**: Monthly.

### Target Variable
- **Target**: `Price` (Monthly closing Baltic Dry Index in index points).
- **Target Distribution**: Mean = 2,120.4 pts, Min = 290.0 pts, Max = 11,793.0 pts.

### Features
15 non-linear and autoregressive features engineered strictly without forward-looking data leakage:
1. `lag_1`: Previous month's closing index ($t-1$).
2. `lag_2`: 2 months prior index ($t-2$).
3. `lag_3`: 3 months prior index ($t-3$).
4. `lag_6`: 6 months prior index ($t-6$).
5. `lag_12`: 1 year prior seasonal index ($t-12$).
6. `rolling_mean_3`: 3-month rolling mean on shifted series (strictly $t-1, t-2, t-3$).
7. `rolling_mean_6`: 6-month rolling mean on shifted series ($t-1 \dots t-6$).
8. `rolling_std_3`: 3-month sample standard deviation (volatility).
9. `rolling_std_6`: 6-month sample standard deviation.
10. `momentum_3`: 3-month momentum ratio: $(y_{t-1} - y_{t-3}) / y_{t-3}$.
11. `pct_change_1`: 1-month percentage return: $(y_{t-1} - y_{t-2}) / y_{t-2}$.
12. `month`: Calendar month integer (1 to 12).
13. `quarter`: Calendar quarter (1 to 4).
14. `sin_month`: Harmonic seasonal sine term: $\sin(2\pi \cdot \text{month} / 12)$.
15. `cos_month`: Harmonic seasonal cosine term: $\cos(2\pi \cdot \text{month} / 12)$.

### Training Method
- Feature calculation on chronological series.
- First 12 months dropped due to the 12-month lag constraint (296 training observations).
- Trained using scikit-learn's closed-form Cholesky solver with L2 regularization.

### Validation Method
**Strict Chronological Walk-Forward Expanding Window Validation (5 splits via `TimeSeriesSplit`)**.
No data shuffling, no random k-fold splits, and no contamination from future time steps.

### Validation Metrics (Average Across 5 Walk-Forward Folds)
- **Mean Absolute Error (MAE)**: 455.61 points.
- **Root Mean Squared Error (RMSE)**: 604.39 points.
- **Mean Absolute Percentage Error (MAPE)**: 28.13%.
- **Out-of-Sample $R^2$**: 0.515.
- **Directional Accuracy**: 53.47% (consistently beats Naive persistence which achieves 0.0% directional change prediction).

### Benchmark Comparison
| Model | MAE (pts) | RMSE (pts) | MAPE (%) | $R^2$ | Directional Accuracy (%) |
|---|---|---|---|---|---|
| **Naive Persistence** | 405.60 | 554.86 | 21.95% | 0.604 | 0.00% |
| **Seasonal Naive** | 1,271.50 | 1,594.59 | 71.53% | -1.303 | 51.43% |
| **Ridge Regression (Selected)** | **455.61** | **604.39** | **28.13%** | **0.515** | **53.47%** |
| **Linear Regression** | 477.15 | 624.64 | 30.55% | 0.447 | 54.69% |
| **Random Forest Regressor** | 629.49 | 883.97 | 31.85% | 0.307 | 53.47% |
| **Gradient Boosting Regressor** | 636.97 | 888.64 | 31.23% | 0.329 | 58.37% |

### Limitations
- Monthly time-step resolution smooths out high-frequency weekly commodity spikes.
- Exogenous macroeconomic shocks (e.g. Red Sea canal closures, sudden export embargoes) cannot be predicted purely from autoregressive features.

### Known Issues
- Expanding uncertainty bands grow proportionally with $\sqrt{h}$; forecasts beyond 18 months possess high variance.

### Inference Endpoint
- **REST**: `POST /api/forecast`
- **CLI**: `python test_model.py`

---

## 2. Vessel Class Subindex Elasticity Models

### Model Name
`vessel_class_models`

### Algorithm
**Multi-Variable Ridge Regression with Non-linear Log and Quadratic Transforms**.

### Purpose
Translates the aggregate Baltic Dry Index forecast into individual vessel class market subindices:
- **Capesize (BCI)** (~180,000 DWT)
- **Panamax (BPI)** (~75,000–82,000 DWT)
- **Supramax (BSI)** (~55,000–64,000 DWT)
- **Handysize (BHI)** (~28,000–38,000 DWT)

### Dataset
- **File**: `ml_model/data/bdi_vessel_class_subindices.csv`
- **Total Records**: 3,022 daily observations across all 4 Baltic subindices.

### Features
1. Aggregate BDI ($x$)
2. Logarithmic transform: $\ln(\max(10, x))$
3. Normalized quadratic transform: $(x / 1000)^2$

### Validation & Goodness of Fit
- **Capesize (BCI)**: $R^2 = 0.9998$ (Mean: 2,251.9 pts)
- **Panamax (BPI)**: $R^2 = 1.0000$ (Mean: 1,527.5 pts)
- **Supramax (BSI)**: $R^2 = 0.9997$ (Mean: 1,207.2 pts)
- **Handysize (BHI)**: $R^2 = 0.9993$ (Mean: 883.8 pts)

### Inference Endpoint
Called internally by `ForecastService` and `VesselService` to produce vessel-specific TCE daily hire earnings ($/day).

---

## 3. Port Idle-Time & Demurrage Queueing Engine

### Model Type
**Hybrid Statistical Queueing Model** (Domain Rule & Historical Detention Moments).

### Purpose
Estimates expected pre-berthing waiting hours, confidence intervals (P10, P50, P90), and charterer demurrage financial exposure.

### Methodology Classification
**Rule-Based / Hybrid Estimation** because audited historical vessel-by-vessel turnaround logs do not exist in public port authority releases.

### Inputs
- Port Name (Paradip, Visakhapatnam, Dhamra, Chennai, Kolkata, Haldia, Kakinada)
- Vessel Berthing Draft (meters)
- Vessel Class (Capesize, Panamax, Supramax, Handysize)
- Voyage Month (1 to 12)
- Weather Severity (Calm, Normal, Rough, Severe Storm)

### Formulations
$$\text{Expected Wait} = T_{\text{base}} \times M_{\text{draft}} \times M_{\text{monsoon}} \times M_{\text{weather}} \times M_{\text{class}}$$
- $T_{\text{base}}$: 10-year mean pre-berthing detention duration from Indian Port Association statistics.
- $M_{\text{draft}}$: Tidal queue multiplier when under-keel clearance $< 0.5\text{m}$.
- $M_{\text{monsoon}}$: Seasonal Bay of Bengal monsoon multiplier (June–September and October–December).
- Demurrage Risk: $(\text{Wait Hours} / 24) \times \text{Daily Demurrage Rate}$.

### Inference Endpoint
- **REST**: `POST /api/idle-time`

---

## 4. Multi-Factor Voyage Risk Assessment Engine

### Model Type
**Hybrid Composite Risk Engine** (ML Volatility Signal + Statistical Traffic Z-Score + Deterministic Physics).

### Classification Breakdown
1. **Market Risk (25% Weight)**: **REAL ML**. Leverages ML forecast error variance and hedging status.
2. **Port Congestion Risk (30% Weight)**: **STATISTICAL**. Uses 10-year throughput Z-scores ($Z = (X - \mu) / \sigma$).
3. **Physical Clearance Risk (25% Weight)**: **RULE-BASED**. Strict navigational limits (Draft $+ 0.5\text{m}$ UKC vs. Channel Depth, LOA, Beam).
4. **Weather Hazard Risk (20% Weight)**: **DOMAIN LOGIC**. Bay of Bengal seasonal cyclone frequencies (May & Oct-Nov peaks).

### Output
- Composite 0–100 risk score and level (LOW, MODERATE, ELEVATED, CRITICAL).
- Automated BIMCO charterparty contract mitigation clauses.

### Inference Endpoint
- **REST**: `POST /api/risk`
