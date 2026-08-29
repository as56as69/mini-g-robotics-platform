import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Settings, Check } from 'lucide-react';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  model: RobotModelType;
}

interface PinConfig {
  pinLed: string;
  pinHaptic: string;
  pinTouch: string;
  pinServo: string;
  pinBuzzer: string;
  pinMotorL: string;
  pinMotorR: string;
  pinArmL: string;
  pinArmR: string;
}

export const PinoutConfigModal: React.FC<Props> = ({ model }) => {
  const modelInfo = ROBOT_MODELS[model];
  const [saved, setSaved] = useState(false);

  const [pins, setPins] = useState<PinConfig>({
    pinLed: '8',
    pinHaptic: '4',
    pinTouch: '2',
    pinServo: '18',
    pinBuzzer: '19',
    pinMotorL: '14',
    pinMotorR: '27',
    pinArmL: '25',
    pinArmR: '26',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    SoundFXManager.playClickBeep();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

      <form onSubmit={handleSave} className="flex flex-col gap-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          {model === 'mini_gf' && (
            <>
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">منفذ ليدات RGB (Data Pin):</label>
                <input
                  type="text"
                  value={pins.pinLed}
                  onChange={e => setPins({ ...pins, pinLed: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">منفذ ماطور الهزاز (Haptic):</label>
                <input
                  type="text"
                  value={pins.pinHaptic}
                  onChange={e => setPins({ ...pins, pinHaptic: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </>
          )}

          {model === 'mini_gm' && (
            <>
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">منفذ سيرفو الرأس (Neck Servo):</label>
                <input
                  type="text"
                  value={pins.pinServo}
                  onChange={e => setPins({ ...pins, pinServo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">منفذ السماعة (Buzzer/Audio):</label>
                <input
                  type="text"
                  value={pins.pinBuzzer}
                  onChange={e => setPins({ ...pins, pinBuzzer: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </>
          )}

          {model === 'mini_g' && (
            <>
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">محرك العجلة اليسرى (PWM):</label>
                <input
                  type="text"
                  value={pins.pinMotorL}
                  onChange={e => setPins({ ...pins, pinMotorL: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">محرك العجلة اليمنى (PWM):</label>
                <input
                  type="text"
                  value={pins.pinMotorR}
                  onChange={e => setPins({ ...pins, pinMotorR: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 flex items-center justify-center gap-1"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-white" /> : null}
          <span>{saved ? 'تم حفظ التعيين!' : 'تحديث وتطبيق المنافذ على الفريم وير'}</span>
        </button>
      </form>
    </div>
  );
};
