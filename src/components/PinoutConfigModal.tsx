import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Settings, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { SoundFXManager } from '../ble/SoundFX';
import { pinoutManager, MODEL_PIN_FIELDS, type PinoutMap } from '../ble/PinoutManager';
import { PinoutSchematic } from './PinoutSchematic';

interface Props {
  model: RobotModelType;
}

const FIELD_LABELS: Partial<Record<keyof PinoutMap, string>> = {
  pinLed: 'منفذ ليدات RGB (Data Pin)',
  pinHaptic: 'منفذ ماطور الهزاز (Haptic)',
  pinTouch: 'منفذ حساس اللمس (Touch)',
  pinServo: 'منفذ سيرفو الرأس (Neck Servo)',
  pinBuzzer: 'منفذ السماعة (Buzzer/Audio)',
  pinMotorL: 'محرك العجلة اليسرى (PWM)',
  pinMotorR: 'محرك العجلة اليمنى (PWM)',
  pinArmL: 'ذراع يسار (Servo)',
  pinArmR: 'ذراع يمين (Servo)',
};

const FIELD_HINTS: Partial<Record<keyof PinoutMap, string>> = {
  pinLed: 'Data Pin',
  pinHaptic: 'Haptic',
  pinTouch: 'Touch',
  pinServo: 'Neck Servo',
  pinBuzzer: 'Buzzer/Audio',
  pinMotorL: 'PWM',
  pinMotorR: 'PWM',
  pinArmL: 'Servo',
  pinArmR: 'Servo',
};

export const PinoutConfigModal: React.FC<Props> = ({ model }) => {
  const modelInfo = ROBOT_MODELS[model];
  const [pins, setPins] = useState<PinoutMap>(() => pinoutManager.get(model));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictPin, setConflictPin] = useState<string | null>(null);

  const fields = MODEL_PIN_FIELDS[model];

  const handlePinChange = (field: keyof PinoutMap, value: string) => {
    // Only digits, max 2 chars (0..48)
    const clean = value.replace(/\D/g, '').slice(0, 2);
    setPins(prev => ({ ...prev, [field]: clean }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate: every active field must be a number 0..48
    for (const f of fields) {
      const v = pins[f];
      const n = Number(v);
      if (!v || Number.isNaN(n) || n < 0 || n > 48) {
        SoundFXManager.playClickBeep();
        setConflictPin(null);
        setError('كل المنافذ يجب أن تكون رقماً بين 0 و 48');
        window.setTimeout(() => setError(null), 2600);
        return;
      }
    }
    // Conflict detection: same pin used twice on this model
    const seen = new Map<string, number>();
    for (const f of fields) {
      const v = pins[f];
      seen.set(v, (seen.get(v) || 0) + 1);
    }
    const dup = [...seen.entries()].find(([, count]) => count > 1);
    if (dup) {
      SoundFXManager.playClickBeep();
      setConflictPin(`المنفذ ${dup[0]} مستخدَم ${dup[1]} مرات — كل منفذ لأجزاء مختلفة!`);
      window.setTimeout(() => setConflictPin(null), 3200);
      return;
    }
    pinoutManager.set(model, pins);
    SoundFXManager.playClickBeep();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const restored = pinoutManager.reset(model);
    setPins({ ...restored });
    setConflictPin(null);
    SoundFXManager.playClickBeep();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">
            تخصيص منافذ الـ Hardware والـ Pinouts ({modelInfo.name})
          </span>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
          ESP32 GPIO Map
        </span>
      </div>

      {/* Interactive live schematic */}
      <PinoutSchematic model={model} />

      <form onSubmit={handleSave} className="flex flex-col gap-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          {fields.map((field) => (
            <div key={field}>
              <label className="text-slate-400 block mb-1 text-[11px]">
                {FIELD_LABELS[field]} <span className="text-slate-500 font-mono">({FIELD_LABELS[field]})</span>:
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={48}
                value={pins[field]}
                onChange={e => handlePinChange(field, e.target.value)}
                className={`w-full bg-slate-950 border rounded-xl px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none ${
                  conflictPin && Object.values(pins).filter(v => v === pins[field]).length > 1
                    ? 'border-rose-500/70'
                    : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
            </div>
          ))}
        </div>

        {(error || conflictPin) && (
          <div className={`text-[11px] font-bold rounded-xl px-3 py-2 border ${
            conflictPin
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              : 'bg-rose-500/10 border border-rose-500/40 text-rose-300'
          }`}>
            {error || conflictPin}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 flex items-center justify-center gap-1"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-white" /> : null}
          <span>{saved ? 'تم حفظ التعيين!' : 'تحديث وتطبيق المنافذ على الفريم وير'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const restored = pinoutManager.reset(model);
            setPins({ ...restored });
            SoundFXManager.playClickBeep();
          }}
          className="w-full py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 text-xs rounded-xl font-bold transition flex items-center justify-center gap-1"
        >
          <span>↩ استعادة الافتراضيات</span>
        </button>
      </form>
    </div>
  );
};
