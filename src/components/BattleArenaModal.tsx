import React, { useState, useEffect } from 'react';
import { RobotModelType } from '../types/robot';
import { Trophy, Timer, Play, Pause, RotateCcw, Swords, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  model: RobotModelType;
}

interface TeamScore {
  name: string;
  score: number;
  color: string;
  completedQuests: number;
}

export const BattleArenaModal: React.FC<Props> = ({ model }) => {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const [isRunning, setIsRunning] = useState(false);
  const [teams, setTeams] = useState<TeamScore[]>([
    { name: 'فريق الصقور 🦅', score: 280, color: 'from-amber-500 to-orange-600', completedQuests: 3 },
    { name: 'فريق النجوم ⭐', score: 310, color: 'from-cyan-500 to-blue-600', completedQuests: 4 },
    { name: 'فريق الأبطال 🚀', score: 250, color: 'from-purple-500 to-pink-600', completedQuests: 2 },
  ]);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRunning(false);
            SoundFXManager.playVictory();
            confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => {
    SoundFXManager.playClickBeep();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    SoundFXManager.playClickBeep();
    setIsRunning(false);
    setTimeLeft(120);
  };

  const addScore = (teamIndex: number, points: number) => {
    SoundFXManager.playRobotChirp();
    setTeams(prev => {
      const copy = [...prev];
      copy[teamIndex].score += points;
      copy[teamIndex].completedQuests += 1;
      return copy;
    });
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">
            حلبة المسابقات وتحديات الفرق المباشرة (Live Classroom Battle Arena)
          </span>
        </div>
        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
          <Flame className="w-3 h-3 fill-current animate-pulse" />
          <span>المسابقة الأسبوعية</span>
        </span>
      </div>

      {/* Countdown Timer Header */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className={`w-5 h-5 ${isRunning ? 'text-emerald-400 animate-spin' : 'text-slate-400'}`} />
          <div>
            <div className="text-[10px] text-slate-400">الوقت المتبقي للجولة:</div>
            <div className="text-xl font-black font-mono text-white tracking-wider">{formatTime(timeLeft)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTimer}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow active:scale-95 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunning ? 'إيقاف مؤقت' : 'بدء التحدي ⏱️'}</span>
          </button>
          <button
            onClick={resetTimer}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="إعادة التوقيت"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Teams Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {teams.map((team, idx) => (
          <div
            key={idx}
            className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between gap-2 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">{team.name}</span>
              <span className="text-[10px] font-bold text-amber-400">{team.completedQuests} مهام ✅</span>
            </div>

            <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 font-mono">
              {team.score} <span className="text-xs font-normal text-slate-400">نقطة</span>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-850">
              <button
                onClick={() => addScore(idx, 50)}
                className="flex-1 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/50 text-[10px] font-bold transition active:scale-95"
              >
                +50 نقطة
              </button>
              <button
                onClick={() => addScore(idx, 100)}
                className="flex-1 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 text-[10px] font-bold transition active:scale-95"
              >
                +100 🏆
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
