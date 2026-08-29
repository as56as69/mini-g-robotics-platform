import React from 'react';
import { RobotModelType } from '../types/robot';
import { bleService } from '../ble/BLEManager';
import { CMD_CODES } from '../ble/Protocol';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, 
  Lightbulb, Vibrate, Smile, Music, MessageSquare, Bot 
} from 'lucide-react';

interface Props {
  model: RobotModelType;
}

export const DirectControlPanel: React.FC<Props> = ({ model }) => {
  // Mini G-F Controls
  const setGFColor = async (hex: string) => {
    await bleService.sendCommand(CMD_CODES.GF_SET_LED_RGB, hex);
  };

  const triggerGFHaptic = async (duration: number) => {
    await bleService.sendCommand(CMD_CODES.GF_TRIGGER_HAPTIC, [duration]);
  };

  // Mini G-M Controls
  const setGMExpression = async (exprIndex: number) => {
    await bleService.sendCommand(CMD_CODES.GM_SET_EXPRESSION, [exprIndex]);
  };

  const rotateGMHead = async (angle: number) => {
    const unsignedByte = (angle < 0 ? 256 + angle : angle) & 0xFF;
    await bleService.sendCommand(CMD_CODES.GM_ROTATE_HEAD, [unsignedByte]);
  };

  const playGMTone = async (freq: number, duration: number) => {
    await bleService.sendCommand(CMD_CODES.GM_PLAY_TONE, [freq, duration]);
  };

  // Mini G Controls
  const driveG = async (spdL: number, spdR: number) => {
    const uL = (spdL < 0 ? 256 + spdL : spdL) & 0xFF;
    const uR = (spdR < 0 ? 256 + spdR : spdR) & 0xFF;
    await bleService.sendCommand(CMD_CODES.G_DRIVE_MOTORS, [uL, uR]);
  };

  const setGArm = async (arm: 'left' | 'right' | 'both', angle: number) => {
    if (arm === 'left' || arm === 'both') {
      await bleService.sendCommand(CMD_CODES.G_SET_ARM_LEFT, [angle]);
    }
    if (arm === 'right' || arm === 'both') {
      await bleService.sendCommand(CMD_CODES.G_SET_ARM_RIGHT, [angle]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">التحكم اليدوي الفوري (Live Remote)</span>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">استجابة فورية</span>
      </div>

      {/* Mini G-F Direct Controls */}
      {model === 'mini_gf' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              تغيير لون ليدات الـ RGB:
            </span>
            <div className="flex items-center gap-2">
              {['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => setGFColor(color)}
                  style={{ backgroundColor: color }}
                  className="w-7 h-7 rounded-full border-2 border-slate-700 hover:scale-110 active:scale-95 transition shadow-sm"
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Vibrate className="w-3.5 h-3.5 text-pink-400" />
              نبضات الهزاز (Haptic):
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerGFHaptic(20)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
              >
                ⚡ نبضة خفيفة
              </button>
              <button
                onClick={() => triggerGFHaptic(50)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
              >
                ⏳ نبضة متوسطة
              </button>
              <button
                onClick={() => triggerGFHaptic(80)}
                className="px-3 py-1.5 rounded-xl bg-pink-600/20 text-pink-300 border border-pink-500/30 hover:bg-pink-600/30 text-xs font-bold transition active:scale-95"
              >
                💓 نبضتان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini G-M Direct Controls */}
      {model === 'mini_gm' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-cyan-400" />
              تغيير عيون الشاشة:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: '😄 سعيد', id: 0 },
                { name: '😲 مندهش', id: 1 },
                { name: '😍 قلوب', id: 2 },
                { name: '😴 نائم', id: 3 },
                { name: '😎 نظارة', id: 4 },
                { name: '😉 يغمز', id: 5 },
              ].map((e) => (
                <button
                  key={e.id}
                  onClick={() => setGMExpression(e.id)}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
                >
                  {e.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-400">تدوير الرأس:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => rotateGMHead(-45)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                >
                  ⬅️ يسار
                </button>
                <button
                  onClick={() => rotateGMHead(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                >
                  ⏺️ وسط
                </button>
                <button
                  onClick={() => rotateGMHead(45)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                >
                  ➡️ يمين
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                نغمة سريعة:
              </span>
              <button
                onClick={() => playGMTone(587, 3)}
                className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition"
              >
                🎵 تشغيل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini G Direct Controls */}
      {model === 'mini_g' && (
        <div className="flex flex-col gap-3">
          {/* D-Pad Driving Controls */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-3 gap-1.5 w-36">
              <div />
              <button
                onClick={() => driveG(80, 80)}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition active:scale-95 shadow"
                title="للأمام"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />
              <button
                onClick={() => driveG(-60, 60)}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition active:scale-95 shadow"
                title="دوران يسار"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => driveG(0, 0)}
                className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center justify-center transition active:scale-95 shadow"
                title="توقف"
              >
                <Square className="w-5 h-5" />
              </button>
              <button
                onClick={() => driveG(60, -60)}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition active:scale-95 shadow"
                title="دوران يمين"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div />
              <button
                onClick={() => driveG(-80, -80)}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition active:scale-95 shadow"
                title="للخلف"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div />
            </div>
          </div>

          {/* Articulated Arm Actions */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
            <button
              onClick={() => setGArm('right', 90)}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition active:scale-95"
            >
              👋 تلويح باليمين
            </button>
            <button
              onClick={() => setGArm('both', 90)}
              className="flex-1 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 rounded-xl text-[11px] font-bold transition active:scale-95"
            >
              🙌 رفع اليدين
            </button>
            <button
              onClick={() => setGArm('both', 0)}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition active:scale-95"
            >
              👇 إنزال اليدين
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
