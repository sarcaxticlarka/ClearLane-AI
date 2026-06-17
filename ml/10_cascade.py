"""Cascade risk graph: models how congestion at one zone propagates to nearby zones.

Builds a NetworkX graph connecting zones within CASCADE_RADIUS_KM of each other,
weighted by inverse distance, then computes a one-hop diffusion score per zone:
how much of its neighbors' obstruction could realistically spill into it.
"""
import json

import networkx as nx
import numpy as np
import pandas as pd

from config import OUTPUT_DIR

EARTH_RADIUS_KM = 6371
CASCADE_RADIUS_KM = 1.5


def haversine_km(lat1, lng1, lat2, lng2):
    lat1, lng1, lat2, lng2 = map(np.radians, [lat1, lng1, lat2, lng2])
    dlat, dlng = lat2 - lat1, lng2 - lng1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(a))


def main():
    with open(OUTPUT_DIR / "zone_scores.json") as f:
        zones = json.load(f)

    G = nx.Graph()
    for z in zones:
        G.add_node(z["zone_id"], **z)

    for i, a in enumerate(zones):
        for b in zones[i + 1 :]:
            dist = haversine_km(a["centroid_lat"], a["centroid_lng"], b["centroid_lat"], b["centroid_lng"])
            if dist <= CASCADE_RADIUS_KM and dist > 0:
                weight = 1 / dist
                G.add_edge(a["zone_id"], b["zone_id"], distance_km=round(float(dist), 3), weight=weight)

    cascade_risk = {}
    for zid in G.nodes:
        own_score = G.nodes[zid]["obstruction_score"]
        neighbor_influence = 0.0
        total_weight = 0.0
        for neighbor in G.neighbors(zid):
            w = G[zid][neighbor]["weight"]
            neighbor_influence += G.nodes[neighbor]["obstruction_score"] * w
            total_weight += w
        spillover = (neighbor_influence / total_weight) if total_weight > 0 else 0.0
        # cascade risk = own congestion plus a damped share of what neighbors could push onto it
        cascade_risk[zid] = round(min(100.0, own_score * 0.7 + spillover * 0.3), 2)

    nodes = [
        {
            "zone_id": zid,
            "centroid_lat": G.nodes[zid]["centroid_lat"],
            "centroid_lng": G.nodes[zid]["centroid_lng"],
            "obstruction_score": G.nodes[zid]["obstruction_score"],
            "cascade_risk": cascade_risk[zid],
            "degree": G.degree[zid],
        }
        for zid in G.nodes
    ]
    edges = [
        {"source": u, "target": v, "distance_km": G[u][v]["distance_km"]}
        for u, v in G.edges
    ]

    out = {"nodes": nodes, "edges": edges, "radius_km": CASCADE_RADIUS_KM}
    with open(OUTPUT_DIR / "cascade_graph.json", "w") as f:
        json.dump(out, f)

    high_risk = sorted(nodes, key=lambda n: -n["cascade_risk"])[:5]
    print(f"Cascade graph: {len(nodes)} nodes, {len(edges)} edges")
    for n in high_risk:
        print(f"  zone {n['zone_id']}: cascade_risk={n['cascade_risk']}, degree={n['degree']}")


if __name__ == "__main__":
    main()
