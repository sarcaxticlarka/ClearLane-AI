import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { HeatmapPoint } from '../types/api';

interface HeatLayerProps {
  points: HeatmapPoint[];
}

export function HeatLayer({ points }: HeatLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const heatPoints: Array<[number, number, number]> = points.map((p) => [p.lat, p.lng, p.intensity]);
    const layer = L.heatLayer(heatPoints, { radius: 18, blur: 22, maxZoom: 16 });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}
