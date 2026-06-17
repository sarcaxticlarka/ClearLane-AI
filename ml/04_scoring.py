"""Phase 2.1: Obstruction Score per zone.

score = (0.30*density + 0.25*severity + 0.20*duration + 0.15*centrality) * junction_mult * 100
"""
import json

import networkx as nx
import numpy as np
import osmnx as ox
import pandas as pd

from config import (
    JUNCTION_MULTIPLIER,
    MAP_CENTER,
    OBSTRUCTION_WEIGHTS,
    OUTPUT_DIR,
    SEVERITY_LABEL_THRESHOLDS,
)

GRAPH_CACHE_PATH = OUTPUT_DIR / "road_graph.graphml"
GRAPH_DIST_M = 15000  # radius around Bengaluru center to cover the violation bbox


def get_road_graph():
    if GRAPH_CACHE_PATH.exists():
        print("Loading cached road graph...")
        return ox.load_graphml(GRAPH_CACHE_PATH)
    print("Fetching osmnx road graph (this can take a while)...")
    G = ox.graph_from_point(MAP_CENTER, dist=GRAPH_DIST_M, network_type="drive")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ox.save_graphml(G, GRAPH_CACHE_PATH)
    return G


def nearest_node_centrality(G, centrality: dict, lat: float, lng: float) -> float:
    node = ox.distance.nearest_nodes(G, lng, lat)
    return centrality.get(node, 0.0)


def severity_label(score: float) -> str:
    t = SEVERITY_LABEL_THRESHOLDS
    if score >= t["critical"]:
        return "critical"
    if score >= t["high"]:
        return "high"
    if score >= t["medium"]:
        return "medium"
    return "low"


def main():
    with open(OUTPUT_DIR / "zone_stats.json") as f:
        zones = json.load(f)

    try:
        G = get_road_graph()
        centrality = nx.betweenness_centrality(G, k=min(500, len(G.nodes)), weight="length")
        have_graph = True
    except Exception as e:
        print(f"osmnx graph fetch failed ({e}); falling back to centrality=0 for all zones")
        G, centrality, have_graph = None, {}, False

    max_count = max(z["violation_count"] for z in zones)
    w = OBSTRUCTION_WEIGHTS

    scored = []
    for z in zones:
        density = z["violation_count"] / max_count
        severity = z["avg_severity_weight"]
        duration = min(z.get("avg_vehicle_weight", 0.5), 1.0)  # proxy: vehicle footprint as duration weight

        centrality_score = 0.0
        if have_graph:
            try:
                centrality_score = nearest_node_centrality(G, centrality, z["centroid_lat"], z["centroid_lng"])
                centrality_score = min(centrality_score / (max(centrality.values()) or 1), 1.0)
            except Exception:
                centrality_score = 0.0

        junction_mult = JUNCTION_MULTIPLIER if z["is_junction"] else 1.0
        raw_score = (
            w["density"] * density
            + w["severity"] * severity
            + w["duration"] * duration
            + w["centrality"] * centrality_score
        ) * junction_mult * 100
        score = min(raw_score, 100.0)

        scored.append({
            **z,
            "obstruction_score": round(score, 2),
            "severity": severity_label(score),
            "centrality_score": round(centrality_score, 4),
        })

    scored.sort(key=lambda z: -z["obstruction_score"])
    with open(OUTPUT_DIR / "zone_scores.json", "w") as f:
        json.dump(scored, f, indent=2)

    counts = pd.Series([z["severity"] for z in scored]).value_counts()
    print(counts)
    print(f"Wrote zone_scores.json ({len(scored)} zones)")


if __name__ == "__main__":
    main()
