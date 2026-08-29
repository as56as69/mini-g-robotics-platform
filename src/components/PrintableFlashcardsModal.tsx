import React, { useState } from 'react';
import { Layers, Printer, Sparkles, CheckSquare, Trophy, BookOpen, Cpu, ShieldCheck, Terminal } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChallengeCard {
  id: string;
  protocolCode: string;
  number: number;
  title: string;
  targetRobot: string;
  objective: string;
  hardwarePins: string;
  blocksHint: string[];
  difficulty: string;
  stars: number;
  color: string;
}

const FLASHCARDS: ChallengeCard[] = [
  {
    id: 'f1',
    protocolCode: 'LAB-PROTOCOL-01',
    number: 1,
    title: 'المهمة المخبرية 1: إشارة البدء ومعايرة الهابتيك 🚦',
    targetRobot: 'Mini G-F (الميدالية)',
    objective: 'برمجة إشارة دخل اللمس لتفعيل نبضة اهتزاز متزامنة مع إضاءة ليد الـ RGB باللون الأخضر للتأكد من سلامة توصيل الـ GPIO.',
    hardwarePins: 'WS2812B Data: Pin 8 | Haptic: Pin 4 | Touch: Pin 2',
    blocksHint: ['[🎨 لوّن الروبوت بلون: أخضر]', '[📳 هزاز الروبوت: نبضة قصيرة]'],
    difficulty: 'أساسي (Beginner)',
    stars: 3,
    color: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'f2',
    protocolCode: 'LAB-PROTOCOL-02',
    number: 2,
    title: 'المهمة المخبرية 2: الحسابات الكينماتيكية لسيرفو الرأس 🤖',
    targetRobot: 'Mini G-M (رفيق المكتب)',
    objective: 'معايرة زوايا السيرفو بزاوية 45° ومزامنة مصفوفة تعابير شاشة الـ OLED مع إصدار نغمة ترحيبية بتردد 523Hz.',
    hardwarePins: 'Servo PWM: Pin 18 | OLED SDA: 21 / SCL: 22 | Buzzer: 19',
    blocksHint: ['[👀 عيون الروبوت: سعيد]', '[🤖 حرّك الرأس: 45 يمين]', '[🎵 تشغيل نغمة: الفوز]'],
    difficulty: 'متوسط (Intermediate)',
    stars: 3,
    color: 'from-cyan-600 to-blue-700'
  },
  {
    id: 'f3',
    protocolCode: 'LAB-PROTOCOL-03',
    number: 3,
    title: 'المهمة المخبرية 3: التحكم بالملاحة والتخاطب التوليدي 🧠',
    targetRobot: 'Mini G (الروبوت الكامل)',
    objective: 'توجيه محركات القيادة التفاضلية للأمام، وتفعيل وضع الذكاء الاصطناعي بشخصية الخوارزمي لنطق المسألة الرياضية.',
    hardwarePins: 'Motors L/R: Pin 14/27 | Servos: 25/26 | Audio DAC: 22',
    blocksHint: ['[🚗 تحرك بالعجلات: للأمام]', '[🦾 حركة الأذرع: رفع اليدين]', '[🎭 شخصية الذكاء: الخوارزمي]'],
    difficulty: 'متقدم (Advanced Pro)',
    stars: 3,
    color: 'from-purple-600 to-indigo-800'
  },
  {
    id: 'f4',
    protocolCode: 'LAB-PROTOCOL-04',
    number: 4,
    title: 'المهمة المخبرية 4: نظام الإنذار واستشعار اللمس 🛡️',
    targetRobot: 'Mini G-F (الميدالية)',
    objective: 'بناء حلقة شرطية تقرأ حساسية السعة الكهروسكونية (Capacitive Touch) وتطلق وميض طوارئ فوري بالأحمر.',
    hardwarePins: 'Touch Input: GPIO 2 | RGB Status: GPIO 8',
    blocksHint: ['[👆 عند لمس رأس الروبوت]', '[🎨 لوّن الروبوت: أحمر]', '[📳 هزاز الروبوت: نبضتان]'],
    difficulty: 'أساسي (Beginner)',
    stars: 3,
    color: 'from-slate-700 to-slate-900'
  }
];

export const PrintableFlashcardsModal: React.FC = () => {
  const [cards] = useState<ChallengeCard[]>(FLASHCARDS);

  const handlePrint = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col gap-5 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-600/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              بطاقات وبروتوكولات التجارب المخبرية (Engineering Lab Mission Cards)
            </h3>
            <p className="text-[11px] text-slate-400">بطاقات عمل مطبوعة توضع أمام كل محطة عمل لتمكين الطلاب من تنفيذ التحدي باحترافية</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:brightness-110 text-white font-bold rounded-xl text-xs transition shadow-lg active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة بطاقات التجارب 🖨️</span>
        </button>
      </div>

      {/* Lab Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between gap-3 shadow-xl relative overflow-hidden"
          >
            {/* Header Protocol */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-mono font-bold text-blue-400">{card.protocolCode}</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {card.difficulty}
              </span>
            </div>

            {/* Title & Objective */}
            <div>
              <h4 className="font-black text-sm text-white">{card.title}</h4>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <strong className="text-blue-300 block mb-1">الهدف الهندسي:</strong>
                {card.objective}
              </p>
            </div>

            {/* Hardware Pins Spec */}
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60 font-mono text-[10px] text-slate-400">
              <span className="text-slate-500 block">HARDWARE PINS:</span>
              <span className="text-emerald-400 font-bold">{card.hardwarePins}</span>
            </div>

            {/* Block Hints */}
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>الكتل البرمجية المستهدفة (Blockly Flow):</span>
              </span>
              <div className="flex flex-col gap-1 mt-0.5">
                {card.blocksHint.map((hint, idx) => (
                  <code key={idx} className="text-[11px] text-cyan-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {hint}
                  </code>
                ))}
              </div>
            </div>

            {/* Footer Verification Seal */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>اعتماد المدرب: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
              </span>
              <span className="font-mono text-slate-400 font-bold">MINI G STEM SPEC</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
