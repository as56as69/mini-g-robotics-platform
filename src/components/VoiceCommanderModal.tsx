import React, { useState } from 'react';
import { RobotModelType } from '../types/robot';
import { bleService } from '../ble/BLEManager';
import { CMD_CODES } from '../ble/Protocol';
import { SoundFXManager } from '../ble/SoundFX';
import { Mic, MicOff, Sparkles, Volume2, CheckCircle2 } from 'lucide-react';

interface Props {
  model: RobotModelType;
}

export const VoiceCommanderModal: React.FC<Props> = ({ model }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastAction, setLastAction] = useState('');

  const handleToggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('التعرف الصوتي غير مدعوم في هذا المتصفح. يرجى تجربة Google Chrome.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        SoundFXManager.playClickBeep();
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        processVoiceCommand(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const processVoiceCommand = async (cmdText: string) => {
    SoundFXManager.playRobotChirp();
    const text = cmdText.toLowerCase();

    if (text.includes('أحمر') || text.includes('احمر')) {
      await bleService.sendCommand(CMD_CODES.GF_SET_LED_RGB, [255, 0, 0]);
      setLastAction('تغيير اللون إلى الأحمر 🔴');
    } else if (text.includes('أخضر') || text.includes('اخضر')) {
      await bleService.sendCommand(CMD_CODES.GF_SET_LED_RGB, [0, 255, 0]);
      setLastAction('تغيير اللون إلى الأخضر 🟢');
    } else if (text.includes('أزرق') || text.includes('ازرق')) {
      await bleService.sendCommand(CMD_CODES.GF_SET_LED_RGB, [0, 150, 255]);
      setLastAction('تغيير اللون إلى الأزرق 🔵');
    } else if (text.includes('اهتز') || text.includes('هزاز')) {
      await bleService.sendCommand(CMD_CODES.GF_TRIGGER_HAPTIC, [50]);
      setLastAction('تفعيل نبضات الهزاز 📳');
    } else if (text.includes('ابتسم') || text.includes('سعيد')) {
      await bleService.sendCommand(CMD_CODES.GM_SET_EXPRESSION, [0]);
      setLastAction('ضبط تعبير العيون لسعيد 😄');
    } else if (text.includes('قلب') || text.includes('حب')) {
      await bleService.sendCommand(CMD_CODES.GM_SET_EXPRESSION, [2]);
      setLastAction('ضبط عيون القلوب 😍');
    } else if (text.includes('تحرك') || text.includes('أمام') || text.includes('امشي')) {
      await bleService.sendCommand(CMD_CODES.G_DRIVE_MOTORS, [80, 80]);
      setLastAction('التحرك للأمام بالعجلات 🚗');
    } else if (text.includes('قف') || text.includes('توقف')) {
      await bleService.sendCommand(CMD_CODES.G_STOP_ALL, []);
      setLastAction('إيقاف كافة الحركات ⏹️');
    } else if (text.includes('لوح') || text.includes('سلام') || text.includes('مرحبا')) {
      await bleService.sendCommand(CMD_CODES.G_SET_ARM_RIGHT, [90]);
      await bleService.sendCommand(CMD_CODES.G_SPEAK_PHRASE, 'أهلاً بك يا صديقي الذكي!' as any);
      setLastAction('التلويح باليد والترحيب الصوتي 👋');
    } else {
      setLastAction(`تم استلام الأمر: "${cmdText}" وجاري تحليله!`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">
            التحكم الصوتي باللغة العربية (Voice Commander)
          </span>
        </div>
        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
          Arabic Speech AI 🎙️
        </span>
      </div>

      {/* Mic Trigger Button */}
      <div className="flex flex-col items-center justify-center py-3 gap-2">
        <button
          onClick={handleToggleMic}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition shadow-2xl active:scale-95 ${
            isListening
              ? 'bg-red-500 text-white animate-ping'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/40'
          }`}
        >
          {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>
        <span className="text-xs font-bold text-slate-300">
          {isListening ? 'جارٍ الاستماع لصوتك... تكلّم الآن! 🔴' : 'اضغط للتحدث بالصوت العربي 🎙️'}
        </span>
      </div>

      {/* Status & Last Command Card */}
      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>الجملة المسموعة:</span>
          <span className="font-bold text-purple-400">{transcript || '—'}</span>
        </div>
        {lastAction && (
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs pt-1 border-t border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>النتيجة: {lastAction}</span>
          </div>
        )}
      </div>

      {/* Hint Chips */}
      <div className="text-[10px] text-slate-400 flex flex-wrap gap-1.5">
        <span className="bg-slate-800 px-2 py-0.5 rounded-md">جرب: "لوّن أحمر"</span>
        <span className="bg-slate-800 px-2 py-0.5 rounded-md">"ابتسم بعيونك"</span>
        <span className="bg-slate-800 px-2 py-0.5 rounded-md">"تحرك للأمام"</span>
        <span className="bg-slate-800 px-2 py-0.5 rounded-md">"لوّح بالسلام"</span>
      </div>
    </div>
  );
};
