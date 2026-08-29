import React, { useState } from 'react';
import { RobotModelType } from '../types/robot';
import { bleService } from '../ble/BLEManager';
import { CMD_CODES } from '../ble/Protocol';
import { SoundFXManager } from '../ble/SoundFX';
import { Film, Play, Square, Circle, RotateCcw, ListPlus, CheckCircle2 } from 'lucide-react';

interface Props {
  model: RobotModelType;
}

interface RecordedAction {
  name: string;
  cmd: number;
  data: number[];
  delay: number;
}

export const ActionSequenceRecorder: React.FC<Props> = ({ model }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequence, setSequence] = useState<RecordedAction[]>([
    { name: 'وميض باللون الأزرق 🔵', cmd: CMD_CODES.GF_SET_LED_RGB, data: [0, 150, 255], delay: 500 },
    { name: 'نبضات الفرح بالهزاز 📳', cmd: CMD_CODES.GF_TRIGGER_HAPTIC, data: [50], delay: 600 },
    { name: 'تعبير عيون القلوب 😍', cmd: CMD_CODES.GM_SET_EXPRESSION, data: [2], delay: 700 },
  ]);

  const addQuickAction = (name: string, cmd: number, data: number[]) => {
    SoundFXManager.playClickBeep();
    setSequence(prev => [...prev, { name, cmd, data, delay: 600 }]);
  };

  const playSequence = async () => {
    if (sequence.length === 0 || isPlaying) return;
    setIsPlaying(true);
    SoundFXManager.playRobotChirp();

    for (let i = 0; i < sequence.length; i++) {
      const act = sequence[i];
      await bleService.sendCommand(act.cmd, act.data);
      await new Promise(res => setTimeout(res, act.delay));
    }

    setIsPlaying(false);
    SoundFXManager.playVictory();
  };

  const clearSequence = () => {
    SoundFXManager.playClickBeep();
    setSequence([]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-pink-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">
            مسجل سيناريو الحركات والمؤثرات (Sequence Recorder)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={playSequence}
            disabled={isPlaying || sequence.length === 0}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPlaying ? 'جاري التشغيل...' : 'تشغيل العرض 🎬'}</span>
          </button>
          <button
            onClick={clearSequence}
            className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
            title="مسح الحركات"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action Sequence Timeline */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2 min-h-[90px]">
        {sequence.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-4">
            لا توجد حركات مسجلة بعد. استخدم الأزرار السريعة بالأسفل لإضافة خطوات للسيناريو!
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {sequence.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span className="text-[10px] text-pink-400 font-bold font-mono">#{idx + 1}</span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Action Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
        <span className="text-slate-400 text-[10px] font-bold">إضافة حركة سريعة:</span>
        <button
          onClick={() => addQuickAction('لون أخضر 🟢', CMD_CODES.GF_SET_LED_RGB, [0, 255, 0])}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
        >
          + ضوء أخضر
        </button>
        <button
          onClick={() => addQuickAction('لون وردي 🌸', CMD_CODES.GF_SET_LED_RGB, [236, 72, 153])}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
        >
          + ضوء وردي
        </button>
        <button
          onClick={() => addQuickAction('نبضة هزاز 📳', CMD_CODES.GF_TRIGGER_HAPTIC, [40])}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
        >
          + نبضة هزاز
        </button>
        <button
          onClick={() => addQuickAction('عيون البطل 😎', CMD_CODES.GM_SET_EXPRESSION, [4])}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
        >
          + نظارة البطل
        </button>
        <button
          onClick={() => addQuickAction('إيماءة يمين 👉', CMD_CODES.GM_ROTATE_HEAD, [35])}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
        >
          + التفات رأس
        </button>
      </div>
    </div>
  );
};
