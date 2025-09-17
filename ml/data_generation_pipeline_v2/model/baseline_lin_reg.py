from __future__ import annotations
"""
Feature mart + ElasticNet (time-aware CV) for artwork price prediction.

Key fixes vs your draft
-----------------------
- scikit-learn compatibility: uses OneHotEncoder with `sparse_output=False` for >=1.2
  and gracefully falls back to `sparse=False` for older versions.
- Fixed param grid key typo: `l1_ratio` (not `1l_ratio`).
- Hardened JSON loading, numeric coercion, schema checks, and date parsing.
- Clear error messages + lightweight logging.
- Saves artifacts: coefficients, residuals, feature stds, report JSON, and the fitted model pipeline (joblib).

Run examples (Windows PowerShell)
---------------------------------
python model\baseline_enet_v2.py ^
  --artworks data\raw\artworks_v2_large.json ^
  --auctions data\raw\auctions_v2.json ^
  --biddata data\raw\bid_data_v2.json ^
  --houses data\raw\auction_houses_v2.json ^
  --artist_rep data\processed\artist_reputation_score.json ^
  --gallery data\processed\gallery_score.json ^
  --museum data\processed\museum_score.json ^
  --provenance data\processed\provenance_score.json ^
  --house_score data\processed\auction_house_score.json ^
  --train-end-year 2021 ^
  --output-prefix data\processed\baseline_v2

(Bash/Zsh: replace `^` with `\` or put everything on one line.)
"""

import argparse
import json
import math
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

# sklearn
from sklearn import __version__ as skl_version
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import ElasticNet
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from joblib import dump


# -----------------------------
# Utils
# -----------------------------

def _log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[INFO {ts} UTC] {msg}")


def read_json(path: str) -> pd.DataFrame:
    """Robust JSON reader. Tries normal JSON first, then JSON Lines."""
    try:
        return pd.read_json(path)
    except ValueError:
        try:
            return pd.read_json(path, lines=True)
        except Exception as e:
            print(f"[ERR] reading {path}: {e}", file=sys.stderr)
            raise


def safe_num(s: pd.Series, *, clip_low: Optional[float] = None) -> pd.Series:
    x = pd.to_numeric(s, errors="coerce")
    if clip_low is not None:
        x = x.clip(lower=clip_low)
    return x


def safe_log1p(s: pd.Series) -> pd.Series:
    return np.log1p(safe_num(s, clip_low=0.0).fillna(0.0))


def sklearn_version_ge(v: str) -> bool:
    def as_tuple(ver: str) -> tuple:
        parts = ver.split("+")[0].split(".")
        return tuple(int(p) for p in parts[:3])
    return as_tuple(skl_version) >= as_tuple(v)


def make_ohe() -> OneHotEncoder:
    """Version-safe OneHotEncoder constructor."""
    if sklearn_version_ge("1.2.0"):
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    else:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


@dataclass
class Paths:
    artworks: str
    auctions: str
    biddata: str
    houses: str
    artist_rep: str
    gallery: str
    museum: str
    provenance: str
    house_score: str


# -----------------------------
# Feature mart
# -----------------------------

