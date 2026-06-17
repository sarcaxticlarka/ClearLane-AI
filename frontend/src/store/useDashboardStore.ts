import { create } from 'zustand';
import type { HourlyHeatmapResponse, ZoneCard, ZoneDetail } from '../types/api';

const MAX_COMPARE = 2;

interface DashboardState {
  zones: ZoneCard[];
  selectedZoneId: number | null;
  selectedZoneDetail: ZoneDetail | null;
  drawerOpen: boolean;
  hourFilter: number | null;
  compareZoneIds: number[];
  compareOpen: boolean;
  cascadeLayerOn: boolean;
  replayMode: boolean;
  replayHour: number;
  replayPlaying: boolean;
  hourlyHeatmap: HourlyHeatmapResponse | null;
  setZones: (zones: ZoneCard[]) => void;
  selectZone: (zoneId: number | null) => void;
  setSelectedZoneDetail: (detail: ZoneDetail | null) => void;
  closeDrawer: () => void;
  setHourFilter: (hour: number | null) => void;
  toggleCompareZone: (zoneId: number) => void;
  setCompareOpen: (open: boolean) => void;
  clearCompare: () => void;
  toggleCascadeLayer: () => void;
  setReplayMode: (on: boolean) => void;
  setReplayHour: (hour: number) => void;
  setReplayPlaying: (playing: boolean) => void;
  advanceReplayHour: () => void;
  setHourlyHeatmap: (data: HourlyHeatmapResponse) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  zones: [],
  selectedZoneId: null,
  selectedZoneDetail: null,
  drawerOpen: false,
  hourFilter: null,
  compareZoneIds: [],
  compareOpen: false,
  cascadeLayerOn: false,
  replayMode: false,
  replayHour: 0,
  replayPlaying: false,
  hourlyHeatmap: null,
  setZones: (zones) => set({ zones }),
  selectZone: (zoneId) => set({ selectedZoneId: zoneId, drawerOpen: zoneId !== null }),
  setSelectedZoneDetail: (detail) => set({ selectedZoneDetail: detail }),
  closeDrawer: () => set({ drawerOpen: false, selectedZoneId: null }),
  setHourFilter: (hour) => set({ hourFilter: hour }),
  toggleCompareZone: (zoneId) =>
    set((state) => {
      if (state.compareZoneIds.includes(zoneId)) {
        return { compareZoneIds: state.compareZoneIds.filter((id) => id !== zoneId), compareOpen: false };
      }
      if (state.compareZoneIds.length >= MAX_COMPARE) {
        return { compareZoneIds: [state.compareZoneIds[1], zoneId], compareOpen: true };
      }
      const next = [...state.compareZoneIds, zoneId];
      // Auto-open as soon as a 2nd zone is picked — no extra click needed, and
      // nothing relies on a banner that could be scrolled out of view.
      return { compareZoneIds: next, compareOpen: next.length === MAX_COMPARE };
    }),
  setCompareOpen: (open) => set({ compareOpen: open }),
  clearCompare: () => set({ compareZoneIds: [], compareOpen: false }),
  toggleCascadeLayer: () => set((state) => ({ cascadeLayerOn: !state.cascadeLayerOn })),
  setReplayMode: (on) => set({ replayMode: on, replayPlaying: false }),
  setReplayHour: (hour) => set({ replayHour: hour }),
  setReplayPlaying: (playing) => set({ replayPlaying: playing }),
  advanceReplayHour: () => set((state) => ({ replayHour: (state.replayHour + 1) % 24 })),
  setHourlyHeatmap: (data) => set({ hourlyHeatmap: data }),
}));
