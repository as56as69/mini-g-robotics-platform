import React from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Cpu, Layers, CheckCircle2 } from 'lucide-react';
import { pinoutManager } from '../ble/PinoutManager';
import { PinoutSchematic } from './PinoutSchematic';

interface Props {
  model: RobotModelType;
}

export const WiringDiagramModal: React.FC<Props> = ({ model }) => {
  const modelInfo = ROBOT_MODELS[model];
  const pins = pinoutManager.get(model);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">
            مخطط التوصيل الإلكتروني والدوائر (Schematic Wiring - {modelInfo.name})
          </span>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
          Hardware Pinout V1.0 — حي من إعداداتك
        </span>
      </div>

      {/* Interactive live schematic (reads pinoutManager) */}
      <div className="flex justify-center">
        <PinoutSchematic model={model} />
      </div>

      {/* Component cards — live pin numbers from pinoutManager */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-3">
        {model === 'mini_gf' && (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>مخطط توصيل شريحة ESP32-C3 SuperMini مع كيت Mini G-F:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-pink-400 font-bold block text-[11px]">🔴 ليدات WS2812B RGB</span>
                <p className="text-slate-400 text-[10px] mt-1">Data In ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinLed}</span></p>
                <p className="text-slate-400 text-[10px]">VCC ➜ 3.3V / GND ➜ GND</p>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-amber-400 font-bold block text-[11px]">📳 ماطور الهزاز Haptic</span>
                <p className="text-slate-400 text-[10px] mt-1">Control Pin ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinHaptic}</span></p>
                <p className="text-slate-400 text-[10px]">عبر ترانزستور NPN S8050</p>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-bold block text-[11px]">👆 حساس اللمس Touch</span>
                <p className="text-slate-400 text-[10px] mt-1">Touch Pad ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinTouch}</span></p>
                <p className="text-slate-400 text-[10px]">مباشر على لوح النحاس العلوي</p>
              </div>
            </div>
          </div>
        )}

        {model === 'mini_gm' && (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>مخطط توصيل ESP32 WROOM مع كيت رفيق المكتب Mini G-M:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold block text-[11px]">👀 شاشة العيون OLED / TFT</span>
                <p className="text-slate-400 text-[10px] mt-1">SDA ➜ <span className="text-white font-mono font-bold">GPIO 21</span></p>
                <p className="text-slate-400 text-[10px]">SCL ➜ <span className="text-white font-mono font-bold">GPIO 22</span></p>
                <p className="text-slate-500 text-[10px]">ثابتة على ناقل I2C الافتراضي</p>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-purple-400 font-bold block text-[11px]">🤖 محرك سيرفو الرأس والعنق</span>
                <p className="text-slate-400 text-[10px] mt-1">PWM Signal ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinServo}</span></p>
                <p className="text-slate-400 text-[10px]">SG90 Servo / 5V External</p>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-amber-400 font-bold block text-[11px]">🎵 مكبر الصوت Buzzer/DAC</span>
                <p className="text-slate-400 text-[10px] mt-1">Audio Out ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinBuzzer}</span></p>
                <p className="text-slate-400 text-[10px]">سماعة نغمات كرتونية تفاعلية</p>
              </div>
            </div>
          </div>
        )}

        {model === 'mini_g' && (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>مخطط التوصيل الشامل لشريحة ESP32-S3 لروبوت Mini G:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-blue-400 font-bold block text-[11px]">🚗 محركات العجلات (L298N)</span>
                <p className="text-slate-400 text-[10px] mt-1">Left ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinMotorL}</span></p>
                <p className="text-slate-400 text-[10px]">Right ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinMotorR}</span></p>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-purple-400 font-bold block text-[11px]">🦾 مفاصل الأذرع (Servos)</span>
                <p className="text-slate-400 text-[10px] mt-1">Left Arm ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinArmL}</span></p>
                <p className="text-slate-400 text-[10px]">Right Arm ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinArmR}</span></p>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-pink-400 font-bold block text-[11px]">🗣️ الصوت وشاشة الوجوه</span>
                <p className="text-slate-400 text-[10px] mt-1">I2S DAC ➜ <span className="text-white font-mono font-bold">GPIO {pins.pinBuzzer}/23</span></p>
                <p className="text-slate-400 text-[10px]">مكبر صوت مدمج 3W</p>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-bold block text-[11px]">🔋 دائرة التغذية والحماية</span>
                <p className="text-slate-400 text-[10px] mt-1">Li-ion 2S 7.4V Battery</p>
                <p className="text-slate-400 text-[10px]">منظم جهد 5V 3A Buck</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>الأرقام حية من تبويب «المنافذ» — عدّلها هناك لتنعكس هنا فوراً</span>
          </span>
          <span className="font-mono text-slate-500">Baud: 115200</span>
        </div>
      </div>
    </div>
  );
};

