import React from 'react';
import { RobotModelType, ROBOT_MODELS, AppMode } from '../types/robot';
import { Bluetooth, BluetoothConnected, School, Home, ChevronDown, Award, BatteryCharging, Maximize, Minimize } from 'lucide-react';

interface Props {
  activeModel: RobotModelType;
  onModelSelect: (model: RobotModelType) => void;
  appMode: AppMode;
  onToggleMode: (mode: AppMode) => void;
  isBleConnected: boolean;
  onBleConnect: () => void;
  battery: number;
}

export const Header: React.FC<Props> = ({
  activeModel,
  onModelSelect,
  appMode,
  onToggleMode,
  isBleConnected,
  onBleConnect,
  battery,
}) => {
  const modelInfo = ROBOT_MODELS[activeModel];
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="min-h-14 sm:h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-2 sm:px-4 py-1.5 sm:py-0 flex items-center justify-between sticky top-0 z-40 flex-wrap gap-2">
      {/* Brand & Model Selector */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl">🤖</span>
          <div className="hidden md:block">
            <h1 className="text-sm sm:text-base font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              منصة ميني جي
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Mini G Studio</p>
          </div>
        </div>

        {/* Model Dropdown Picker */}
        <div className="relative">
          <button 
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r ${modelInfo.badgeColor} text-white font-bold text-[11px] sm:text-xs shadow-md transition transform active:scale-95`}
          >
            <span>{modelInfo.nameAr}</span>
            <span className="text-[9px] sm:text-[10px] bg-black/30 px-1 sm:px-1.5 py-0.5 rounded-md hidden sm:inline">{modelInfo.price}</span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-80" />
          </button>

          {/* Menu Dropdown */}
          {modelDropdownOpen && (
            <div 
              onMouseLeave={() => setModelDropdownOpen(false)}
              className="absolute top-full right-0 mt-2 w-56 sm:w-64 bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-2xl transition z-50"
            >
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 px-2 py-1">اختر إصدار الروبوت:</div>
              {(Object.keys(ROBOT_MODELS) as RobotModelType[]).map((key) => {
                const m = ROBOT_MODELS[key];
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onModelSelect(key);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-right p-2 rounded-xl mb-1 flex items-center justify-between transition ${
                      activeModel === key ? 'bg-slate-700 text-white font-bold' : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{m.nameAr}</div>
                      <div className="text-[9px] text-slate-400">{m.categoryAr}</div>
                    </div>
                    <span className="text-xs font-bold text-kid-yellow">{m.price}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mode Switcher (School Edition vs Kid Home Edition) */}
      <div className="flex items-center bg-slate-950 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-800 text-[11px] sm:text-xs">
        <button
          onClick={() => onToggleMode('kid_home')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold transition ${
            appMode === 'kid_home'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">النسخة الخاصة</span>
          <span className="sm:hidden">الطفل</span>
        </button>

        <button
          onClick={() => onToggleMode('school_lms')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold transition ${
            appMode === 'school_lms'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <School className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">النسخة المدرسية</span>
          <span className="sm:hidden">المدرسة</span>
        </button>
      </div>

      {/* Bluetooth & Telemetry Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Fullscreen Theatre Presentation Mode */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shadow active:scale-95 border border-slate-700"
          title="وضع العرض المسرحي الكامل للفصل والشاشات الكبيرة"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" /> : <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Battery Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
          <BatteryCharging className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          <span>{battery}%</span>
        </div>

        {/* BLE Connect Button */}
        <button
          onClick={onBleConnect}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs shadow-md transition transform active:scale-95 ${
            isBleConnected
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500'
          }`}
        >
          {isBleConnected ? (
            <>
              <BluetoothConnected className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
              <span>متصل</span>
            </>
          ) : (
            <>
              <Bluetooth className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>اقتران BLE</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
