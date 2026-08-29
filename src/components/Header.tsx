import React from 'react';
import { RobotModelType, ROBOT_MODELS, AppMode } from '../types/robot';
import { Bluetooth, BluetoothConnected, School, Home, ChevronDown, Award, BatteryCharging, Maximize, Minimize, Sparkles, ShieldCheck } from 'lucide-react';

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

  const isSchool = appMode === 'school_lms';

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
    <header className={`min-h-14 sm:h-16 px-2 sm:px-6 py-1.5 sm:py-0 flex items-center justify-between relative z-10 flex-wrap gap-2 transition-colors duration-500 border-b ${
      isSchool 
        ? 'bg-slate-950/95 border-slate-800 shadow-xl shadow-slate-950/50' 
        : 'bg-slate-900/95 border-purple-900/40 shadow-xl shadow-purple-950/20'
    }`}>
      {/* Brand & Model Selector */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-xl sm:text-2xl transition-transform ${!isSchool ? 'animate-bounce' : ''}`}>
            {isSchool ? '🏛️' : '🤖'}
          </span>
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5">
              <h1 className={`text-sm sm:text-base font-black ${
                isSchool 
                  ? 'text-white tracking-wide font-mono' 
                  : 'bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent'
              }`}>
                {isSchool ? 'منظومة ميني جي الأكاديمية' : 'مغامرات ميني جي للروبوتكس'}
              </h1>
              {isSchool ? (
                <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded-md">
                  STEM ACADEMY
                </span>
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-kid-yellow animate-spin" />
              )}
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
              {isSchool ? 'Mini G Institutional Robotics & STEM Control Hub' : 'Creative Kids Coding & Robotics Lab'}
            </p>
          </div>
        </div>

        {/* Model Dropdown Picker */}
        <div className="relative">
          <button 
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-white font-bold text-[11px] sm:text-xs shadow-md transition transform active:scale-95 ${
              isSchool
                ? 'bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200'
                : `bg-gradient-to-r ${modelInfo.badgeColor} shadow-purple-900/30`
            }`}
          >
            <span>{modelInfo.nameAr}</span>
            <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md hidden sm:inline ${
              isSchool ? 'bg-slate-900 text-blue-400 font-mono' : 'bg-black/30'
            }`}>
              {modelInfo.price}
            </span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-80" />
          </button>

          {/* Menu Dropdown */}
          {modelDropdownOpen && (
            <div 
              onMouseLeave={() => setModelDropdownOpen(false)}
              className="absolute top-full right-0 mt-2 w-60 sm:w-68 bg-slate-900 border border-slate-750 rounded-2xl p-2 shadow-2xl transition z-50 backdrop-blur-xl"
            >
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 px-2 py-1">اختر إصدار الروبوت المستهدف:</div>
              {(Object.keys(ROBOT_MODELS) as RobotModelType[]).map((key) => {
                const m = ROBOT_MODELS[key];
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onModelSelect(key);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-right p-2.5 rounded-xl mb-1 flex items-center justify-between transition ${
                      activeModel === key 
                        ? (isSchool ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold' : 'bg-purple-600 text-white font-bold') 
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{m.nameAr}</div>
                      <div className="text-[9px] text-slate-400">{m.categoryAr}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">{m.price}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mode Switcher (School Edition vs Kid Home Edition) */}
      <div className={`flex items-center p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border transition-all ${
        isSchool ? 'bg-slate-900 border-slate-750 shadow-inner' : 'bg-slate-950 border-purple-900/40'
      }`}>
        <button
          onClick={() => onToggleMode('kid_home')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs transition ${
            appMode === 'kid_home'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">نسخة الطفل والمغامرة 🌟</span>
          <span className="sm:hidden">الطفل</span>
        </button>

        <button
          onClick={() => onToggleMode('school_lms')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs transition ${
            appMode === 'school_lms'
              ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white border border-blue-400/30 shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
          <span className="hidden sm:inline">النسخة المدرسية والأكاديمية 🏛️</span>
          <span className="sm:hidden">المدرسة</span>
        </button>
      </div>

      {/* Bluetooth & Telemetry Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Fullscreen Theatre Presentation Mode */}
        <button
          onClick={toggleFullscreen}
          className={`p-1.5 sm:p-2 rounded-xl transition shadow active:scale-95 border ${
            isSchool 
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-750 text-slate-300' 
              : 'bg-slate-800 hover:bg-slate-750 border-purple-800/40 text-purple-300'
          }`}
          title="وضع العرض المسرحي الكامل للفصل والشاشات الكبيرة"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Battery Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold">
          <BatteryCharging className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          <span className="font-mono">{battery}%</span>
        </div>

        {/* BLE Connect Button */}
        <button
          onClick={onBleConnect}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs shadow-md transition transform active:scale-95 ${
            isBleConnected
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
              : isSchool
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 border border-blue-400/30'
              : 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white hover:brightness-110'
          }`}
        >
          {isBleConnected ? (
            <>
              <BluetoothConnected className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
              <span>متصل (Live)</span>
            </>
          ) : (
            <>
              <Bluetooth className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>اقتران BLE 📶</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
