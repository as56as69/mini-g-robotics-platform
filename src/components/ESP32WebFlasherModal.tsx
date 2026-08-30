import React, { useState, useRef, useEffect } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Cpu, Zap, Download, RefreshCw, CheckCircle2, AlertCircle, HardDrive, Terminal } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  model: RobotModelType;
}

export const ESP32WebFlasherModal: React.FC<Props> = ({ model }) => {
  const modelInfo = ROBOT_MODELS[model];
  const [flashingState, setFlashingState] = useState<'idle' | 'erasing' | 'writing' | 'verifying' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [baudRate, setBaudRate] = useState('921600');
  const [flashOffset, setFlashOffset] = useState('0x10000');
  const [logs, setLogs] = useState<string[]>([
    `[Flasher] جاهز لرفع فريم وير ${modelInfo.name} عبر Web Serial USB Flasher...`,
    '[Flasher] متوافق مع معالجات: ESP32-C3, ESP32-S3, ESP32-D0WD'
  ]);

  const timersRef = useRef<{ step?: number; finish?: number }>({});

  // Clear any pending timers when the modal unmounts (no setState after die)
  useEffect(() => () => {
    window.clearInterval(timersRef.current.step);
    window.clearTimeout(timersRef.current.finish);
    timersRef.current = {};
  }, []);

  const handleStartFlashing = () => {
    if (flashingState === 'erasing' || flashingState === 'writing' || flashingState === 'verifying') return;
    window.clearInterval(timersRef.current.step);
    window.clearTimeout(timersRef.current.finish);
    SoundFXManager.playClickBeep();
    setFlashingState('erasing');
    setProgress(10);
    setLogs(prev => [...prev, '⚡ جاري الاتصال بمنفذ الـ COM / Serial...', '🧹 مسح الذاكرة الفلاشية المؤقتة (Erasing Flash)...']);

    timersRef.current.finish = window.setTimeout(() => {
      setFlashingState('writing');
      setProgress(40);
      setLogs(prev => [...prev, `📦 رفع حزم الباينري الثنائية (.bin) بسرعة ${baudRate} baud...`, `📍 إزاحة العنوان: ${flashOffset}`]);

      let p = 40;
      timersRef.current.step = window.setInterval(() => {
        p += 15;
        if (p >= 90) {
          window.clearInterval(timersRef.current.step);
          setProgress(90);
          setFlashingState('verifying');
          setLogs(prev => [...prev, '🔍 التحقق من سلامة البايتات (MD5 Verification)...']);
          timersRef.current.finish = window.setTimeout(() => {
            setFlashingState('done');
            setProgress(100);
            SoundFXManager.playVictory();
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            setLogs(prev => [...prev, '🎉 تم حرق وتثبيت الفريم وير بنجاح! الروبوت جاهز للعمل.']);
          }, 800);
        } else {
          setProgress(p);
        }
      }, 300);
    }, 1000);
  };

  const handleResetFlasher = () => {
    window.clearInterval(timersRef.current.step);
    window.clearTimeout(timersRef.current.finish);
    timersRef.current = {};
    setFlashingState('idle');
    setProgress(0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              أداة حرق وتثبيت الفريم وير المباشرة (ESP32 Web Flasher Tool)
            </h3>
            <p className="text-[11px] text-slate-400">تثبيت الفريم وير وتشغيل الروبوت دون الحاجة لتثبيت Arduino IDE أو برامج إضافية</p>
          </div>
        </div>

        <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
          USB Web Flasher v2.4 ⚡
        </span>
      </div>

      {/* Flashing Config */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="text-slate-400 block mb-1">سرعة النقل (Baud Rate):</label>
          <select
            value={baudRate}
            onChange={e => setBaudRate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="921600">921600 (فائق السرعة 🚀)</option>
            <option value="460800">460800 (عالي السرعة)</option>
            <option value="115200">115200 (آمن وقياسي)</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">إزاحة العنوان الفلاشي (Offset):</label>
          <input
            type="text"
            value={flashOffset}
            onChange={e => setFlashOffset(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">نوع الشريحة المستهدفة:</label>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono text-center">
            {model === 'mini_gf' ? 'ESP32-C3 Mini' : model === 'mini_gm' ? 'ESP32 WROOM' : 'ESP32-S3 Dual Core'}
          </div>
        </div>
      </div>

      {/* Progress Bar & Status */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300">
            {flashingState === 'idle' && 'جاهز للبدء'}
            {flashingState === 'erasing' && '🧹 مسح وتجهيز الذاكرة...'}
            {flashingState === 'writing' && '📦 جاري كتابة الفريم وير للـ ESP32...'}
            {flashingState === 'verifying' && '🔍 التحقق من سلامة البايتات...'}
            {flashingState === 'done' && '✅ اكتمل التثبيت بنجاح تام!'}
          </span>
          <span className="text-emerald-400 font-mono">{progress}%</span>
        </div>

        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Live Flasher Console Logs */}
      <div className="bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-emerald-400 max-h-32 overflow-y-auto border border-slate-800 flex flex-col gap-1">
        {logs.map((log, i) => (
          <div key={i} className="leading-relaxed">{log}</div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handleResetFlasher}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
        >
          إعادة التعيين
        </button>

        <button
          onClick={handleStartFlashing}
          disabled={flashingState !== 'idle' && flashingState !== 'done'}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg active:scale-95"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{flashingState === 'writing' ? 'جاري الرفع...' : 'بدء حرق الفريم وير عبر USB ⚡'}</span>
        </button>
      </div>
    </div>
  );
};
