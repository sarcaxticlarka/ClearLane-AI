# ClearLane AI — AI-Driven Parking Intelligence & Congestion Impact Platform

Detects illegal-parking hotspots in Bengaluru and quantifies their congestion impact to
enable targeted enforcement, built on a 298K-row Bengaluru Traffic Police violation dataset.

## Architecture

```
/data/raw, /processed     - source CSV, cleaned parquet
/ml                       - pipeline scripts (run in order, see below)
/ml/output                - pre-computed JSON consumed by the API
/api                       - FastAPI server (serves JSON, no live inference)
/frontend                 - React + Vite + Leaflet dashboard
/docs                     - EDA findings, full feature reference, demo script
```

See **[docs/FEATURES.md](docs/FEATURES.md)** for what every feature does, the
method/data it's based on, and where it shows up in the API and UI.

## Running the ML pipeline

```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ml
python 01_eda.py                      # -> docs/eda_findings.md
python preprocess.py                  # -> data/processed/violations_clean.parquet
python 02_cluster.py                  # -> output/zones.geojson, zone_stats.json
python 03_kde.py                      # -> output/kde_points.json
python 04_scoring.py                  # -> output/zone_scores.json (fetches/caches an osmnx road graph)
python 05_forecast.py                 # -> output/forecasts/{zone_id}.json
python generate_synthetic_events.py   # -> data/raw/astram_events.csv (SYNTHETIC demo data, see docs/FEATURES.md #14)
python 06_event_model.py              # -> output/event_impacts.json (no-op if astram_events.csv absent)
python 07_anomaly.py                  # -> output/anomalies.json
python 08_enforce.py                  # -> output/enforcement_recs.json
python 09_repeat_offenders.py         # -> output/repeat_offenders.json, repeat_offenders_by_zone.json
python 10_cascade.py                  # -> output/cascade_graph.json
python 11_trend.py                    # -> output/trend_global.json, trends/{zone_id}.json
python 12_optimizer.py                # -> output/shift_schedule.json
python 13_hourly_heatmap.py           # -> output/hourly_heatmap.json
python 14_report_data.py              # -> output/report_trends.json
```

## Running the API

```bash
source .venv/bin/activate
uvicorn api.app.main:app --reload --port 8000
```

Endpoints (15 total — full detail in [docs/FEATURES.md](docs/FEATURES.md)):

| Endpoint | Feature |
|---|---|
| `GET /api/zones`, `/api/zones/{id}` | hotspot zones + obstruction score |
| `GET /api/heatmap` | KDE heatmap |
| `GET /api/forecast/{id}` | 48h Prophet forecast |
| `GET /api/anomalies` | Isolation Forest anomalies |
| `GET /api/enforcement` | ranked enforcement recommendations |
| `GET /api/events/impact` | event-spike impacts (⚠ synthetic, see below) |
| `POST /api/query` | NL query (Groq RAG) |
| `GET /api/repeat-offenders`, `/api/zones/{id}/repeat-offenders` | repeat-offender leaderboard |
| `GET /api/cascade` | cascade risk graph |
| `GET /api/trend`, `/api/zones/{id}/trend` | historical monthly trend |
| `GET /api/shift-schedule` | officer assignment optimizer |
| `GET /api/heatmap/hourly` | timeline replay (typical hour-of-day pattern) |
| `GET /api/report?period=daily\|weekly\|monthly` | report generator (trend, suggestions, PDF export) |

Set `GROQ_API_KEY` in `.env` to enable the NL query endpoint's Groq-backed RAG (model:
`llama-3.3-70b-versatile`); without it, `/api/query` falls back to a deterministic
templated answer built from the same zone/enforcement/anomaly data.

## Running the frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

Set `VITE_API_BASE_URL` in `frontend/.env` if the API isn't on `localhost:8000`.

## Known limitations

- **No real Astram events export was ever provided.** `python ml/generate_synthetic_events.py`
  fabricates a plausible demo CSV (real Bengaluru venues, randomized dates/crowd sizes,
  tagged `is_synthetic=true`) so the event-spike XGBoost model and the "Event Impact"
  panel work end-to-end. The UI shows a visible synthetic-data warning whenever this
  flag is set. To use real data, replace `data/raw/astram_events.csv` with a genuine
  export (same columns, omit `is_synthetic` or set it `false`) and re-run `06_event_model.py`.
  If the file is missing entirely, the pipeline still degrades gracefully to an empty
  `event_impacts.json`.
- `closed_datetime` is 100% null in the source CSV, so `duration_est_mins` is a
  documented severity-based proxy rather than an observed duration (see `ml/config.py`).
- DBSCAN zone count (179) and KDE point count (~11K) were auto-tuned at pipeline run
  time to land inside the doc's target ranges (50-200 zones, 10K-30K points).

See [docs/eda_findings.md](docs/eda_findings.md) for full EDA output,
[docs/FEATURES.md](docs/FEATURES.md) for what every feature does and how, and
[docs/demo_script.md](docs/demo_script.md) for the judging walkthrough.
