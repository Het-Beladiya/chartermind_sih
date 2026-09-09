"""
Tests for Freight Forecast Feature Engineering and Model Inference.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest
import joblib

from training.feature_engineering import (
    create_time_series_features,
    get_feature_and_target_matrices,
    FEATURE_COLUMNS,
)
from app.services.forecast_service import ForecastService

BASE_DIR = Path(__file__).resolve().parent.parent


def test_feature_engineering_no_leakage():
    # Synthetic chronological price series
    dates = pd.date_range("2020-01-01", periods=36, freq="MS")
    prices = np.linspace(1000, 2000, 36)
    df = pd.DataFrame({"Date": dates, "Price": prices})

    df_feat = create_time_series_features(df)
    assert len(df_feat) == 36 - 12  # 12-month lag drops first 12 months

    # Verify rolling mean is shifted: rolling_mean_3 at row t must match average of t-1, t-2, t-3
    t_idx = 15
    expected_mean = float(np.mean([prices[t_idx - 1], prices[t_idx - 2], prices[t_idx - 3]]))
    actual_mean = df_feat.loc[df_feat.index[t_idx - 12], "rolling_mean_3"]
    assert np.isclose(expected_mean, actual_mean)


def test_forecast_model_artifact():
    model_path = BASE_DIR / "models" / "bdi_forecast_model.joblib"
    assert model_path.exists(), "Model file must exist"
    model = joblib.load(model_path)
    assert hasattr(model, "predict"), "Loaded model must have predict method"


def test_forecast_service_execution():
    svc = ForecastService()
    res = svc.generate_forecast(horizons_months=6)

    assert res["status"] == "success"
    assert len(res["forecast"]) == 6

    for pt in res["forecast"]:
        assert pt["predicted_bdi"] > 0
        assert pt["confidence_80_lower"] <= pt["predicted_bdi"] <= pt["confidence_80_upper"]
        assert pt["confidence_95_lower"] <= pt["confidence_80_lower"]
        assert pt["confidence_95_upper"] >= pt["confidence_80_upper"]
        assert pt["tce_capesize_usd"] > 0
        assert pt["tce_panamax_usd"] > 0
