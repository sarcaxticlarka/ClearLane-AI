# ClearLane AI — Feature Reference

Every feature: what it does, the method/data it's based on, which API endpoint serves
it, and where it shows up in the UI. ML scripts run in numeric order under `/ml`;
each writes its output to `/ml/output`, which the API loads once at startup
(`lifespan` in [api/app/main.py](../api/app/main.py)) — nothing below does live
inference per-request except the NL query.

---

## Core pipeline (Phase 1–2)

### 1. Hotspot zones — DBSCAN clustering
- **Basis:** `sklearn.cluster.DBSCAN` with the **haversine metric** (true ground
  distance, not flat-degree approximation) over `(latitude, longitude)`. Auto-tunes
  `eps` across `[33, 50, 75, 100, 150, 200, 250...]` meters until the zone count lands
  in the documented 50–200 target band. Currently settles at **eps=250m, min_samples=15
  → 179 zones**.
- **Script:** [ml/02_cluster.py](../ml/02_cluster.py)
- **Output:** `zones.geojson` (bounding-box polygons per zone), `zone_stats.json`
- **API:** `GET /api/zones`, `GET /api/zones/{id}` (includes `polygon`)
- **UI:** zone markers on the map, sidebar list, drawer header

### 2. Heatmap — Gaussian KDE
- **Basis:** `scipy.stats.gaussian_kde` over all violation points, `bw_method=0.02`,
  evaluated on a 350×350 grid across the Bengaluru bbox, normalized 0–1. Intensity
  threshold auto-relaxes downward until ≥10K points clear it (currently ~11K points,
  0.62MB).
- **Script:** [ml/03_kde.py](../ml/03_kde.py)
- **Output:** `kde_points.json`
- **API:** `GET /api/heatmap`
- **UI:** `HeatLayer` (Leaflet.heat) on the map

