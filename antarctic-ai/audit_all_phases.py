"""
Comprehensive SIH End-to-End System Audit Script (Phases 0 - 60).
"""
import os
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path

BASE_DIR = Path("D:/SIH")
AI_DIR = BASE_DIR / "antarctic-ai"
BACKEND_DIR = BASE_DIR / "SIH26059" / "backend"
FRONTEND_DIR = BASE_DIR / "SIH26059" / "frontend"

def audit_datasets():
    raw_dir = AI_DIR / "data" / "raw"
    datasets = {}
    
    for category in raw_dir.iterdir():
        if category.is_dir():
            files = list(category.rglob("*"))
            data_files = [f for f in files if f.is_file() and not f.name.endswith(".pyc")]
            total_size = sum(f.stat().st_size for f in data_files)
            exts = set(f.suffix for f in data_files)
            datasets[category.name] = {
                "file_count": len(data_files),
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "extensions": list(exts),
                "sample_files": [f.name for f in data_files[:3]]
            }
    return datasets

def audit_iceberg_data():
    iceberg_dir = AI_DIR / "data" / "raw" / "iceberg"
    files = list(iceberg_dir.glob("*.csv")) + list(iceberg_dir.glob("*.nc"))
    
    res = {"files": [f.name for f in files]}
    # Check BYU CSV if present
    for f in files:
        if f.suffix == ".csv":
            df = pd.read_csv(f, nrows=1000)
            res["columns"] = list(df.columns)
            res["sample_shape"] = df.shape
            if "latitude" in df.columns or "lat" in df.columns:
                lat_col = "latitude" if "latitude" in df.columns else "lat"
                lon_col = "longitude" if "longitude" in df.columns else "lon"
                res["lat_range"] = [float(df[lat_col].min()), float(df[lat_col].max())]
                res["lon_range"] = [float(df[lon_col].min()), float(df[lon_col].max())]
    return res

def audit_models():
    models_dir = AI_DIR / "models"
    models = {}
    for m in models_dir.glob("*.joblib"):
        cfg_file = models_dir / f"{m.stem.replace('_model', '_feature_config').replace('_detector', '_feature_config')}.json"
        if not cfg_file.exists():
            cfg_file = models_dir / f"{m.stem}_config.json"
        
        cfg = {}
        if cfg_file.exists():
            with open(cfg_file) as f:
                cfg = json.load(f)
                
        models[m.name] = {
            "size_mb": round(m.stat().st_size / (1024 * 1024), 2),
            "has_config": cfg_file.exists(),
            "config_summary": cfg
        }
    return models

if __name__ == "__main__":
    report = {
        "datasets": audit_datasets(),
        "iceberg_audit": audit_iceberg_data(),
        "models": audit_models()
    }
    print(json.dumps(report, indent=2))
