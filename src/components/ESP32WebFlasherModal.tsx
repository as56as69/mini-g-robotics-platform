import React, { useState, useRef, useEffect } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { HardDrive, FileUp, Upload, CheckCircle2, Loader2, Terminal, Hammer, Info } from 'lucide-react';
import { SoundFXManager } from '../ble/SoundFX';
import { ESPLoader, Transport } from 'esptool-js';

interface Props {
  model: RobotModelType;
}

/**
 * Real ESP32 web flasher via esptool-js (Web Serial):
 *  - user picks a compiled .bin firmware image
 *  - device connects over USB, chip is detected, image is written at the
 *    chosen offset with live progress from esptool itself
 * - The "upload the exported .ino source" path is intentionally stubbed
 *   (building an image in-browser needs a toolchain — a future phase).
 */
export const ESP32WebFlasherModal: React.FC<Props> = ({ model }) => {
  const modelInfo = ROBOT_MODELS[model];
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [baudRate, setBaudRate] = useState('921600');
  const [flashOffset, setFlashOffset] = useState('0x10000');
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([
    `[Flasher] جاهز لرفع فريم وير ${modelInfo.name} — اختر ملف .bin وصِل الروبوت عبر USB`,
    '[Flasher] متصفح Chrome أو Edge مطلوب (Web Serial API).',
  ]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [devToast, setDevToast] = useState<string | null>(null);

  const showDev = (label: string) => {
    SoundFXManager.playClickBeep();
    setDevToast(`قيد التطوير 🚧 — ${label}`);
    window.clearTimeout((showDev as any)._t);
    (showDev as any)._t = window.setTimeout(() => setDevToast(null), 2600);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-80), msg]);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const isSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  const handleFlash = async () => {
    if (busyRef.current) return;
    if (!file) {
      addLog('⚠️ اختر ملف .bin أولاً');
      return;
    }
    setBusy(true);
    setDone(false);
    setProgress(0);
    try {
      addLog('🔌 طلب إذن الوصول لمنفذ USB…');
      const port = await (navigator as any).serial.requestPort();
      const transport = new Transport(port, true);
      addLog(`🔌 فتح المنفذ بسرعة ${baudRate}…`);

      const loader = new ESPLoader({
        transport,
        baudrate: parseInt(baudRate, 10),
        terminal: {
          clean: () => {},
          write: (data: string) => addLog(`[esp] ${data}`),
          writeLine: (data: string) => addLog(`[esptool] ${data}`),
        },
        debugLogging: false,
      });

      addLog('🧩 إدخال وضع التنزيل (Download Mode) وتحديد الشريحة…');
      const chip = await loader.main();
      addLog(`🧠 تم التعرف على الشريحة: ${chip}`);

      const imageData = new Uint8Array(await file.arrayBuffer());
      addLog(`📤 رفع ${file.name} (${(file.size / 1024).toFixed(1)} KB) على العنوان ${flashOffset}…`);

      await loader.writeFlash({
        fileArray: [{ data: imageData, address: parseInt(flashOffset, 16) }],
        flashSize: 'keep',
        flashMode: 'keep',
        flashFreq: 'keep',
        eraseAll: false,
        compress: true,
        reportProgress: (_fileIndex, written, total) => {
          setProgress(Math.min(99, Math.round((written / Math.max(1, total)) * 100)));
        },
      });

      await loader.after();
      setProgress(100);
      setDone(true);
      addLog('✅ اكتمل الحرق بنجاح — الروبوت يُعاد تشغيله بالفريم وير الجديد.');
      SoundFXManager.playVictory();
    } catch (err: any) {
      addLog(`❌ فشل: ${err?.message ?? String(err)}`);
      setProgress(0);
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              فلاشر ESP32 حقيقي عبر الويب (Web Serial + esptool-js)
            </h3>
            <p className="text-[11px] text-slate-400">ارفع ملف .bin مجمّع (من Arduino IDE: Sketch → Export Compiled Binary) على الروبوت المتصل بالـ USB</p>
          </div>
        </div>

        {!isSupported && (
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
            <Info className="w-3 h-3" />
            يتطلب Chrome أو Edge
          </span>
        )}
      </div>

      {!isSupported && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 text-[11px] text-amber-300 font-bold flex items-center gap-2">
          <Hammer className="w-4 h-4 shrink-0" />
          <span>متصفحك لا يدعم Web Serial API — افتح المنصة في Google Chrome أو Microsoft Edge على كمبيوتر لاستخدام الفلاشر.</span>
        </div>
      )}

      {/* Binary file picker */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5 text-xs">
        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
          1) اختر ملف الفريم وير المُجمَّع (.bin) لـ {modelInfo.name}:
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".bin"
          disabled={!isSupported || busy}
          onChange={e => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            if (f) addLog(`📎 اختير الملف: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
          }}
          className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">سرعة النقل (Baud):</label>
            <select
              value={baudRate}
              onChange={e => setBaudRate(e.target.value)}
              disabled={busy}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            >
              {['115200', '230400', '460800', '921600'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">عنوان الرفع (Flash Offset):</label>
            <input
              type="text"
              dir="ltr"
              value={flashOffset}
              onChange={e => setFlashOffset(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleFlash}
            disabled={!isSupported || busy || !file}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition shadow active:scale-95 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{busy ? `جارٍ الحرق… ${progress}%` : '⚡ رفع الفريم وير على ESP32 (USB)'}</span>
          </button>

          {/* Stubbed alternative: flashing the exported source code */}
          <button
            type="button"
            onClick={() => showDev('رفع كود التصدير (.ino) يتطلب تجميعاً داخل المتصفح')}
            className="w-full py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 text-xs rounded-xl font-bold transition flex items-center justify-center gap-1"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>رفع كود التصدير (.ino) — قيد التطوير 🚧</span>
          </button>
        </div>
      </div>

      {/* Live progress bar (real events from esptool) */}
      {busy || done ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>{done ? 'اكتمل ✅' : busy ? 'جارٍ الحرق…' : 'جاهز'}</span>
            <span className="font-mono text-emerald-400">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Real esptool logs */}
      <div ref={terminalRef} className="bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-emerald-400 border border-slate-800 overflow-y-auto max-h-52 flex flex-col gap-1">
        {logs.map((log, i) => (
          <div key={i} className="leading-relaxed break-words">{log}</div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed flex flex-col gap-1">
        <p className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <b className="text-slate-300">من أين تحصل على ملف .bin؟</b> على كمبيوتر المعلم شغّل:
            <code className="block mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-emerald-300 font-mono whitespace-pre" dir="ltr">
              bash ~/mini-g-robotics-platform/mgbuild.sh {model === 'mini_gf' ? 'gf' : model === 'mini_gm' ? 'gm' : 'g'}
            </code>
            فيُنتج الملف الجاهز في مجلد <code className="font-mono text-cyan-400" dir="ltr">build/</code> — اختره من حقل الرفع أعلاه. أو استخدم Arduino IDE (Sketch → Export Compiled Binary). استخدم زر BOOT على الشريحة إن لم تدخل وضع التنزيل تلقائياً.
          </span>
        </p>
      </div>

      {devToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] bg-slate-950/95 border border-amber-500/50 text-amber-200 text-xs font-black px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur whitespace-nowrap flex items-center gap-2">
          <Hammer className="w-4 h-4 text-amber-400" />
          <span>{devToast}</span>
        </div>
      )}
    </div>
  );
};
