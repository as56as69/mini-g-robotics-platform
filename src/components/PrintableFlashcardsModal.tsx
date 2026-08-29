import React, { useState } from 'react';
import { Layers, Printer, Sparkles, CheckSquare, Trophy, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChallengeCard {
  id: string;
  number: number;
  title: string;
  targetRobot: string;
  missionStory: string;
  blocksHint: string[];
  stars: number;
  color: string;
}

const FLASHCARDS: ChallengeCard[] = [
  {
    id: 'f1',
    number: 1,
    title: 'مهمة 1: إشارة البداية الضوئية 🚦',
    targetRobot: 'Mini G-F (الميدالية)',
    missionStory: 'الميدالية ستبدأ رحلتها في الفضاء! اجعلها تضيء بالأخضر وتهتز نبضة واحدة لإعلان جاهزية الصاروخ.',
    blocksHint: ['[🎨 لوّن الروبوت بلون: أخضر]', '[📳 هزاز الروبوت: نبضة قصيرة]'],
    stars: 3,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'f2',
    number: 2,
    title: 'مهمة 2: تحية الصباح لرفيق المكتب 🌞',
    targetRobot: 'Mini G-M (رفيق المكتب)',
    missionStory: 'استيقظ رفيقك الذكي! اجعل عيونه تبتسم بالسعادة، ويدير رأسه لليمين 45 درجة ليلقي التحية بنغمة فرح.',
    blocksHint: ['[👀 عيون الروبوت: سعيد]', '[🤖 حرّك الرأس: 45 يمين]', '[🎵 تشغيل نغمة: الفوز والاحتفال]'],
    stars: 3,
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'f3',
    number: 3,
    title: 'مهمة 3: روبوت الفصل الذكي 🤖',
    targetRobot: 'Mini G (الروبوت الكامل)',
    missionStory: 'قُد الروبوت للأمام ليتجاوز العائق، ثم ارفع ذراعيه ترحيباً بالطلاب واجعله يتحدث بصوت العالم الخوارزمي!',
    blocksHint: ['[🚗 تحرك بالعجلات: للأمام بسرعة]', '[🦾 حركة الأذرع: رفع اليدين]', '[🎭 غيّر شخصية الذكاء: الخوارزمي]'],
    stars: 3,
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'f4',
    number: 4,
    title: 'مهمة 4: حارس الأسرار واللمس 🛡️',
    targetRobot: 'Mini G-F (الميدالية)',
    missionStory: 'برمج الميدالية لتكون جهاز إنذار ذكي: عندما يلمس شخص رأس الميدالية، تومض فوراً بالأحمر وتهتز بنبضتين!',
    blocksHint: ['[👆 عند لمس رأس الروبوت]', '[🎨 لوّن الروبوت: أحمر]', '[📳 هزاز الروبوت: نبضتان]'],
    stars: 3,
    color: 'from-rose-500 to-red-600'
  }
];

export const PrintableFlashcardsModal: React.FC = () => {
  const [cards] = useState<ChallengeCard[]>(FLASHCARDS);

  const handlePrint = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              بطاقات التحديات والمهام الورقية المطبوعة (STEAM Mission Flashcards)
            </h3>
            <p className="text-[11px] text-slate-400">توزع على طاولات الطلاب بالورش ليقوم الطفل بتطبيق الكود المطلوب خطوة بخطوة</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة بطاقات المهام 🖨️</span>
        </button>
      </div>

      {/* Printable Flashcards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-slate-950 border-2 border-slate-850 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xl relative overflow-hidden"
          >
            {/* Card Header Strip */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full text-white bg-gradient-to-r ${card.color}`}>
                {card.targetRobot}
              </span>
              <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                {'⭐'.repeat(card.stars)} (100 XP)
              </span>
            </div>

            {/* Title & Story */}
            <div>
              <h4 className="font-black text-sm text-white">{card.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                {card.missionStory}
              </p>
            </div>

            {/* Block Hints */}
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-kid-yellow" />
                <span>البلوكات المقترحة للحل:</span>
              </span>
              <div className="flex flex-col gap-1 mt-0.5">
                {card.blocksHint.map((hint, idx) => (
                  <code key={idx} className="text-[11px] text-emerald-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {hint}
                  </code>
                ))}
              </div>
            </div>

            {/* Verification Checkbox for Teacher */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-850">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>ختم تقييم المدرب: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
              </span>
              <span className="font-bold text-slate-500">Mini G Series</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
