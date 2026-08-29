import React, { useState } from 'react';
import { FileText, Printer, Sparkles, CheckCircle2, Download, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActivitySheet {
  id: string;
  title: string;
  grade: string;
  category: string;
  description: string;
  questions: { q: string; type: 'choice' | 'connect' | 'draw'; options?: string[] }[];
}

const ACTIVITIES: ActivitySheet[] = [
  {
    id: 'act1',
    title: 'ورقة عمل 1: مفاهيم البرمجة والحساسات في الروبوت',
    grade: 'الصف الثاني إلى الرابع الابتدائي',
    category: 'STEAM Logic',
    description: 'صل كل جزء في روبوت ميني جي بوظيفته الحقيقية:',
    questions: [
      { q: '1. ما هي وظيفة حساس المسافة (Ultrasonic / ToF)؟', type: 'choice', options: ['قياس المسافة وتفادي الحواجز', 'تشغيل الأغاني', 'تغيير لون الليد'] },
      { q: '2. ما هو دور محرك السيرفو (Servo Motor)؟', type: 'choice', options: ['تدوير الرأس والمفاصل بزوايا محددة', 'تسجيل الصوت', 'تغذية البطارية'] },
      { q: '3. ارسم مساراً للروبوت يصله بنجمة الفوز دون الاصطدام بالمتاهة:', type: 'draw' }
    ]
  },
  {
    id: 'act2',
    title: 'ورقة عمل 2: خوارزمية المشاعر والألوان',
    grade: 'الصف الثالث إلى الخامس الابتدائي',
    category: 'Robotics & Emotions',
    description: 'اكتب الكود الرسومي المناسب للتعبير عن الحالات التالية:',
    questions: [
      { q: '1. عندما يشعر الروبوت بالسعادة -> اللون: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] وتعبير العيون: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]', type: 'connect' },
      { q: '2. إذا لمس الطفل الروبوت، ما هو البلوك البرمجي الذي يجب أن نستخدمه كبداية؟', type: 'choice', options: ['[عند لمس الروبوت]', '[كرر 5 مرات]', '[انتظر 10 ثوان]'] },
      { q: '3. صمم وجهاً كرتونياً في شبكة الـ 8x8 للتعبير عن نظرة البطل الذكي:', type: 'draw' }
    ]
  }
];

export const PrintableActivitiesModal: React.FC = () => {
  const [selectedAct, setSelectedAct] = useState<ActivitySheet>(ACTIVITIES[0]);

  const handlePrint = () => {
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              أوراق عمل وأنشطة STEM الورقية للطباعة (Printable Classroom Worksheets)
            </h3>
            <p className="text-[11px] text-slate-400">أنشطة فكرية ورسم منطقي وتوصيل مفاهيم للأطفال داخل الفصل الدراسي</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة ورقة العمل 🖨️</span>
        </button>
      </div>

      {/* Sheet Picker */}
      <div className="flex gap-2">
        {ACTIVITIES.map(act => (
          <button
            key={act.id}
            onClick={() => setSelectedAct(act)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedAct.id === act.id
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {act.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Printable Sheet Canvas Preview */}
      <div className="bg-white text-slate-900 p-6 md:p-8 rounded-2xl border-2 border-slate-300 shadow-xl flex flex-col gap-4 min-h-[450px] print:m-0 print:border-none print:shadow-none">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900">{selectedAct.title}</h2>
            <p className="text-xs text-slate-600 mt-0.5">{selectedAct.grade} • مسار ميني جي للروبوتكس</p>
          </div>
          <div className="text-right text-xs">
            <div>اسم الطالب: _________________</div>
            <div className="mt-1">الصف / الشعبة: _________________</div>
          </div>
        </div>

        <p className="text-xs font-bold text-slate-700">{selectedAct.description}</p>

        {/* Questions Loop */}
        <div className="flex flex-col gap-4 text-xs">
          {selectedAct.questions.map((q, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
              <span className="font-bold text-slate-900">{q.q}</span>
              {q.type === 'choice' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-2 text-slate-700">
                  {q.options.map((opt, i) => (
                    <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="rounded text-indigo-600" />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'draw' && (
                <div className="w-full h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                  مساحة مخصصة لرسم الحل والمخطط ✏️
                </div>
              )}
              {q.type === 'connect' && (
                <div className="h-10 border-b border-slate-400 border-dashed" />
              )}
            </div>
          ))}
        </div>

        {/* Footer Rating */}
        <div className="mt-auto pt-3 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
          <span>تقييم المدرب: [ ⭐ ⭐ ⭐ ]</span>
          <span className="font-bold">منصة ميني جي التعليمية - Mini G Platform</span>
        </div>
      </div>
    </div>
  );
};
