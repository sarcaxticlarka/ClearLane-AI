import { lazy, Suspense, useState } from 'react';
import { ZoneSidebar } from './components/ZoneSidebar';
import { ZoneDrawer } from './components/ZoneDrawer';
import { TopBar } from './components/TopBar';
import { TimeSlider } from './components/TimeSlider';
import { TimelineReplay } from './components/TimelineReplay';
import { NLQueryBar } from './components/NLQueryBar';
import { ComparePanel } from './components/ComparePanel';
import { SchedulePanel } from './components/SchedulePanel';

const MapCanvas = lazy(() => import('./components/MapCanvas').then((m) => ({ default: m.MapCanvas })));

function App() {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <div className="app-shell flex h-screen w-screen flex-col">
      <TopBar onOpenSchedule={() => setScheduleOpen(true)} />
      <main className="flex flex-1 overflow-hidden">
        <ZoneSidebar />
        <div className="relative flex-1">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-gray-500">Loading map...</div>}>
            <MapCanvas />
          </Suspense>
        </div>
        <ZoneDrawer />
      </main>
      <TimeSlider />
      <TimelineReplay />
      <NLQueryBar />
      <ComparePanel />
      <SchedulePanel open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </div>
  );
}

export default App;
