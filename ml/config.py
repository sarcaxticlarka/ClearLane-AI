"""Central config: paths, bbox, severity/vehicle weight tables. No magic numbers elsewhere."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

RAW_CSV = ROOT / "data/raw/violations_raw.csv"
PROCESSED_PARQUET = ROOT / "data/processed/violations_clean.parquet"
OUTPUT_DIR = ROOT / "ml/output"

BENGALURU_BBOX = {"lat_min": 12.7, "lat_max": 13.2, "lng_min": 77.3, "lng_max": 77.8}
MAP_CENTER = (12.97, 77.59)
MAP_ZOOM = 12

# offence_code -> severity_weight (Section 2.2 of docs)
SEVERITY_WEIGHTS = {
    112: 0.7,   # WRONG PARKING
    113: 0.8,   # NO PARKING
    104: 0.9,   # PARKING NEAR ROAD CROSSING
    107: 1.0,   # PARKING IN A MAIN ROAD
    108: 0.6,   # PARKING ON FOOTPATH
    109: 0.95,  # PARKING NEAR FIRE STATION
}
DEFAULT_SEVERITY_WEIGHT = 0.5  # offence codes not in the documented table

# vehicle_type -> obstruction weight, by physical footprint / road-blocking impact
VEHICLE_WEIGHTS = {
    "SCOOTER": 0.3, "MOTOR CYCLE": 0.3, "MOPED": 0.3,
    "PASSENGER AUTO": 0.5, "GOODS AUTO": 0.5, "OTHERS": 0.5,
    "CAR": 0.6, "JEEP": 0.6, "VAN": 0.6, "MAXI-CAB": 0.6,
    "LGV": 0.7, "TEMPO": 0.7,
    "TRACTOR": 0.8,
    "HGV": 0.9, "LORRY/GOODS VEHICLE": 0.9, "TANKER": 0.9, "MINI LORRY": 0.9,
    "BUS (BMTC/KSRTC)": 1.0, "PRIVATE BUS": 1.0, "TOURIST BUS": 1.0,
    "FACTORY BUS": 1.0, "SCHOOL VEHICLE": 1.0,
}
DEFAULT_VEHICLE_WEIGHT = 0.5

# duration_est_mins: closed_datetime is 100% null in this dataset (no actual close time
# recorded), so duration is estimated from offence severity as a documented proxy —
# more severe/obstructive violations are assumed to persist longer before clearance.
DURATION_EST_BY_SEVERITY = {
    0.6: 15,   # footpath - lowest, cleared quickly
    0.7: 25,
    0.8: 35,
    0.9: 45,
    0.95: 55,
    1.0: 60,   # main road - highest, slowest to clear
}
DEFAULT_DURATION_EST_MINS = 30

PEAK_HOURS = set(range(8, 11)) | set(range(17, 21))  # 8-10am, 5-8pm

# DBSCAN params (Section: Phase 1.4)
DBSCAN_EPS_RAD = 0.0003  # ~33m in radians-equivalent for haversine metric
DBSCAN_MIN_SAMPLES = 15

# KDE params
KDE_BW_METHOD = 0.02
KDE_GRID_SIZE = 350
KDE_MIN_INTENSITY = 0.05

# Obstruction score weights
OBSTRUCTION_WEIGHTS = {"density": 0.30, "severity": 0.25, "duration": 0.20, "centrality": 0.15}
JUNCTION_MULTIPLIER = 2.0
SEVERITY_LABEL_THRESHOLDS = {"critical": 80, "high": 60, "medium": 40}

# Prophet
PROPHET_TOP_N_ZONES = 30
PROPHET_FORECAST_HOURS = 48

# Isolation Forest
ISO_FOREST_N_ESTIMATORS = 300
ISO_FOREST_CONTAMINATION = 0.04

# XGBoost event-spike
XGB_PARAMS = dict(n_estimators=400, max_depth=5, learning_rate=0.04, subsample=0.8)
EVENT_RADIUS_KM = 5
EVENT_WINDOW_HOURS = 48

# Enforcement priority score
PRIORITY_WEIGHTS = {"obstruction": 0.6, "spike_risk": 0.25, "anomaly_flag": 0.15}
TOP_N_ENFORCEMENT = 10
