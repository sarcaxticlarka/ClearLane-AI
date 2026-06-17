import { useEffect, useRef } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import type L from 'leaflet';
import { gsap } from 'gsap';
import type { AnomalyAlert } from '../types/api';

interface AnomalyPinProps {
  anomaly: AnomalyAlert;
}

export function AnomalyPin({ anomaly }: AnomalyPinProps) {
  const ref = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    const marker = ref.current;
    if (!marker) return;
    const el = marker.getElement();
    if (!el) return;

    const tween = gsap.to(el, {
      attr: { r: 14 },
      opacity: 0.3,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <CircleMarker
      ref={ref}
      center={[anomaly.centroid_lat, anomaly.centroid_lng]}
      radius={9}
      pathOptions={{ color: '#facc15', fillColor: '#facc15', fillOpacity: 0.8, weight: 2 }}
    >
      <Popup>
        <strong>Zone {anomaly.zone_id}</strong>
        <br />
        {anomaly.dominant_police_station}
        <br />
        Anomaly score: {anomaly.anomaly_score}
      </Popup>
    </CircleMarker>
  );
}
