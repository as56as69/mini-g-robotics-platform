import React, { useState, useEffect } from 'react';
import { RobotModelType } from '../types/robot';
import { bleService } from '../ble/BLEManager';
import { CMD_CODES } from '../ble/Protocol';
import { SoundFXManager } from '../ble/SoundFX';
import { Brain, Play, Sparkles, CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  model: RobotModelType;
}

export const NeuralNetworkKidStudioModal: React.FC<Props> = ({ model }) => {
  // Simple 2-input -> 2-hidden -> 2-output visual brain
  const [inputObstacle, setInputObstacle] = useState(0.8); // 0..1 (Obstacle distance)
  const [inputLight, setInputLight] = useState(0.4); // 0..1 (Ambient light)
  const [isThinking, setIsThinking] = useState(false);

  // Synapse weights
  const [w1, setW1] = useState(0.9);
  const [w2, setW2] = useState(-0.7);
  const [w3, setW3] = useState(0.5);
  const [w4, setW4] = useState(0.8);

  // Outputs
  const outputMotorSpeed = Math.min(100, Math.max(0, Math.round((1 - inputObstacle * w1) * 100)));
  const outputLedGlow = Math.min(100, Math.max(0, Math.round((inputLight * w3 + inputObstacle * w4) * 50)));

  const handleRunForwardPass = async () => {
    setIsThinking(true);
    SoundFXManager.playRobotChirp();

    setTimeout(async () => {
      setIsThinking(false);
      SoundFXManager.playVictory();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

      // Live command dispatched from neural output
      if (model === 'mini_gf') {
        const r = Math.round(outputLedGlow * 2.5);
        await bleService.sendCommand(CMD_CODES.GF_SET_LED_RGB, [r, 100, 255]);
      } else if (model === 'mini_gm') {
        const expr = outputMotorSpeed > 50 ? 0 : 3;
        await bleService.sendCommand(CMD_CODES.GM_SET_EXPRESSION, [expr]);
      } else {
        await bleService.sendCommand(CMD_CODES.G_DRIVE_MOTORS, [outputMotorSpeed, outputMotorSpeed]);
      }
    }, 600);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              استوديو الشبكات العصبية والذكاء الاصطناعي للأطفال (Kid-Friendly Neural Net Studio)
            </h3>
            <p className="text-[11px] text-slate-400">تعلّم كيف يفكر عقل الروبوت الاصطناعي ويأخذ قرارات حركية مبنية على الحساسات</p>
          </div>
        </div>

        <button
          onClick={handleRunForwardPass}
          disabled={isThinking}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isThinking ? 'الخلايا العصبية تفكر...' : 'تشغيل العقل العصبي 🧠'}</span>
        </button>
      </div>

      {/* Neural Network Interactive Visualizer */}
      <div className="bg-slate-950 p-6 rounded-2xl border-2 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 relative min-h-[260px] shadow-inner">
        {/* Layer 1: Inputs */}
        <div className="flex flex-col gap-4 items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">طبقة المدخلات (Sensors)</span>
          
          <div className="flex flex-col items-center gap-1 bg-slate-900 p-3 rounded-2xl border border-cyan-500/40 w-36 text-center">
            <span className="text-xs font-bold text-cyan-300">قرب الحواجز 🪨</span>
            <span className="text-lg font-black font-mono text-white">{(inputObstacle * 100).toFixed(0)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={inputObstacle}
              onChange={e => setInputObstacle(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer mt-1"
            />
          </div>

          <div className="flex flex-col items-center gap-1 bg-slate-900 p-3 rounded-2xl border border-amber-500/40 w-36 text-center">
            <span className="text-xs font-bold text-amber-300">مستوى الضوء 💡</span>
            <span className="text-lg font-black font-mono text-white">{(inputLight * 100).toFixed(0)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={inputLight}
              onChange={e => setInputLight(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* Layer 2: Hidden Neurons (Brain Core) */}
        <div className="flex flex-col gap-4 items-center">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">الخلايا العصبية (Hidden Synapses)</span>
          
          <div className="flex gap-4">
            <div className={`w-14 h-14 rounded-full border-2 border-purple-500 flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
              isThinking ? 'bg-purple-600 text-white animate-ping' : 'bg-purple-950/60 text-purple-300'
            }`}>
              N1
            </div>
            <div className={`w-14 h-14 rounded-full border-2 border-purple-500 flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
              isThinking ? 'bg-purple-600 text-white animate-ping delay-100' : 'bg-purple-950/60 text-purple-300'
            }`}>
              N2
            </div>
          </div>
          <span className="text-[10px] text-slate-400 text-center max-w-[140px]">
            تزن المدخلات وتتخذ القرار المنطقي فورياً
          </span>
        </div>

        {/* Layer 3: Output Decisions */}
        <div className="flex flex-col gap-4 items-center">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">طبقة القرارات (Outputs)</span>
          
          <div className="flex flex-col items-center gap-1 bg-slate-900 p-3 rounded-2xl border border-emerald-500/40 w-36 text-center shadow">
            <span className="text-xs font-bold text-emerald-300">سرعة المحركات 🚗</span>
            <span className="text-xl font-black font-mono text-white">{outputMotorSpeed}%</span>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1">
              <div className="bg-emerald-400 h-full rounded-full transition-all duration-300" style={{ width: `${outputMotorSpeed}%` }} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 bg-slate-900 p-3 rounded-2xl border border-pink-500/40 w-36 text-center shadow">
            <span className="text-xs font-bold text-pink-300">سطوع الأضواء 🎨</span>
            <span className="text-xl font-black font-mono text-white">{outputLedGlow}%</span>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1">
              <div className="bg-pink-400 h-full rounded-full transition-all duration-300" style={{ width: `${outputLedGlow}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