### 3. Obstruction Score — custom formula + road centrality
- **Basis:** `score = (0.30·density + 0.25·severity + 0.20·duration + 0.15·centrality) × junction_mult × 100`
  - `density` = zone violation count / max zone violation count
  - `severity` = avg of per-violation severity weights (offence_code → weight table in
    [ml/config.py](../ml/config.py), e.g. PARKING IN A MAIN ROAD=1.0, FOOTPATH=0.6)
  - `duration` = avg vehicle-footprint weight as a proxy (closed_datetime is 100% null
    in the source data, so true duration can't be measured — documented limitation)
  - `centrality` = betweenness centrality of the nearest road-graph node, fetched via
    `osmnx.graph_from_point` (15km radius, cached as `road_graph.graphml`) and
    `networkx.betweenness_centrality`
  - `junction_mult` = 2.0 if the zone has a named junction, else 1.0
  - Severity label: critical ≥80, high ≥60, medium ≥40, else low
- **Script:** [ml/04_scoring.py](../ml/04_scoring.py)
- **Output:** `zone_scores.json` (the master per-zone record everything else joins on)
- **API:** embedded in `/api/zones`, `/api/zones/{id}`
- **UI:** `ObstructionGauge` (animated SVG ring) in the zone drawer, severity badges/colors throughout

### 4. 48h Forecast — Prophet
- **Basis:** `prophet.Prophet` per zone, weekly+daily seasonality, multiplicative mode,
  `changepoint_prior_scale=0.05`. Trained on each zone's own hourly violation
  time-series (zero-filled gaps), forecasts 48 hours past that zone's last observed
  hour. Run for the **top 30 zones** by obstruction score.
- **Script:** [ml/05_forecast.py](../ml/05_forecast.py)
- **Output:** `forecasts/{zone_id}.json`, `forecast_summary.json`
- **API:** `GET /api/forecast/{zone_id}`
- **UI:** `ForecastChart` (Recharts area chart) in the zone drawer's Forecast tab

### 5. Event-spike model — XGBoost (synthetic data, see §14)
- **Basis:** `xgb.XGBRegressor(n_estimators=400, max_depth=5, learning_rate=0.04,
  subsample=0.8)`. For each event, joins violations within 5km / ±48h of the venue,
  computes `spike_multiplier = nearby_violation_count / dataset-wide hourly baseline`,
  then trains on `(expected_crowd_size, duration_hours, event_type) → spike_multiplier`.
- **Script:** [ml/06_event_model.py](../ml/06_event_model.py)
- **Output:** `event_spike.json` (model), `event_impacts.json`
- **API:** `GET /api/events/impact`
- **UI:** "Events" toolbar button → `EventImpactModal` (see §14 for the synthetic-data caveat)

### 6. Anomaly detection — Isolation Forest
- **Basis:** `sklearn.ensemble.IsolationForest(n_estimators=300, contamination=0.04)`
  over 6 zone-level features: `violation_count, avg_severity_weight,
  avg_vehicle_weight, obstruction_score, centrality_score, is_junction`. Currently
  flags **8/179 zones (4.5%)** — under the 5% DoD threshold.
- **Script:** [ml/07_anomaly.py](../ml/07_anomaly.py)
- **Output:** `anomalies.json`
- **API:** `GET /api/anomalies`
- **UI:** pulsing yellow `AnomalyPin` markers on the map, anomaly badge in drawer/sidebar, KPI count in TopBar

### 7. Enforcement engine — priority ranking
- **Basis:** `priority_score = 0.6·obstruction + 0.25·spike_risk + 0.15·(anomaly_flag×100)`,
  where `spike_risk` is each zone's peak forecasted count normalized against the max
  across all forecasted zones. Top 10 zones get a recommended officer count
  (`round(obstruction/20) + anomaly_bump`, capped 1–6), a 2-hour time window centered
  on the zone's peak hour, and a generated plain-English reason string.
- **Script:** [ml/08_enforce.py](../ml/08_enforce.py)
- **Output:** `enforcement_recs.json`
- **API:** `GET /api/enforcement`
- **UI:** `ZoneSidebar` ranked list, feeds the Schedule optimizer (§15) and CSV export (§11)

### 8. NL Query — Groq RAG
- **Basis:** Not a trained model — a context-grounded prompt. Builds a text context
  from the top 10 zones by obstruction score + top 5 anomalies, sends it as a system
  + user message to **Groq's `llama-3.3-70b-versatile`**, instructed to answer using
  *only* the provided context. Zone IDs are extracted from the response via regex to
  drive UI navigation (clicking a suggestion jumps the map to that zone).
- **Fallback:** if `GROQ_API_KEY` is unset or the call fails (rate limit, network),
  returns a deterministic templated answer built from the same top-3 zones — so the
  feature degrades instead of erroring during a live demo.
- **Script:** [api/app/query.py](../api/app/query.py)
- **API:** `POST /api/query`
- **UI:** `NLQueryBar` at the bottom of the dashboard, with example-question chips

---

## Extended features (added after initial build)

### 9. Repeat-offender leaderboard
- **Basis:** Groups violations by `vehicle_number` (already anonymized in the source
  CSV), keeps vehicles with ≥2 violations. Global top 50 + per-zone top 5.
- **Script:** [ml/09_repeat_offenders.py](../ml/09_repeat_offenders.py)
- **API:** `GET /api/repeat-offenders`, `GET /api/zones/{id}/repeat-offenders`
- **UI:** "Offenders" button in the map's top-right toolbar (`MapInsightsPanel`) →
  `RepeatOffendersModal`; clicking a vehicle jumps the map to its zone. Also an
  "Offenders" tab in the zone drawer for that specific zone's repeat vehicles.

### 10. Zone comparison mode
- **Basis:** Pure UI feature, no new ML — reuses `/api/zones/{id}` and
  `/api/forecast/{id}` for two zones side-by-side.
- **API:** existing zone/forecast endpoints, called twice
- **UI:** small ✓/+ toggle next to each sidebar card's severity badge. Picking a 2nd
  zone **auto-opens** `ComparePanel` (no extra click needed) as a centered modal.

### 11. Patrol sheet export (CSV)
- **Basis:** Pure client-side feature — serializes the already-loaded
  `enforcement_recs` array to CSV and triggers a browser download. No backend call.
- **Code:** [frontend/src/lib/csv.ts](../frontend/src/lib/csv.ts)
- **UI:** "Export patrol sheet (CSV)" button at the top of the sidebar

### 12. Cascade risk graph — NetworkX
- **Basis:** Builds a `networkx.Graph` connecting zone centroids within **1.5km** of
  each other (haversine distance), edge weight = `1/distance_km`. Each zone's
  `cascade_risk = 0.7·own_obstruction_score + 0.3·weighted_avg(neighbor_obstruction_scores)`
  — i.e. how much of its neighbors' congestion could realistically spill into it.
- **Script:** [ml/10_cascade.py](../ml/10_cascade.py)
- **Output:** `cascade_graph.json` (179 nodes, 135 edges at current radius)
- **API:** `GET /api/cascade`
- **UI:** "Cascade" toggle in the map's top-right toolbar (`MapInsightsPanel`) — unlike
  Offenders/Events this is a direct on/off layer toggle, not a modal, since it's a map
  overlay you look at rather than a list you browse. Lights up dashed risk-colored
  lines + nodes via `CascadeLayer` when active.

### 13. Historical trend view
- **Basis:** Groups violations by `(zone_id, month)` over the dataset's Nov
  2023–Apr 2024 span, counts + avg severity weight per month.
- **Script:** [ml/11_trend.py](../ml/11_trend.py)
- **Output:** `trend_global.json`, `trends/{zone_id}.json`
- **API:** `GET /api/trend`, `GET /api/zones/{id}/trend`
- **UI:** `TrendChart` (Recharts bar chart) in the zone drawer's Trend tab, with a worsening/improving/stable label

### 14. Astram events integration — ⚠ synthetic demo data
- **Basis:** The real Astram events export referenced in the original spec was never
  provided to this project. `ml/generate_synthetic_events.py` fabricates 40 plausible
  events at real Bengaluru venues (Chinnaswamy Stadium, Palace Grounds, etc.) with
  randomized dates/crowd sizes within the violation data's date range, every record
  tagged `is_synthetic=true`. This feeds the event-spike model (§5).
- **Script:** [ml/generate_synthetic_events.py](../ml/generate_synthetic_events.py)
- **UI:** "Events" button in the map's top-right toolbar (only shown when event data
  exists) → `EventImpactModal`, with the synthetic flag surfaced as a prominent yellow
  warning banner at the top — never silently presented as real data. **To go live:**
  replace `data/raw/astram_events.csv` with a real export (same columns, drop/false the
  `is_synthetic` flag) and re-run `06_event_model.py`.

