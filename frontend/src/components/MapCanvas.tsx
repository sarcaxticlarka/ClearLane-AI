import { Component, type ErrorInfo, type ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useZones } from '../hooks/useZones';
import { useHeatmap } from '../hooks/useHeatmap';
import { useAnomalies } from '../hooks/useAnomalies';
import { useCascadeGraph } from '../hooks/useCascadeGraph';
import { useDashboardStore } from '../store/useDashboardStore';
import { HeatLayer } from './HeatLayer';
import { ZoneMarker } from './ZoneMarker';
import { AnomalyPin } from './AnomalyPin';
import { CascadeLayer } from './CascadeLayer';

const MAP_CENTER: [number, number] = [12.97, 77.59];
const MAP_ZOOM = 12;

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MapCanvas crashed', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center text-red-400">
          Map failed to load. Please refresh.
        </div>
      );
    }
    return this.props.children;
  }
}

function MapCanvasInner() {
  const { zones } = useZones();
  const { heatmap } = useHeatmap();
  const { anomalies } = useAnomalies();
  const selectZone = useDashboardStore((s) => s.selectZone);
  const hourFilter = useDashboardStore((s) => s.hourFilter);
  const cascadeLayerOn = useDashboardStore((s) => s.cascadeLayerOn);
  const { graph: cascadeGraph } = useCascadeGraph(cascadeLayerOn);
  const replayMode = useDashboardStore((s) => s.replayMode);
  const replayHour = useDashboardStore((s) => s.replayHour);
  const hourlyHeatmap = useDashboardStore((s) => s.hourlyHeatmap);

  const replayPoints = replayMode ? hourlyHeatmap?.hours[String(replayHour)] ?? [] : null;
  const activeHeatmapPoints = replayMode ? replayPoints : heatmap?.points;

  return (
    <div className="relative h-full w-full">
      <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        {activeHeatmapPoints && <HeatLayer key={replayMode ? `replay-${replayHour}` : 'live'} points={activeHeatmapPoints} />}
        {cascadeLayerOn && cascadeGraph && <CascadeLayer graph={cascadeGraph} />}
        {zones.map((zone) => (
          <ZoneMarker
            key={zone.zone_id}
            zone={zone}
            onSelect={selectZone}
            dimmed={hourFilter !== null && zone.peak_hour !== hourFilter}
          />
        ))}
        {anomalies.map((a) => (
          <AnomalyPin key={a.zone_id} anomaly={a} />
        ))}
      </MapContainer>
      {replayMode && (
        <div className="glass-panel pulse-ring absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-cyan-400/40 px-4 py-1.5 text-xs text-cyan-200">
          Replaying typical {String(replayHour).padStart(2, '0')}:00 pattern
        </div>
      )}
    </div>
  );
}

export function MapCanvas() {
  return (
    <MapErrorBoundary>
      <MapCanvasInner />
    </MapErrorBoundary>
  );
}
