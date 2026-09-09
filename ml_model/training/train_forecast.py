"""
Training Script for Baltic Dry Index (BDI) Freight Rate Forecasting Model.
Uses chronological walk-forward cross-validation without data leakage.
Trains a regularized Ridge Regressor and exports model artifacts and metrics.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    mean_absolute_percentage_error,
    r2_score,
)
from sklearn.model_selection import TimeSeriesSplit

try:
    from training.feature_engineering import (
        create_time_series_features,
        get_feature_and_target_matrices,
        FEATURE_COLUMNS,
    )
except ImportError:
    from feature_engineering import (
        create_time_series_features,
        get_feature_and_target_matrices,
        FEATURE_COLUMNS,
    )

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "bdi_index_monthly.csv"
MODEL_PATH = BASE_DIR / "models" / "bdi_forecast_model.joblib"
METADATA_PATH = BASE_DIR / "models" / "model_metadata.json"
METRICS_PATH = BASE_DIR / "metrics" / "metrics.json"


def directional_accuracy(y_true: np.ndarray, y_pred: np.ndarray, y_prev: np.ndarray) -> float:
    """Computes directional accuracy percentage compared to previous step."""
    true_direction = np.sign(y_true - y_prev)
    pred_direction = np.sign(y_pred - y_prev)
    return float(np.mean(true_direction == pred_direction) * 100.0)


def evaluate_split(y_true: np.ndarray, y_pred: np.ndarray, y_prev: np.ndarray) -> Dict[str, float]:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mape = float(mean_absolute_percentage_error(y_true, y_pred) * 100.0)
    r2 = float(r2_score(y_true, y_pred))
    da = directional_accuracy(y_true, y_pred, y_prev)
    return {"mae": mae, "rmse": rmse, "mape": mape, "r2": r2, "directional_accuracy": da}


def train_and_evaluate():
    print(f"Loading historical BDI dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"Raw dataset rows: {len(df)}")

    # Construct features using anti-leakage feature engineering
    df_feat = create_time_series_features(df)
    print(f"Cleaned feature dataset rows: {len(df_feat)}")
    print(f"Features generated ({len(FEATURE_COLUMNS)}): {FEATURE_COLUMNS}")

    X, y = get_feature_and_target_matrices(df_feat)
    y_vals = y.values
    y_prev_vals = df_feat["lag_1"].values

    # Chronological TimeSeriesSplit (5 walk-forward splits)
    n_splits = 5
    tscv = TimeSeriesSplit(n_splits=n_splits)

    ridge_metrics = []
    naive_metrics = []
    seasonal_metrics = []

    for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
        X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]
        val_prev = y_prev_vals[val_idx]

        # 1. Ridge Regressor (L2 regularization to prevent overfitting)
        model = Ridge(alpha=10.0)
        model.fit(X_train, y_train)
        pred_ridge = model.predict(X_val)
        ridge_metrics.append(evaluate_split(y_val.values, pred_ridge, val_prev))

        # 2. Naive Persistence Baseline: y_hat(t) = y(t-1)
        pred_naive = val_prev
        naive_metrics.append(evaluate_split(y_val.values, pred_naive, val_prev))

        # 3. Seasonal Naive Baseline: y_hat(t) = y(t-12)
        pred_seasonal = df_feat["lag_12"].iloc[val_idx].values
        seasonal_metrics.append(evaluate_split(y_val.values, pred_seasonal, val_prev))

    def avg_metrics(metrics_list):
        return {
            "mean_mae": round(float(np.mean([m["mae"] for m in metrics_list])), 2),
            "mean_rmse": round(float(np.mean([m["rmse"] for m in metrics_list])), 2),
            "mean_mape": round(float(np.mean([m["mape"] for m in metrics_list])), 2),
            "mean_r2": round(float(np.mean([m["r2"] for m in metrics_list])), 3),
            "mean_directional_accuracy": round(
                float(np.mean([m["directional_accuracy"] for m in metrics_list])), 2
            ),
        }

    ridge_avg = avg_metrics(ridge_metrics)
    naive_avg = avg_metrics(naive_metrics)
    seasonal_avg = avg_metrics(seasonal_metrics)

    print("\n--- Model Benchmark Comparison (5-Fold Walk-Forward Cross-Validation) ---")
    print(f"Naive Persistence: {naive_avg}")
    print(f"Seasonal Naive:    {seasonal_avg}")
    print(f"Ridge Regressor:   {ridge_avg}")

    # Train final model on entire historical dataset
    final_model = Ridge(alpha=10.0)
    final_model.fit(X, y)

    # Feature importances / coefficients
    importances = {
        col: round(float(coef), 4)
        for col, coef in zip(FEATURE_COLUMNS, final_model.coef_)
    }

    # Save model artifact
    os.makedirs(MODEL_PATH.parent, exist_ok=True)
    os.makedirs(METRICS_PATH.parent, exist_ok=True)
    joblib.dump(final_model, MODEL_PATH)
    print(f"\nTrained model successfully saved to: {MODEL_PATH}")

    # Build comprehensive model metadata
    metadata = {
        "model_name": "Ridge",
        "version": "1.0.0",
        "target": "Baltic Dry Index (BDI) Monthly Price",
        "training_date_range": {
            "start": str(df_feat["Date"].min().date()) if "Date" in df_feat else "1999-01-01",
            "end": str(df_feat["Date"].max().date()) if "Date" in df_feat else "2024-08-01",
            "total_observations": len(df_feat),
        },
        "features": FEATURE_COLUMNS,
        "feature_importances": importances,
        "model_hyperparameters": final_model.get_params(),
        "validation_protocol": "Chronological Walk-Forward Expanding Window (5 splits)",
        "benchmark_comparison": {
            "Naive_Persistence": naive_avg,
            "Seasonal_Naive": seasonal_avg,
            "Ridge": ridge_avg,
        },
        "selected_model_metrics": ridge_avg,
        "last_known_bdi": float(y.iloc[-1]),
        "last_known_date": str(df_feat["Date"].iloc[-1].date()) if "Date" in df_feat else "2024-08-01",
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Model metadata saved to: {METADATA_PATH}")

    with open(METRICS_PATH, "w") as f:
        json.dump(
            {
                "freight_forecast_model": metadata,
                "benchmarks": {
                    "Naive_Persistence": naive_avg,
                    "Seasonal_Naive": seasonal_avg,
                    "Ridge": ridge_avg,
                },
            },
            f,
            indent=2,
        )
    print(f"Metrics saved to: {METRICS_PATH}")


if __name__ == "__main__":
    train_and_evaluate()
