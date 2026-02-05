import { useState } from 'react';
import { Scene } from './components/Scene';
import { FlowchartView } from './components/FlowchartView';
import { HUDPanels } from './components/HUDPanel';
import { useWebSocket, useDemoMode } from './hooks/useWebSocket';
import './App.css';

// Set to true to see simulated data, false for real connections only
const DEMO_MODE = true;

type ViewMode = '3d' | '2d';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('2d');

  // Demo mode shows fake activity, real mode connects to actual servers
  if (DEMO_MODE) {
    useDemoMode();
  } else {
    useWebSocket();
  }

  return (
    <div className="app monochrome">
      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={viewMode === '2d' ? 'active' : ''}
          onClick={() => setViewMode('2d')}
        >
          SCHEMATIC
        </button>
        <button
          className={viewMode === '3d' ? 'active' : ''}
          onClick={() => setViewMode('3d')}
        >
          3D VIEW
        </button>
      </div>

      {/* Main View */}
      {viewMode === '3d' ? <Scene /> : <FlowchartView />}

      {/* HUD Panels */}
      <HUDPanels />
    </div>
  );
}

export default App;