def build_feature_mart(
    artworks: pd.DataFrame,
    auctions: pd.DataFrame,
    biddata: pd.DataFrame,
    houses: pd.DataFrame,
    scores: Dict[str, pd.DataFrame],
    current_year: int,
) -> pd.DataFrame:
    need_art = {
        "artwork_id",
        "artist_id",
        "year_created",
        "medium",
        "signed",
        "artwork_length",
        "artwork_width",
    }
    need_auc = {"auction_id", "artwork_id", "auction_house_id", "date_of_auction"}
    need_bid = {"auction_id", "reserve_price", "final_price", "number_of_bids"}

    miss = need_art - set(artworks.columns)
    if miss:
        raise AssertionError(f"artworks missing: {sorted(miss)}")
    miss = need_auc - set(auctions.columns)
    if miss:
        raise AssertionError(f"auctions missing: {sorted(miss)}")
    miss = need_bid - set(biddata.columns)
    if miss:
        raise AssertionError(f"bid_data missing: {sorted(miss)}")

    auc = auctions.copy()
    auc["date_of_auction"] = pd.to_datetime(auc["date_of_auction"], errors="coerce")

    bid = biddata.copy()
    for col in ["reserve_price", "final_price", "number_of_bids"]:
        bid[col] = safe_num(bid[col])

    # core merge - auction rows with realised price
    df = (
        auc.merge(
            bid[["auction_id", "reserve_price", "final_price", "number_of_bids"]],
            on="auction_id",
            how="left",
        )
        .merge(artworks, on="artwork_id", how="left")
        .merge(houses[["auction_house_id", "location"]], on="auction_house_id", how="left")
    )

    # keep only rows with a valid final price
    df = df[safe_num(df["final_price"]).notna()].copy()

    # geometry + simple transforms
    df["artwork_length"] = safe_num(df["artwork_length"])  # cm or inches? assumed consistent
    df["artwork_width"] = safe_num(df["artwork_width"])    # idem
    df["area"] = df["artwork_length"] * df["artwork_width"]
    df["log_area"] = safe_log1p(df["area"])  # stabilise scale

    df["year_created"] = safe_num(df["year_created"]).fillna(current_year)
    df["age"] = (current_year - df["year_created"]).clip(lower=0)

    # categorical cleanup
    df["medium"] = df["medium"].astype(str).str.lower().str.strip()

    # signed flag
    df["signed_flag"] = df["signed"].astype(str).str.lower().isin(["1", "true", "yes", "y", "t"]).astype(int)

    # calendar features
    df["season_q"] = df["date_of_auction"].dt.quarter
    df["year"] = df["date_of_auction"].dt.year

    # price-derived features
    df["reserve_gt0"] = (safe_num(df["reserve_price"]).fillna(0) > 0).astype(int)
    with np.errstate(divide="ignore", invalid="ignore"):
        df["premium"] = np.where(
            (safe_num(df["reserve_price"]).fillna(0) > 0) & safe_num(df["final_price"]).notna(),
            (safe_num(df["final_price"]) - safe_num(df["reserve_price"])) / np.maximum(
                safe_num(df["reserve_price"]).replace(0, np.nan), 1e-12
            ),
            np.nan,
        )
    df["mean_bids"] = safe_num(df["number_of_bids"])  # already numeric

    # join auxiliary scores
    art_rep = (
        scores["artist_rep"][
            ["artist_id", "reputation_score", "volatility_score"]
        ].rename(
            columns={
                "reputation_score": "artist_rep_score",
                "volatility_score": "artist_volatility",
            }
        )
        if "artist_rep" in scores and not scores["artist_rep"].empty
        else pd.DataFrame(columns=["artist_id", "artist_rep_score", "artist_volatility"])
    )

    prov = (
        scores["provenance"][
            ["artwork_id", "prov_score", "volatility_score"]
        ].rename(columns={"volatility_score": "prov_volatility"})
        if "provenance" in scores and not scores["provenance"].empty
        else pd.DataFrame(columns=["artwork_id", "prov_score", "prov_volatility"])
    )

    ah = (
        scores["house_score"][
            ["auction_house_id", "auction_house_score", "volatility_score"]
        ].rename(columns={"volatility_score": "house_volatility"})
        if "house_score" in scores and not scores["house_score"].empty
        else pd.DataFrame(columns=["auction_house_id", "auction_house_score", "house_volatility"])
    )

    df = df.merge(art_rep, on="artist_id", how="left")
    df = df.merge(prov, on="artwork_id", how="left")
    df = df.merge(ah, on="auction_house_id", how="left")

    # target
    df["y_log_price"] = safe_log1p(df["final_price"])  # log1p to include possible zeros

    # simple region from trailing location token
    df["region"] = (
        df["location"].astype(str).str.split(",").str[-1].str.strip().str.lower()
    )

    # categorical casting for encoder
    df["season_q"] = df["season_q"].astype("Int64").astype(str)

    # drop any rows without date or target
    df = df.dropna(subset=["date_of_auction", "y_log_price"]).copy()

    _log(f"Feature mart shape: {df.shape}; columns: {list(df.columns)}")
    return df


# -----------------------------
# Modelling
# -----------------------------

