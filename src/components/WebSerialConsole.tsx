import React, { useState } from 'react';
import { Terminal, Usb, Send, Play, RotateCcw, AlertCircle, CheckCircle2, Wifi } from 'lucide-react';

export const WebSerialConsole: React.FC = () => {
  const [port, setPort] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'جاهز للاتصال المباشر عبر منفذ USB التسلسلي (Web Serial API)...',
    'يدعم شرائح: ESP32-C3 / S3 / WROOM / NodeMCU'
  ]);
  const [inputCmd, setInputCmd] = useState('');

  const connectSerial = async () => {
    if (!('serial' in navigator)) {
      setLogs(prev => [...prev, '⚠️ Web Serial API غير مدعوم في هذا المتصفح. يرجى استخدام متصفح Chrome أو Edge.']);
      return;
    }

    try {
      const selectedPort = await (navigator as any).serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      setPort(selectedPort);
      setConnected(true);
      setLogs(prev => [...prev, '✅ تم الاتصال بنجاح بالـ ESP32 بمعدل 115200 baud']);

      // Read loop in background
      readSerialLoop(selectedPort);
    } catch (err: any) {
      setLogs(prev => [...prev, `❌ فشل الاتصال بالمنفذ: ${err.message}`]);
    }
  };

  const readSerialLoop = async (serialPort: any) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          setLogs(prev => [...prev.slice(-40), `[ESP32] ${value.trim()}`]);
        }
      }
    } catch (e) {
      console.error('Serial read error:', e);
    } finally {
      reader.releaseLock();
    }
  };

  const disconnectSerial = async () => {
    if (port) {
      try {
        await port.close();
      } catch (e) {}
      setPort(null);
      setConnected(false);
      setLogs(prev => [...prev, '🔌 تم قطع الاتصال بالمنفذ التسلسلي.']);
    }
  };

  const sendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;

    if (port && port.writable) {
      const textEncoder = new TextEncoder();
      const writer = port.writable.getWriter();
      await writer.write(textEncoder.encode(inputCmd + '\n'));
      writer.releaseLock();
      setLogs(prev => [...prev, `> ${inputCmd}`]);
      setInputCmd('');
    } else {
      // Simulation mode
      setLogs(prev => [...prev, `> [افتراضي] ${inputCmd}`, `[ESP32 Response] تم استقبال الأمر: "${inputCmd}" وتطبيقه بنجاح!`]);
      setInputCmd('');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3 h-[300px]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">الطرفية المباشرة ومنفذ السلك (USB Serial Monitor)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={connected ? disconnectSerial : connectSerial}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition shadow ${
              connected
                ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            <span>{connected ? 'فصل السلك' : 'اتصال USB ⚡'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Window */}
      <div className="flex-1 bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto border border-slate-800 flex flex-col gap-1">
        {logs.map((log, i) => (
          <div key={i} className="leading-relaxed break-words">{log}</div>
        ))}
      </div>

      {/* Send Command Input */}
      <form onSubmit={sendCommand} className="flex items-center gap-2">
        <input
          type="text"
          value={inputCmd}
          onChange={e => setInputCmd(e.target.value)}
          placeholder="أدخل أمر تسلسلي (مثل: REBOOT أو LED ON أو PING)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
        >
          <Send className="w-3 h-3" />
          <span>إرسال</span>
        </button>
      </form>
    </div>
  );
};
