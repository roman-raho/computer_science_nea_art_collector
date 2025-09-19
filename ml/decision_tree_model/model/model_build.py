from __future__ import annotations
import argparse
import json
import os
import sys
from datetime import datetime, timezone
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

# sklearn
from sklearn import __version__ as skl_version
from sklearn.compose import ColumnTransformer
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from joblib import dump

from feature_mart import build_feature_mart_all

def _log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[INFO {ts} UTC] {msg}")

def sklearn_version_ge(v: str) -> bool:
    def as_tuple(ver: str) -> tuple:
        return tuple(int(p) for p in ver.split("+")[0].split(".")[:3])
    return as_tuple(skl_version) >= as_tuple(v)

def make_ohe() -> OneHotEncoder:
    if sklearn_version_ge("1.2.0"):
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    else:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)
    
    