import { memo } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import type { ZoneCard } from '../types/api';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

interface ZoneMarkerProps {
  zone: ZoneCard;
  onSelect: (zoneId: number) => void;
  dimmed?: boolean;
}

export const ZoneMarker = memo(function ZoneMarker({ zone, onSelect, dimmed }: ZoneMarkerProps) {
  const color = SEVERITY_COLORS[zone.severity] ?? '#6b7280';
  return (
    <CircleMarker
      center={[zone.centroid_lat, zone.centroid_lng]}
      radius={5 + Math.min(zone.obstruction_score / 12, 8)}
      pathOptions={{ color, fillColor: color, fillOpacity: dimmed ? 0.12 : 0.55, weight: 1 }}
      eventHandlers={{ click: () => onSelect(zone.zone_id) }}
    >
      <Popup>
        <strong>Zone {zone.zone_id}</strong> ({zone.severity})
        <br />
        {zone.dominant_police_station}
        <br />
        Obstruction: {zone.obstruction_score}/100
        <br />
        Violations: {zone.violation_count}
      </Popup>
    </CircleMarker>
  );
});
