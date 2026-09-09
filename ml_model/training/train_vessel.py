"""
Vessel Class Subindex Elasticity Modeling.
Calibrates mathematical non-linear relationships between aggregate BDI
and individual Baltic Exchange vessel subindices (BCI, BPI, BSI, BHI).
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import r2_score

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "bdi_vessel_class_subindices.csv"
OUTPUT_PATH = BASE_DIR / "models" / "vessel_class_models.json"


def train_vessel_class_models():
    print(f"Loading vessel class subindices from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} subindex records.")

    # Target vessel subindex columns
    vessel_map = {
        "Capesize": "Capesize_Index",
        "Panamax": "Panamax_Index",
        "Supramax": "Supramax_Index",
        "Handysize": "Handysize_Index",
    }

    # Aggregate BDI benchmark is computed across the subindices
    if "BDI" in df.columns:
        bdi = df["BDI"].values
    else:
        bdi = (
            df["Capesize_Index"] + df["Panamax_Index"] + df["Supramax_Index"] + df["Handysize_Index"]
        ).values / 4.0

    log_bdi = np.log(np.maximum(10.0, bdi))
    bdi_sq = (bdi / 1000.0) ** 2

    X = np.column_stack([bdi, log_bdi, bdi_sq])

    models_meta = {}
    metrics_meta = {}

    print("\n--- Fitting Vessel Class Elasticity Models ---")
    for vclass, col in vessel_map.items():
        if col not in df.columns:
            print(f"Warning: {col} not found in columns. Skipping {vclass}.")
            continue

        y = df[col].values
        reg = Ridge(alpha=1.0)
        reg.fit(X, y)

        preds = reg.predict(X)
        r2 = float(r2_score(y, preds))

        models_meta[vclass] = {
            "coef": [float(c) for c in reg.coef_],
            "intercept": float(reg.intercept_),
            "r2": r2,
        }

        metrics_meta[vclass] = {
            "r2": round(r2, 4),
            "mean_index": round(float(np.mean(y)), 1),
            "min_index": round(float(np.min(y)), 1),
            "max_index": round(float(np.max(y)), 1),
        }

        print(
            f"{vclass:10s} -> Subindex: {col:4s} | R²: {r2:.4f} | "
            f"Mean: {metrics_meta[vclass]['mean_index']:.1f} pts"
        )

    output = {
        "models": models_meta,
        "metrics": metrics_meta,
        "feature_specification": ["BDI", "log(BDI)", "(BDI/1000)^2"],
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nVessel class model parameters saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    train_vessel_class_models()
