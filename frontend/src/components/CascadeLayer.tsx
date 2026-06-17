import { CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import type { CascadeGraph } from '../types/api';

interface CascadeLayerProps {
  graph: CascadeGraph;
}

function riskColor(risk: number): string {
  if (risk >= 70) return '#f87171';
  if (risk >= 50) return '#fb923c';
  if (risk >= 30) return '#facc15';
  return '#38bdf8';
}

export function CascadeLayer({ graph }: CascadeLayerProps) {
  const nodeById = new Map(graph.nodes.map((n) => [n.zone_id, n]));

  return (
    <>
      {graph.edges.map((edge, idx) => {
        const a = nodeById.get(edge.source);
        const b = nodeById.get(edge.target);
        if (!a || !b) return null;
        const avgRisk = (a.cascade_risk + b.cascade_risk) / 2;
        return (
          <Polyline
            key={idx}
            positions={[
              [a.centroid_lat, a.centroid_lng],
              [b.centroid_lat, b.centroid_lng],
            ]}
            pathOptions={{ color: riskColor(avgRisk), weight: 1.5, opacity: 0.45, dashArray: '4 4' }}
          />
        );
      })}
      {graph.nodes
        .filter((n) => n.degree > 0)
        .map((n) => (
          <CircleMarker
            key={n.zone_id}
            center={[n.centroid_lat, n.centroid_lng]}
            radius={4}
            pathOptions={{ color: riskColor(n.cascade_risk), fillColor: riskColor(n.cascade_risk), fillOpacity: 0.9, weight: 1 }}
          >
            <Tooltip direction="top" offset={[0, -4]}>
              Zone {n.zone_id} · cascade risk {n.cascade_risk}
            </Tooltip>
          </CircleMarker>
        ))}
    </>
  );
}
