import React, { useState } from 'react';
import { RobotModelType } from '../types/robot';
import { Zap, ToggleLeft, ToggleRight, Hammer, Bell } from 'lucide-react';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  model: RobotModelType;
}

export const InteractiveCircuitSimulatorModal: React.FC<Props> = ({ model }) => {
  const [switchState, setSwitchState] = useState(true);
  const [devToast, setDevToast] = useState<string | null>(null);

  const notifyDev = (label: string) => {
    SoundFXManager.playClickBeep();
    setDevToast(`قيد التطوير 🚧 — ${label}`);
    window.clearTimeout((notifyDev as any)._t);
    (notifyDev as any)._t = window.setTimeout(() => setDevToast(null), 2600);
  };

  const toggleSwitch = () => {
    notifyDev('مفتاح الدائرة');
    setSwitchState(!switchState);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              محاكي الدوائر الإلكترونية وقانون أوم (Interactive Circuit & Ohm's Law Lab)
            </h3>
            <p className="text-[11px] text-slate-400">تعلّم كيف يتدفق التيار الكهربائي ويغذي ليدات ومحركات روبوت ميني جي</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
            <Hammer className="w-3 h-3" />
            <span>قيد التطوير 🚧</span>
          </span>
          <button
            onClick={toggleSwitch}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow active:scale-95 ${
              switchState
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {switchState ? <ToggleRight className="w-4 h-4 text-emerald-300" /> : <ToggleLeft className="w-4 h-4" />}
            <span>{switchState ? 'الدائرة مغلقة (تعمل 🟢)' : 'الدائرة مفتوحة (مقطوعة 🔴)'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Circuit Schematic Visualizer */}
      <div
        className="bg-slate-950 p-5 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center gap-4 relative overflow-hidden min-h-[220px] cursor-pointer"
        onClick={() => notifyDev('مخطط الدائرة')}
      >
        {/* Animated Current Electron Flow */}
        <div className="w-full max-w-md h-32 border-4 border-slate-800 rounded-3xl relative flex items-center justify-between px-6">
          {/* Battery Node */}
          <div className="flex flex-col items-center gap-1 bg-slate-900 p-2.5 rounded-xl border border-amber-500/40" onClick={(e) => { e.stopPropagation(); notifyDev('بطارية LiPo'); }}>
            <Zap className="w-6 h-6 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300">{model === 'mini_g' ? '7.4V' : '5.0V'} LiPo</span>
          </div>

          {/* Resistor Node */}
          <div className="flex flex-col items-center gap-1 bg-slate-900 p-2.5 rounded-xl border border-indigo-500/40" onClick={(e) => { e.stopPropagation(); notifyDev('المقاومة (Resistor)'); }}>
            <span className="text-sm font-mono font-bold text-indigo-300">Ω</span>
            <span className="text-[10px] font-bold text-indigo-300">220 Ω</span>
          </div>

          {/* Load LED Node */}
          <div className="flex flex-col items-center gap-1 bg-slate-900 p-2.5 rounded-xl border border-cyan-500/40" onClick={(e) => { e.stopPropagation(); notifyDev('ليد RGB'); }}>
            <div
              className={`w-6 h-6 rounded-full transition-all duration-300 ${
                switchState ? 'bg-cyan-400 shadow-lg shadow-cyan-400' : 'bg-slate-800'
              }`}
            />
            <span className="text-[10px] font-bold text-cyan-300">RGB LED</span>
          </div>
        </div>

        {/* Live Gauges Bar */}
        <div className="grid grid-cols-3 gap-3 w-full text-center text-xs">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500/50 transition" onClick={() => notifyDev('شدة التيار (Current)')}>
            <span className="text-[10px] text-slate-400 block">شدة التيار (Current I):</span>
            <span className="text-base font-black font-mono text-emerald-400">— mA</span>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500/50 transition" onClick={() => notifyDev('القدرة المستهلكة (Power)')}>
            <span className="text-[10px] text-slate-400 block">القدرة المستهلكة (Power P):</span>
            <span className="text-base font-black font-mono text-amber-400">— mW</span>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500/50 transition" onClick={() => notifyDev('سطوع الإضاءة')}>
            <span className="text-[10px] text-slate-400 block">سطوع الإضاءة:</span>
            <span className="text-base font-black font-mono text-cyan-400">— %</span>
          </div>
        </div>
      </div>

      {/* Sliders for Interactive Learning */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div onClick={() => notifyDev('منزلق المقاومة')} className="cursor-pointer">
          <label className="text-slate-300 block mb-1 font-bold">تغيير قيمة المقاومة (Resistance): 220 أوم</label>
          <input
            type="range"
            min="100"
            max="1000"
            step="10"
            defaultValue={220}
            className="w-full accent-indigo-500 cursor-not-allowed opacity-50"
            readOnly
          />
        </div>

        <div onClick={() => notifyDev('منزلق الجهد')} className="cursor-pointer">
          <label className="text-slate-300 block mb-1 font-bold">تغيير جهد البطارية (Voltage): 5.0 فولت</label>
          <input
            type="range"
            min="3.3"
            max="9.0"
            step="0.1"
            defaultValue={5.0}
            className="w-full accent-amber-500 cursor-not-allowed opacity-50"
            readOnly
          />
        </div>
      </div>

      {/* Dev toast */}
      {devToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] bg-slate-950/95 border border-amber-500/50 text-amber-200 text-xs font-black px-4 py-2.5 rounded-2xl shadow-2xl shadow-amber-500/20 backdrop-blur whitespace-nowrap max-w-[92vw] text-center flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>{devToast}</span>
        </div>
      )}
    </div>
  );
};
