import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundFXManager } from '../ble/SoundFX';

interface ReviewResult {
  score: number;
  positives: string[];
  tips: string[];
  grade: string;
}

function analyzeStudentCode(code: string): ReviewResult {
  const trimmed = code.trim();
  if (!trimmed) {
    return {
      score: 0,
      grade: 'لا يوجد كود بعد 🍃',
      positives: ['مساحة العمل فارغة حالياً'],
      tips: ['اسحب كتل الأوامر من القائمة إلى فضاء العمل ثم اضغط زر «تشغيل» لتحليل برنامجك الحقيقي!']
    };
  }

  const cmdMatches = code.match(/__BLE_DISPATCH__\((\d+)/g) || [];
  const uniqueCmds = new Set(cmdMatches.map(m => m.match(/\d+/)?.[0]));
  const cmdCount = cmdMatches.length;
  const loopCount = (code.match(/\bfor\s*\(/g) || []).length + (code.match(/\bwhile\s*\(/g) || []).length;
  const condCount = (code.match(/\bif\s*\(/g) || []).length;
  const delayCount = (code.match(/wait\(\d+\)/g) || []).length;

  // Real heuristic scoring based on what is actually in the program
  let score = 35;
  const positives: string[] = [];
  const tips: string[] = [];

  if (cmdCount >= 1) { score += 15; positives.push(`برنامجك يرسل ${Math.min(cmdCount, 20).toLocaleString('en-US')} أمراً حقيقياً للروبوت عبر BLE ترجمةً لبلوكاتك`); }
  if (uniqueCmds.size >= 2) { score += 8; positives.push(`استخدمت ${uniqueCmds.size} أوامر مختلفة (تشويق وتنوع في البرنامج)`); }
  if (uniqueCmds.size >= 4) { score += 7; positives.push('تنويع ممتاز بين حركة الروبوت والأضواء والأصوات'); }
  if (loopCount >= 1) { score += 12; positives.push('أحسنت! استخدمت حلقة تكرار لتقليل تكرار الكتل المكررة (توفير ذاكرة الـ ESP32)'); }
  else { tips.push('جرّب استخدام كتلة «التكرار» بدل تكرار نفس الكتل عدة مرات لتقصير برنامجك'); }
  if (condCount >= 1) { score += 9; positives.push('استخدام جيد للشروط في الأحداث الشرطية'); }
  else { tips.push('فكّر بإضافة كتلة شرطية «عندما...» لتجعل الروبوت يقرر بنفسه (ذكاء صناعي بسيط!)'); }
  if (delayCount >= 1) { score += 6; positives.push('أضفت فترات انتظار مناسبة بين الأوامر ليتنفس الروبوت'); }
  else if (cmdCount >= 4) { tips.push('أضف كتلة «انتظار» بين الأوامر المتتالية حتى يظهر أثر كل أمر بوضوح'); }
  if (cmdCount >= 6) { score += 5; tips.push('برنامج طموح! جرّب حفظه في مساحة مشروعك ثم تصميم سيناريو جديد'); }
  else { tips.push('هل يمكنك إضافة خطوة جديدة (نغمة أو ضوء) ليجعل برنامجك أكثر إبداعاً؟'); }

  score = Math.min(100, Math.max(0, score));
  const grade =
    score >= 90 ? 'ممتاز وذكي جداً! 🌟' :
    score >= 70 ? 'جيد جداً، استمر بالإبداع! 🚀' :
    score >= 45 ? 'بداية رائعة، جرب التحسينات التالية!' : 'خطوة أولى طيبة، أكمل البرنامج!';

  return {
    score,
    grade,
    positives: positives.length ? positives.slice(0, 4) : ['برنامجك يعمل — خطوة أولى جيدة!'],
    tips: tips.length ? tips.slice(0, 3) : ['فكر بسيناريو أكبر يدمج الحساسات والحركة معاً!']
  };
}

export const AICodeReviewerModal: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult>({
    score: 0,
    grade: 'لم يُحلل بعد 🧠',
    positives: ['اضغط «فحص كود الطالب» لتحليل البرنامج الحالي في مساحة العمل'],
    tips: ['شغّل برنامجك من مساحة البلوكات أولاً، ثم اضغط الفحص هنا']
  });
  const mountedRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleRunAnalysis = () => {
    if (analyzing) return;
    setAnalyzing(true);
    SoundFXManager.playRobotChirp();

    timerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      const code = (window as any).__LAST_STUDENT_CODE__ || '';
      const result = analyzeStudentCode(code);
      setReviewResult(result);
      setAnalyzing(false);
      if (result.score <= 0) return;
      SoundFXManager.playVictory();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }, 800);
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
