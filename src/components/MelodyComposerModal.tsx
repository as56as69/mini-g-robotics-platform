import React, { useState } from 'react';
import { RobotModelType } from '../types/robot';
import { bleService } from '../ble/BLEManager';
import { CMD_CODES } from '../ble/Protocol';
import { Music, Play, RotateCcw, Volume2, Sparkles, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  model: RobotModelType;
}

interface Note {
  name: string;
  freq: number;
  color: string;
}

const PIANO_NOTES: Note[] = [
  { name: 'دو (C4)', freq: 261.63, color: 'bg-red-500 hover:bg-red-400' },
  { name: 'ري (D4)', freq: 293.66, color: 'bg-orange-500 hover:bg-orange-400' },
  { name: 'مي (E4)', freq: 329.63, color: 'bg-yellow-500 hover:bg-yellow-400' },
  { name: 'فا (F4)', freq: 349.23, color: 'bg-emerald-500 hover:bg-emerald-400' },
  { name: 'صول (G4)', freq: 392.00, color: 'bg-cyan-500 hover:bg-cyan-400' },
  { name: 'لا (A4)', freq: 440.00, color: 'bg-blue-500 hover:bg-blue-400' },
  { name: 'سي (B4)', freq: 493.88, color: 'bg-purple-500 hover:bg-purple-400' },
  { name: 'دو (C5)', freq: 523.25, color: 'bg-pink-500 hover:bg-pink-400' },
];

// One shared AudioContext for the whole studio (per-note contexts leaked before)
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioCtx();
    } catch (e) {
      return null;
    }
  }
  return audioCtx;
}

export const MelodyComposerModal: React.FC<Props> = ({ model }) => {
  const [melody, setMelody] = useState<Note[]>([
    PIANO_NOTES[0],
    PIANO_NOTES[2],
    PIANO_NOTES[4],
    PIANO_NOTES[7],
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const playToneLive = (note: Note) => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = note.freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      }

      // Send to ESP32 / Robot (firmware expects frequency ÷10)
      const freqScaled = Math.max(1, Math.round(note.freq / 10));
      bleService.sendCommand(CMD_CODES.GM_PLAY_TONE, [freqScaled, 3]);
    } catch (e) {}
  };

  const addNote = (note: Note) => {
    playToneLive(note);
    if (melody.length < 16) {
      setMelody(prev => [...prev, note]);
    }
  };

  const removeNote = (idx: number) => {
    setMelody(prev => prev.filter((_, i) => i !== idx));
  };

  const clearMelody = () => {
    setMelody([]);
  };

  const playEntireMelody = async () => {
    if (melody.length === 0 || isPlaying) return;
    setIsPlaying(true);

    for (let i = 0; i < melody.length; i++) {
      playToneLive(melody[i]);
      await new Promise(r => setTimeout(r, 350));
    }

    setIsPlaying(false);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const generateArduinoCode = () => {
    const freqs = melody.map(n => Math.round(n.freq));
    return `const int melody[] = { ${freqs.join(', ')} };
const int noteDurations[] = { ${freqs.map(() => '300').join(', ')} };

void playMySong() {
  for (int i = 0; i < ${freqs.length}; i++) {
    tone(PIN_SPEAKER, melody[i], noteDurations[i]);
    delay(350);
  }
}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateArduinoCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              استوديو تلحين النغمات والموسيقى للأطفال (Robot Melody & Piano Studio)
            </h3>
            <p className="text-[11px] text-slate-400">عزف النوتات الموسيقية وتحويلها إلى كود نغمات يعمل على مكبر صوت الـ ESP32</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playEntireMelody}
            disabled={isPlaying || melody.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPlaying ? 'جاري العزف...' : 'عزف اللحن بالكامل 🎶'}</span>
          </button>
          <button
            onClick={clearMelody}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
            title="مسح اللحن"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Piano Keys */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-slate-300">لوحة البيانو الموسيقية (اضغط على المفاتيح لإضافتها):</span>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {PIANO_NOTES.map((note, i) => (
            <button
              key={i}
              onClick={() => addNote(note)}
              className={`${note.color} text-slate-950 font-black py-4 rounded-xl text-xs flex flex-col items-center justify-between transition transform active:scale-95 shadow-md shadow-black/40 h-24`}
            >
              <Volume2 className="w-4 h-4 opacity-70" />
              <span>{note.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Melody Track Timeline */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
          <span>شريط اللحن الموسيقي ({melody.length}/16 نوتة):</span>
          <span className="text-[10px] text-amber-400">انقر على النوتة لحذفها</span>
        </div>

        <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center">
          {melody.length === 0 ? (
            <span className="text-slate-500 text-xs py-2">لا توجد نوتات بعد. اضغط على مفاتيح البيانو في الأعلى لعزف لحنك الأول!</span>
          ) : (
            melody.map((n, idx) => (
              <button
                key={idx}
                onClick={() => removeNote(idx)}
                className="bg-slate-800 hover:bg-red-950/60 border border-slate-700 hover:border-red-500 text-slate-200 hover:text-red-300 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 group shadow-sm"
              >
                <span className="text-[10px] text-amber-400 font-mono">#{idx + 1}</span>
                <span>{n.name}</span>
                <span className="text-red-400 opacity-0 group-hover:opacity-100 text-[10px]">✕</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Arduino C++ Export */}
      <div className="relative bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
        <code className="truncate max-w-[85%]">{generateArduinoCode().split('\n')[0]} ...</code>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-sans font-bold transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'تم النسخ!' : 'نسخ كود C++'}</span>
        </button>
      </div>
    </div>
  );
};
