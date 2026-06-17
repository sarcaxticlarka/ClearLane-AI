# ClearLane AI — 90 Second Demo Script

**Pre-demo:** warm up both the deployed API and frontend URLs ~10 minutes before judging
to avoid cold-start latency.

| Time | Action | Spoken line |
|------|--------|-------------|
| 0-10s | Open dashboard, let heatmap render | "This is ClearLane AI — we turned 300,000 raw parking violation records into a live enforcement map for Bengaluru Traffic Police." |
| 10-25s | Pan/zoom map over heatmap + zone markers | "Each glow is a real illegal-parking hotspot, clustered with DBSCAN from GPS-tagged violations. Red and orange zones have the highest Obstruction Scores — a 0-100 metric blending violation density, severity, duration, and road centrality." |
| 25-40s | Click a critical zone marker, drawer opens | "Clicking a zone shows the real police station, junction, and a 48-hour Prophet forecast of expected violations — so enforcement isn't reactive, it's anticipated." |
| 40-55s | Point to yellow pulsing anomaly pin | "These pulsing pins are zones an Isolation Forest model flagged as statistically anomalous — unusual spikes that a human reviewing 300K rows would never catch." |
| 55-70s | Switch to sidebar, scroll enforcement list | "This ranked list is our enforcement engine's output: top-10 zones by priority score, each with a recommended officer count and exact time window to deploy them." |
| 70-85s | Type a question into the NL query bar | "And you can just ask it — 'which zone needs the most officers right now?' — it answers in plain English, grounded only in this real data." |
| 85-90s | Close on the dashboard | "From raw CSV to actionable enforcement plan — that's ClearLane AI." |

## Extended walkthrough (if you have more than 90 seconds)

Past the core 90s, these are worth a beat each — full detail in [docs/FEATURES.md](FEATURES.md):

- **Cascade Risk toggle** (top-left of map) — shows congestion spillover between nearby zones via a NetworkX graph
- **Repeat Offenders panel** (top-right) — vehicles with the most recorded violations, clickable to jump to their zone
- **Zone comparison** — "+Compare" two sidebar cards to see obstruction/forecast side-by-side
- **Trend tab** in the zone drawer — monthly violation trend, labeled worsening/improving/stable
- **Shift Schedule** (TopBar button) — the officer assignment optimizer's greedy allocation across 4 shifts
- **Replay mode** (bottom bar) — animates the typical violation pattern hour-by-hour
- **Export patrol sheet** (sidebar) — downloads the enforcement list as CSV
- **Event Impact panel** — flag clearly that this uses **synthetic demo events**, not a real Astram export, if asked

## Submission checklist

- [ ] README with setup instructions for ML pipeline, API, and frontend
- [ ] `docs/FEATURES.md` up to date with any features added since this checklist was last touched
- [ ] Deployed API URL (Render/Railway) and frontend URL (Vercel)
- [ ] Both URLs warmed up 10 minutes before judging
- [ ] Clean git history; raw CSVs, `.venv`, `node_modules`, `*.graphml`, `*.pkl` gitignored
- [ ] Full demo flow tested on the **deployed** URLs, not localhost
- [ ] `.env.example` committed, real `.env` gitignored (now `GROQ_API_KEY`, not `GEMINI_API_KEY`)
- [ ] If asked about Event Impact data, disclose it's synthetic (UI already shows this warning)
