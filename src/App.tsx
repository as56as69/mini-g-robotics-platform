import React, { useState, useEffect } from 'react';
import { RobotModelType, AppMode, RobotState } from './types/robot';
import { Header } from './components/Header';
import { KidHomeView } from './components/KidHomeView';
import { SchoolLMSView } from './components/SchoolLMSView';
import { bleService } from './ble/BLEManager';

export function App() {
  const [activeModel, setActiveModel] = useState<RobotModelType>('mini_gm');
  const [appMode, setAppMode] = useState<AppMode>('kid_home');
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
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
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

      {/* Main View Area (Kid Explorer vs School LMS) */}
      <main className="flex-1 flex overflow-hidden">
        {appMode === 'kid_home' ? (
          <KidHomeView activeModel={activeModel} state={robotState} />
        ) : (
          <SchoolLMSView activeModel={activeModel} />
        )}
      </main>
    </div>
  );
}

export default App;
