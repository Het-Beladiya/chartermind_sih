"""
Independent Model Evaluation & Benchmarking Script.
Tests multiple machine learning algorithms and naive baselines on the
Baltic Dry Index (BDI) dataset using strict chronological walk-forward validation.
"""

import json
from pathlib import Path
from typing import Dict, Any, List

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge, LinearRegression
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
    )
except ImportError:
    from feature_engineering import (
        create_time_series_features,
        get_feature_and_target_matrices,
    )

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "bdi_index_monthly.csv"
OUTPUT_PATH = BASE_DIR / "metrics" / "metrics.json"


def directional_accuracy(y_true: np.ndarray, y_pred: np.ndarray, y_prev: np.ndarray) -> float:
    true_direction = np.sign(y_true - y_prev)
    pred_direction = np.sign(y_pred - y_prev)
    return float(np.mean(true_direction == pred_direction) * 100.0)


def evaluate_models():
    print(f"Loading data from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    df_feat = create_time_series_features(df)
    X, y = get_feature_and_target_matrices(df_feat)
    y_prev_vals = df_feat["lag_1"].values

    models: Dict[str, Any] = {
        "Ridge": Ridge(alpha=10.0),
        "LinearRegression": LinearRegression(),
        "RandomForest": RandomForestRegressor(n_estimators=100, max_depth=5, random_state=42),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=100, max_depth=3, random_state=42),
    }

    tscv = TimeSeriesSplit(n_splits=5)
    results: Dict[str, List[Dict[str, float]]] = {
        "Naive_Persistence": [],
        "Seasonal_Naive": [],
        **{name: [] for name in models.keys()},
    }

    print("\nExecuting 5-Fold Walk-Forward Cross-Validation...")

    for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
        X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]
        val_prev = y_prev_vals[val_idx]
        y_true = y_val.values

        # 1. Naive Persistence Baseline: y_hat(t) = y(t-1)
        pred_naive = val_prev
        results["Naive_Persistence"].append({
            "mae": mean_absolute_error(y_true, pred_naive),
            "rmse": np.sqrt(mean_squared_error(y_true, pred_naive)),
            "mape": mean_absolute_percentage_error(y_true, pred_naive) * 100.0,
            "r2": r2_score(y_true, pred_naive),
            "directional_accuracy": 0.0,
        })

        # 2. Seasonal Naive Baseline: y_hat(t) = y(t-12)
        pred_seasonal = df_feat["lag_12"].iloc[val_idx].values
        results["Seasonal_Naive"].append({
            "mae": mean_absolute_error(y_true, pred_seasonal),
            "rmse": np.sqrt(mean_squared_error(y_true, pred_seasonal)),
            "mape": mean_absolute_percentage_error(y_true, pred_seasonal) * 100.0,
            "r2": r2_score(y_true, pred_seasonal),
            "directional_accuracy": directional_accuracy(y_true, pred_seasonal, val_prev),
        })

        # 3. Supervised ML Models
        for name, model in models.items():
            model.fit(X_train, y_train)
            pred = model.predict(X_val)
            results[name].append({
                "mae": mean_absolute_error(y_true, pred),
                "rmse": np.sqrt(mean_squared_error(y_true, pred)),
                "mape": mean_absolute_percentage_error(y_true, pred) * 100.0,
                "r2": r2_score(y_true, pred),
                "directional_accuracy": directional_accuracy(y_true, pred, val_prev),
            })

    # Summary table
    summary = {}
    print("\n" + "=" * 80)
    print(f"{'Model / Algorithm':22s} | {'MAE':8s} | {'RMSE':8s} | {'MAPE (%)':8s} | {'R²':7s} | {'Dir Acc (%)':11s}")
    print("-" * 80)

    for name, metric_list in results.items():
        avg_mae = float(np.mean([m["mae"] for m in metric_list]))
        avg_rmse = float(np.mean([m["rmse"] for m in metric_list]))
        avg_mape = float(np.mean([m["mape"] for m in metric_list]))
        avg_r2 = float(np.mean([m["r2"] for m in metric_list]))
        avg_da = float(np.mean([m["directional_accuracy"] for m in metric_list]))

        summary[name] = {
            "mean_mae": round(avg_mae, 2),
            "mean_rmse": round(avg_rmse, 2),
            "mean_mape": round(avg_mape, 2),
            "mean_r2": round(avg_r2, 3),
            "mean_directional_accuracy": round(avg_da, 2),
        }

        print(
            f"{name:22s} | {avg_mae:8.2f} | {avg_rmse:8.2f} | {avg_mape:8.2f} | "
            f"{avg_r2:7.3f} | {avg_da:11.2f}%"
        )
    print("=" * 80)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump({"benchmark_evaluation": summary}, f, indent=2)

    print(f"\nBenchmark metrics successfully saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    evaluate_models()
