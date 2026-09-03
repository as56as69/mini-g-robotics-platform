import React from 'react';
import { RobotModelType, ROBOT_MODELS, AppMode } from '../types/robot';
import { Bluetooth, BluetoothConnected, School, Home, ChevronDown, Award, BatteryCharging, Maximize, Minimize, Sparkles, ShieldCheck, Pencil, BookOpen } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = React.useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  const [modelDropdownOpen, setModelDropdownOpen] = React.useState(false);

  // Track the REAL fullscreen state (covers Esc exit + rejected requests)
  React.useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const isSchool = appMode === 'school_lms';
  const isDoodle = appMode === 'doodle';
  const isNotebook = appMode === 'notebook';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className={`min-h-14 sm:h-16 px-2 sm:px-6 py-1.5 sm:py-0 flex items-center justify-between relative z-20 mb-3 sm:mb-4 flex-wrap gap-2 transition-colors duration-500 border-b ${
      isDoodle
        ? 'bg-[#fdfbf4] border-[#2b2a33]/20 shadow-[0_2px_0_rgba(43,42,51,0.08)]'
        : isNotebook
        ? 'bg-[#fff7ec] border-[#6c5ce7]/25 shadow-[0_2px_0_rgba(108,92,231,0.1)]'
        : isSchool
        ? 'bg-slate-950/95 border-slate-800 shadow-xl shadow-slate-950/50'
        : 'bg-slate-900/95 border-purple-900/40 shadow-xl shadow-purple-950/20'
    }`}>
      {/* Brand & Model Selector */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-xl sm:text-2xl transition-transform ${!isSchool && !isDoodle && !isNotebook ? 'animate-bounce' : ''} ${isDoodle ? 'doodle-monster' : isNotebook ? 'notebook-logo' : ''}`}>
            {isDoodle ? '✏️' : isNotebook ? '📒' : isSchool ? '🏛️' : '🤖'}
          </span>
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5">
              <h1 className={`text-sm sm:text-base font-black ${
                isDoodle
                  ? 'text-[#2b2a33] doodle-title text-lg'
                  : isNotebook
                  ? 'text-[#6c5ce7] text-lg'
                  : isSchool
                  ? 'text-white tracking-wide font-mono'
                  : 'bg-gradient-to-r from-kid-primary via-kid-accent to-kid-glow bg-clip-text text-transparent'
              }`}>
                {isDoodle ? 'كود ماجيك ✏️' : isNotebook ? 'الدفتر التفاعلي 📒' : isSchool ? 'منظومة ميني جي الأكاديمية' : 'مغامرات ميني جي للروبوتكس'}
              </h1>
              {isDoodle ? (
                <span className="text-[9px] font-bold bg-[#ffd93d]/30 text-[#2b2a33] border border-[#2b2a33]/30 px-1.5 py-0.2 rounded-md doodle-title">
                  دفتر الكود السحري
                </span>
              ) : isNotebook ? (
                <span className="text-[9px] font-bold bg-[#6c5ce7]/15 text-[#6c5ce7] border border-[#6c5ce7]/30 px-1.5 py-0.2 rounded-md">
                  بيئة تعليمية تفاعلية
                </span>
              ) : isSchool ? (
                <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded-md">
                  STEM ACADEMY
                </span>
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-kid-yellow animate-spin" />
              )}
            </div>
            <p className={`text-[9px] sm:text-[10px] font-medium ${isDoodle ? 'text-[#2b2a33]/60' : isNotebook ? 'text-[#6c5ce7]/70' : 'text-slate-400'}`}>
              {isDoodle ? 'دفتر الرسم السحري لتعلم البرمجة — Doodle Code Magic' : isNotebook ? 'دفتر بغداد للروضة والأول الابتدائي — Interactive Notebook' : isSchool ? 'Mini G Institutional Robotics & STEM Control Hub' : 'Creative Kids Coding & Robotics Lab'}
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
        isSchool ? 'bg-slate-900 border-slate-750 shadow-inner' : 'bg-slate-950 border-kid-primary/40'
      }`}>
        <button
          onClick={() => onToggleMode('kid_home')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs transition ${
            appMode === 'kid_home'
              ? 'active-tab-kid bg-gradient-to-r from-kid-primary via-kid-accent to-kid-glow text-white shadow-lg shadow-kid-primary/40'
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
              ? 'active-tab-school bg-gradient-to-r from-school-primary to-school-primaryDeep text-white border border-school-primary/40 shadow-lg shadow-school-primary/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
          <span className="hidden sm:inline">النسخة المدرسية والأكاديمية 🏛️</span>
          <span className="sm:hidden">المدرسة</span>
        </button>

          <button
            onClick={() => onToggleMode('doodle')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs transition ${
              appMode === 'doodle'
                ? 'bg-[#fdfbf4] text-[#2b2a33] border-2 border-[#2b2a33] shadow-[2px_3px_0_rgba(43,42,51,0.25)] rotate-[-1deg] doodle-cut'
                : 'text-amber-300/70 hover:text-amber-200'
            }`}
            title="دفتر الكود السحري — للأصغر سناً"
          >
            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden sm:inline doodle-title">كود ماجيك ✏️</span>
            <span className="sm:hidden">دفتر</span>
          </button>

          <button
            onClick={() => onToggleMode('notebook')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs transition ${
              appMode === 'notebook'
                ? 'bg-[#6c5ce7] text-white border-2 border-[#4a3f8a] shadow-[2px_3px_0_rgba(74,63,138,0.4)] rotate-[0.5deg]'
                : 'text-purple-300/70 hover:text-purple-200'
            }`}
            title="الدفتر التفاعلي — بيئة تعليمية للروضة والأول الابتدائي"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
            <span className="hidden sm:inline">الدفتر التفاعلي 📒</span>
            <span className="sm:hidden">الدفتر</span>
          </button>
        </div>

      {/* Bluetooth & Telemetry Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Fullscreen Theatre Presentation Mode */}
        <button
          onClick={toggleFullscreen}
          className={`p-1.5 sm:p-2 rounded-xl transition shadow active:scale-95 border ${
            isSchool 
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-750 text-school-muted' 
              : 'bg-slate-800 hover:bg-slate-750 border-kid-primary/50 text-kid-accent'
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
              ? 'ble-live-pulse bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
              : isSchool
              ? 'bg-gradient-to-r from-school-primary to-school-primaryDeep text-white hover:brightness-110 border border-school-primary/40'
              : 'bg-gradient-to-r from-kid-glow via-kid-primary to-kid-accent text-white hover:brightness-110 border border-kid-primary/40'
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