### 15. Officer assignment optimizer
- **Basis:** Greedy bin-packing, not ML. Splits the day into 4 six-hour shifts
  (Night/Morning/Afternoon/Evening) with a fixed pool of **20 officers per shift**.
  Within each shift, sorts its zones (matched by `time_window` start hour) by
  `priority_score` descending and allocates `min(recommended_officers, remaining_pool)`
  to each — so the highest-priority zones are staffed first and the pool is never
  double-booked across overlapping zones.
- **Script:** [ml/12_optimizer.py](../ml/12_optimizer.py)
- **Output:** `shift_schedule.json`
- **API:** `GET /api/shift-schedule`
- **UI:** "Shift Schedule" button in the TopBar → `SchedulePanel` modal, one card per shift

### 16. Live timeline replay
- **Basis:** The dataset spans ~5 months with no single continuous "live" day, so
  replay is built from the **typical pattern at each hour-of-day (0–23)** rather than
  a literal timestamp scrub — i.e. "what does a typical 3am vs 6pm look like." Runs
  the same KDE method as §2, independently per hour-of-day subset, trimmed to ≤1200
  points/hour to keep the combined payload small (24 hours ≈ 0.1MB total).
- **Script:** [ml/13_hourly_heatmap.py](../ml/13_hourly_heatmap.py)
- **Output:** `hourly_heatmap.json`
- **API:** `GET /api/heatmap/hourly`
- **UI:** `TimelineReplay` control (bottom bar) — toggle Replay mode, play/pause, scrub 0–23, swaps the live `HeatLayer` for the selected hour's surface

