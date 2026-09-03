import React, { useState, useEffect } from 'react';
import { RobotModelType, AppMode, RobotState } from './types/robot';
import { Header } from './components/Header';
import { KidHomeView } from './components/KidHomeView';
import { SchoolLMSView } from './components/SchoolLMSView';
import { DoodleModeView } from './components/DoodleModeView';
import { NotebookView } from './notebook/NotebookView';
import { bleService } from './ble/BLEManager';

export function App() {
  const [activeModel, setActiveModel] = useState<RobotModelType>('mini_gm');
  const [appMode, setAppMode] = useState<AppMode>(() => {
    try {
      const saved = localStorage.getItem('mg_app_mode');
      if (saved === 'kid_home' || saved === 'school_lms' || saved === 'doodle' || saved === 'notebook') return saved;
    } catch { /* noop */ }
    return 'kid_home';
  });
  const [isBleConnected, setIsBleConnected] = useState<boolean>(false);
  const [robotState, setRobotState] = useState<RobotState>(bleService.getState());

  useEffect(() => {
    bleService.onConnectionChange((connected) => {
      setIsBleConnected(connected);
    });

    bleService.onStateUpdate((newState) => {
      setRobotState({ ...newState } as RobotState);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mode = appMode;
    try { localStorage.setItem('mg_app_mode', appMode); } catch { /* noop */ }
  }, [appMode]);

  const handleModelSelect = (model: RobotModelType) => {
    setActiveModel(model);
    bleService.setModel(model);
  };

  const handleBleConnect = async () => {
    if (isBleConnected) {
      await bleService.disconnect();
    } else {
      await bleService.connect(activeModel);
    }
  };

  return (
    <div className="app-viewport-wrapper flex flex-col min-h-screen w-screen text-slate-100 select-none">
      {/* Universal Top Header */}
      <Header
        activeModel={activeModel}
        onModelSelect={handleModelSelect}
        appMode={appMode}
        onToggleMode={setAppMode}
        isBleConnected={isBleConnected}
        onBleConnect={handleBleConnect}
        battery={robotState.batteryLevel}
      />

      {/* Main View Area (Kid Explorer vs School LMS vs Doodle Sketchbook) */}
      <main className="main-dashboard-content relative z-[1] flex-1 flex overflow-hidden pt-1 sm:pt-2">
        {appMode === 'doodle' ? (
          <DoodleModeView />
        ) : appMode === 'notebook' ? (
          <NotebookView />
        ) : appMode === 'kid_home' ? (
          <KidHomeView activeModel={activeModel} state={robotState} />
        ) : (
          <SchoolLMSView activeModel={activeModel} />
        )}
      </main>
    </div>
  );
}

export default App;
