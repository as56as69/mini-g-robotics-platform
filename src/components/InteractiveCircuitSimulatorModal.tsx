import React, { useState } from 'react';
import { RobotModelType } from '../types/robot';
import { Cpu, Zap, Activity, ToggleLeft, ToggleRight, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  model: RobotModelType;
}

export const InteractiveCircuitSimulatorModal: React.FC<Props> = ({ model }) => {
  const [switchState, setSwitchState] = useState(true);
  const [resistanceVal, setResistanceVal] = useState(220); // 220 Ohms
  const [inputVoltage, setInputVoltage] = useState(5.0); // 5V

  // Ohm's Law Calculations: I = V / R, P = V * I
  const currentMA = switchState ? Number(((inputVoltage / resistanceVal) * 1000).toFixed(1)) : 0;
  const powerMW = switchState ? Number(((inputVoltage * currentMA)).toFixed(1)) : 0;
  const ledBrightness = switchState ? Math.min(100, Math.max(10, Math.round(currentMA * 4.5))) : 0;

  const toggleSwitch = () => {
    SoundFXManager.playClickBeep();
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

      {/* Interactive Circuit Schematic Visualizer */}
      <div className="bg-slate-950 p-5 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center gap-4 relative overflow-hidden min-h-[220px]">
        {/* Animated Current Electron Flow */}
        <div className="w-full max-w-md h-32 border-4 border-slate-800 rounded-3xl relative flex items-center justify-between px-6">
          {/* Battery Node */}
          <div className="flex flex-col items-center gap-1 bg-slate-900 p-2.5 rounded-xl border border-amber-500/40">
            <Zap className="w-6 h-6 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300">{inputVoltage}V LiPo</span>
          </div>

          {/* Resistor Node */}
          <div className="flex flex-col items-center gap-1 bg-slate-900 p-2.5 rounded-xl border border-indigo-500/40">
            <span className="text-sm font-mono font-bold text-indigo-300">Ω</span>
            <span className="text-[10px] font-bold text-indigo-300">{resistanceVal} Ω</span>
          </div>

          {/* Load LED Node */}
          <div className="flex flex-col items-center gap-1 bg-slate-900 p-2.5 rounded-xl border border-cyan-500/40">
            <div
              className={`w-6 h-6 rounded-full transition-all duration-300 ${
                switchState ? 'bg-cyan-400 shadow-lg shadow-cyan-400' : 'bg-slate-800'
              }`}
              style={{ filter: `brightness(${ledBrightness}%)` }}
            />
            <span className="text-[10px] font-bold text-cyan-300">RGB LED</span>
          </div>
        </div>

        {/* Live Gauges Bar */}
        <div className="grid grid-cols-3 gap-3 w-full text-center text-xs">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">شدة التيار (Current I):</span>
            <span className="text-base font-black font-mono text-emerald-400">{currentMA} mA</span>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">القدرة المستهلكة (Power P):</span>
            <span className="text-base font-black font-mono text-amber-400">{powerMW} mW</span>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">سطوع الإضاءة:</span>
            <span className="text-base font-black font-mono text-cyan-400">{ledBrightness}%</span>
          </div>
        </div>
      </div>

      {/* Sliders for Interactive Learning */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="text-slate-300 block mb-1 font-bold">تغيير قيمة المقاومة (Resistance): {resistanceVal} أوم</label>
          <input
            type="range"
            min="100"
            max="1000"
            step="10"
            value={resistanceVal}
            onChange={e => setResistanceVal(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-slate-300 block mb-1 font-bold">تغيير جهد البطارية (Voltage): {inputVoltage} فولت</label>
          <input
            type="range"
            min="3.3"
            max="9.0"
            step="0.1"
            value={inputVoltage}
            onChange={e => setInputVoltage(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