def nested_elasticnet_report(
    df: pd.DataFrame, train_end_year: int, output_prefix: str
) -> Dict:
    train_df = df[df["year"] <= train_end_year].copy()
    test_df = df[df["year"] > train_end_year].copy()

    if len(train_df) == 0 or len(test_df) == 0:
        raise RuntimeError(
            "Train/Test split produced empty set(s). Check `--train-end-year` and your dates."
        )

    # NOTE: keep prediction-time legality: exclude realised-outcome features
    # - mean_bids (depends on post-auction info)
    # - premium   (uses final_price → label leakage)
    numeric_cols = [
        "log_area",
        "age",
        "signed_flag",
        "reserve_gt0",
        "artist_rep_score",
        "artist_volatility",
        "prov_score",
        "prov_volatility",
        "auction_house_score",
        "house_volatility",
    ]
    numeric_cols = [c for c in numeric_cols if c in df.columns]

    cat_cols: List[str] = []
    for c in ["medium", "region", "season_q"]:
        if c in df.columns:
            cat_cols.append(c)

    num_pipe = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler(with_mean=True, with_std=True)),
        ])

    cat_pipe = Pipeline([
            ("imputer", SimpleImputer(strategy="constant", fill_value="__MISSING__")),
            ("ohe", make_ohe()),
        ])

    pre = ColumnTransformer(
        transformers=[
            ("num", num_pipe, numeric_cols),
            ("cat", cat_pipe, cat_cols),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )

    model = ElasticNet(max_iter=10000, fit_intercept=True, random_state=42)

    param_grid = {
        "model__alpha": np.logspace(-3, 1.5, 12),
        "model__l1_ratio": [0.05, 0.2, 0.5, 0.8, 0.95],
    }

    pipe = Pipeline([("pre", pre), ("model", model)])

    inner = TimeSeriesSplit(n_splits=5)

    gscv = GridSearchCV(
        estimator=pipe,
        param_grid=param_grid,
        scoring="neg_mean_absolute_error",
        cv=inner,
        n_jobs=-1,
        refit=True,
        verbose=0,
    )

    X_train = train_df[numeric_cols + cat_cols]
    y_train = train_df["y_log_price"].values

    _log("Fitting GridSearchCV (time-aware)")
    gscv.fit(X_train, y_train)

    X_test = test_df[numeric_cols + cat_cols]
    y_test = test_df["y_log_price"].values
    yhat_test = gscv.predict(X_test)

    price_true = np.expm1(y_test)
    price_pred = np.expm1(yhat_test)
    pct_err = np.abs(price_pred - price_true) / np.maximum(price_true, 1e-6)
    within_20 = float((pct_err <= 0.20).mean())

    mae = float(mean_absolute_error(y_test, yhat_test))
    r2 = float(r2_score(y_test, yhat_test))

    # leakage guard via label shuffling
    rng = np.random.default_rng(42)
    y_shuf = y_train.copy()
    rng.shuffle(y_shuf)
    gscv_shuf = GridSearchCV(
        pipe, param_grid, scoring="neg_mean_absolute_error", cv=inner, n_jobs=-1, refit=True
    )
    gscv_shuf.fit(X_train, y_shuf)
    yhat_shuf = gscv_shuf.predict(X_test)
    r2_shuf = float(r2_score(y_test, yhat_shuf))

    # export diagnostics
    preproc = gscv.best_estimator_.named_steps["pre"]
    model_best = gscv.best_estimator_.named_steps["model"]

    feat_names_num = numeric_cols
    feat_names_cat: List[str] = []
    if cat_cols:
        enc = preproc.named_transformers_["cat"]
        feat_names_cat = list(enc.get_feature_names_out(cat_cols))
    feat_names = feat_names_num + feat_names_cat

    coefs = model_best.coef_
    coef_df = pd.DataFrame({"feature": feat_names, "coef": coefs}).sort_values(
        "coef", ascending=False
    )

    resid_df = pd.DataFrame(
        {
            "artwork_id": test_df["artwork_id"].values,
            "auction_id": test_df["auction_id"].values,
            "date_of_auction": test_df["date_of_auction"].astype(str).values,
            "y_true_log": y_test,
            "y_pred_log": yhat_test,
            "price_true": price_true,
            "price_pred": price_pred,
            "pct_error": pct_err,
        }
    ).sort_values("pct_error", ascending=False)

    scaler = preproc.named_transformers_["num"]
    std_summary: Dict[str, Dict[str, float]] = {}
    if hasattr(scaler, "mean_") and hasattr(scaler, "scale_"):
        for i, col in enumerate(numeric_cols):
            std_summary[col] = {
                "mean": float(scaler.mean_[i]),
                "scale": float(scaler.scale_[i]),
            }

    # ensure output folder exists
    out_dir = os.path.dirname(output_prefix)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    coef_df.to_csv(f"{output_prefix}_coefficients.csv", index=False)
    resid_df.to_csv(f"{output_prefix}_residuals.csv", index=False)
    with open(f"{output_prefix}_feature_std.json", "w", encoding="utf-8") as f:
        json.dump(std_summary, f, indent=2)

    # save the fitted pipeline for reuse
    dump(gscv.best_estimator_, f"{output_prefix}_model.joblib")

    report = {
        "train_rows": int(len(train_df)),
        "test_rows": int(len(test_df)),
        "train_end_year": int(train_df["year"].max()) if len(train_df) else None,
        "best_params": gscv.best_params_,
        "cv_best_mae": float(-gscv.best_score_),
        "test_mae_log": mae,
        "test_r2_log": r2,
        "pct_within_20pct_price": round(within_20, 3),
        "leakage_guard_r2": r2_shuf,
        "sklearn_version": skl_version,
        "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    with open(f"{output_prefix}_baseline_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return report


# -----------------------------
# CLI
# -----------------------------

def parse_args(argv: Optional[List[str]] = None):
    p = argparse.ArgumentParser(
        description="Feature mart + ElasticNet baseline for artwork price prediction."
    )

    # raw
    p.add_argument("--artworks", required=True, help="artworks_v2_large.json")
    p.add_argument("--auctions", required=True, help="auctions_v2.json")
    p.add_argument("--biddata", required=True, help="bid_data_v2.json")
    p.add_argument("--houses", required=True, help="auction_houses_v2.json")

    # processed scores
    p.add_argument("--artist_rep", required=True, help="processed/artist_reputation_score.json")
    p.add_argument("--gallery", required=True, help="processed/gallery_score.json")
    p.add_argument("--museum", required=True, help="processed/museum_score.json")
    p.add_argument("--provenance", required=True, help="processed/provenance_score.json")
    p.add_argument("--house_score", required=True, help="processed/auction_house_score.json")

    # config
    p.add_argument(
        "--current-year",
        type=int,
        default=datetime.now().year,
        help="Reference year (for age calc).",
    )
    p.add_argument(
        "--train-end-year",
        type=int,
        required=True,
        help="All auctions <= this year are train; later years are test.",
    )
    p.add_argument(
        "--output-prefix",
        required=True,
        help="Prefix for outputs (e.g., data/processed/baseline_v2)",
    )

    return p.parse_args(argv)


def main(argv: Optional[List[str]] = None):
    args = parse_args(argv)

    _log("Loading input tables…")
    artworks = read_json(args.artworks)
    auctions = read_json(args.auctions)
    biddata = read_json(args.biddata)
    houses = read_json(args.houses)

    scores = {
        "artist_rep": read_json(args.artist_rep),
        "gallery": read_json(args.gallery),
        "museum": read_json(args.museum),
        "provenance": read_json(args.provenance),
        "house_score": read_json(args.house_score),
    }

    _log("Building feature mart…")
    mart = build_feature_mart(
        artworks, auctions, biddata, houses, scores, args.current_year
    )

    mart_out = f"{args.output_prefix}_feature_mart.csv"
    mart.to_csv(mart_out, index=False)
    _log(f"Wrote feature mart → {mart_out}")

    _log("Training ElasticNet baseline…")
    report = nested_elasticnet_report(mart, args.train_end_year, args.output_prefix)

    print("Baseline report:")
    for k, v in report.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    try:
        main()
    except AssertionError as e:
        print(f"[ERR] {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[ERR] Unexpected failure: {e}", file=sys.stderr)
        sys.exit(1)
