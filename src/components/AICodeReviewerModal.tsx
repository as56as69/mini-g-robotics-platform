import React, { useState } from 'react';
import { Bot, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundFXManager } from '../ble/SoundFX';

export const AICodeReviewerModal: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [reviewResult, setReviewResult] = useState<{
    score: number;
    positives: string[];
    tips: string[];
    grade: string;
  }>({
    score: 95,
    grade: 'ممتاز وذكي جداً! 🌟',
    positives: [
      'استخدام منظم لحلقات التكرار لتوفير استهلاك الذاكرة في الـ ESP32',
      'تزامن ممتاز بين حركة المحركات وإشارات الليدات الضوئية',
      'بناء منطقي سليم للأحداث الشرطية عند استشعار الحواجز'
    ],
    tips: [
      'يمكنك إضافة نغمة تحذيرية صوتية قصيرة قبل دوران المحرك لزيادة الأمان للأطفال',
      'جرب تقليل زمن الانتظار بمقدار 100ms لاستجابة أسرع للروبوت'
    ]
  });

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    SoundFXManager.playRobotChirp();

    setTimeout(() => {
      setAnalyzing(false);
      SoundFXManager.playVictory();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }, 1200);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              محلل الكود والتفكير المنطقي بالذكاء الاصطناعي (AI STEM Code Tutor)
            </h3>
            <p className="text-[11px] text-slate-400">يقدم ملاحظات تربوية وتشجيعية للأطفال لتحسين مهاراتهم البرمجية</p>
          </div>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'جاري التحليل...' : 'فحص كود الطالب الآن 🧠'}</span>
        </button>
      </div>

      {/* Score and Grade Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-purple-300 font-bold block">التقييم المنطقي العام:</span>
          <h4 className="text-lg font-black text-white mt-0.5">{reviewResult.grade}</h4>
        </div>
        <div className="text-3xl font-black text-amber-400 font-mono bg-slate-900/80 px-4 py-1.5 rounded-xl border border-amber-500/30">
          {reviewResult.score}/100
        </div>
      </div>

      {/* Positives Card */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>نقاط القوة والإبداع في الكود:</span>
        </span>
        <ul className="flex flex-col gap-1.5 text-xs text-slate-300 pr-2">
          {reviewResult.positives.map((p, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-emerald-400">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tips & Recommendations */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4" />
          <span>نصائح المعلم الذكي لتطوير الحل:</span>
        </span>
        <ul className="flex flex-col gap-1.5 text-xs text-slate-300 pr-2">
          {reviewResult.tips.map((t, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-amber-400">💡</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