### 17. Report generator — daily/weekly/monthly with PDF export
- **Basis:** Not a model — a rule-based aggregation + templated suggestion generator.
  `14_report_data.py` pre-aggregates the dataset's violation counts at 3 resolutions
  (daily `floor("D")`, weekly `to_period("W")`, monthly `to_period("M")`). The API's
  `build_report()` then: takes the most recent N points for the requested period
  (14 days / 12 weeks / 5 months), compares the latest point against the one before it
  for a `change_pct`, and pairs that with a **dataset-wide snapshot** (top 5 zones by
  obstruction score, severity counts, anomaly count, top 5 enforcement recs) — the
  snapshot itself isn't time-sliced per period since zone-level scores aren't computed
  per-day, so the report is explicit about what's period-specific (the trend/change)
  vs. dataset-wide (the zone snapshot). 4 suggestion rules fire conditionally: trend
  direction (>±10% change), top-zone callout, anomaly count, critical/high severity
  zones needing staffing — falls back to "conditions are stable" if none trigger.
- **Script:** [ml/14_report_data.py](../ml/14_report_data.py), logic in [api/app/report.py](../api/app/report.py)
- **Output:** `report_trends.json`
- **API:** `GET /api/report?period=daily|weekly|monthly`
- **UI:** "Generate Report" — first item in the Tools menu → `ReportModal`. Period
  tabs, KPI cards (total violations, period count with delta vs prior period,
  anomaly/critical counts), an area chart of the trend, a severity breakdown bar,
  top-5 zones, and the suggestions list. **"Download PDF"** renders the modal's content
  via `html2canvas` and paginates it into an A4 PDF with `jsPDF` — both libraries are
  dynamically imported (`lib/exportPdf.ts`) so they only load when a user actually
  clicks the button, keeping them out of the main bundle (~530KB combined, gzipped).

---

## UI architecture notes

### Modal pattern — `components/ui/Modal.tsx`
Every popup-style feature (Compare, Shift Schedule, Repeat Offenders, Event Impact)
shares one `Modal` component built on **React's `createPortal`**, rendering directly
into `document.body` instead of nesting inside the app's component tree. This was a
deliberate fix: an earlier version positioned these as `absolute`/`fixed` elements
*inside* the map's own container div, which shares a stacking context with Leaflet's
internal panes (which use z-index values up to 700 within that context) — the modals
could render visually behind the map despite having a numerically higher z-index.
Portaling to `document.body` sidesteps this category of bug entirely; no CSS property
on any ancestor (`backdrop-filter`, `transform`, Leaflet panes, etc.) can trap a
portaled element. The shared `Modal` handles: Escape-to-close, click-outside-to-close,
body scroll lock while open, and a consistent header/icon/title/close-button layout.

### Map toolbar consolidation — `components/MapInsightsPanel.tsx`
Originally Repeat Offenders, Event Impact, and the Cascade toggle were three separate
floating glass panels stacked in the map's corners, independently collapsible — this
read as cluttered. They're now one slim toolbar (top-right) with 3 buttons. Offenders
and Events open the shared `Modal` (full list, consistent with Compare/Schedule);
Cascade stays a direct layer toggle since you look at it on the map rather than browse
a list. The old `RepeatOffendersPanel.tsx` and `EventImpactPanel.tsx` inline-dropdown
components were deleted rather than left as dead code.

### Known chart-rendering quirk
Recharts' `ResponsiveContainer` initializes its internal state to `width: -1, height:
-1` before its first `ResizeObserver` callback fires — this prints a benign console
warning on every chart mount and self-corrects within a frame. It is **not** an error;
don't chase it further unless a chart actually renders blank after a fresh page load.
Separately, real overlapping-label and zero-width bugs were fixed in `ForecastChart` /
`TrendChart` / `ComparePanel`: `min-w-0` on flex children (the classic flexbox trap
that prevents `ResponsiveContainer` from shrinking correctly), angled + capped x-axis
ticks (~6 max) so dates never crowd, and switching the comparison columns from `flex`
to `grid` for more reliable sizing.

---

## Things that are NOT ML / NOT real-time

Worth being explicit about, since "AI platform" framing can imply more live inference
than actually happens:
- Every `/api/*` endpoint except `POST /api/query` serves **pre-computed JSON** loaded
  once at API startup — no per-request model inference, per the doc's own performance
  requirement (<200ms P95).
- "Duration" in the obstruction score is a **severity-based proxy**, not measured time
  (source data has no close timestamp).
- Event impact data is **synthetic** until a real Astram export is supplied (§14).
- "Live replay" (§16) is a **typical-hour pattern**, not a scrub through actual
  historical timestamps.
