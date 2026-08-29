import React, { useState } from 'react';
import { Award, Printer, Download, Sparkles, UserCheck, Star, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CertificateGeneratorModal: React.FC = () => {
  const [studentName, setStudentName] = useState('زينب حيدر');
  const [courseName, setCourseName] = useState('أساسيات برمجة الروبوتات والذكاء الاصطناعي (ميني جي)');
  const [coachName, setCoachName] = useState('المدرب علي أحمد');
  const [dateStr, setDateStr] = useState('2026-08-29');

  const handlePrint = () => {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm md:text-base text-white">
            مركز إصدار وطباعة شهادات الإنجاز للطلاب (Official STEM Certificate)
          </h3>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الشهادة الآن 🖨️</span>
        </button>
      </div>

      {/* Editor Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-bold">اسم الطالب / الطالبة:</label>
          <input
            type="text"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-bold">عنوان الدورة / المنهج:</label>
          <input
            type="text"
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-bold">اسم المدرب المعتمد:</label>
          <input
            type="text"
            value={coachName}
            onChange={e => setCoachName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Certificate Visual Canvas Preview (Print-friendly) */}
      <div className="relative bg-gradient-to-br from-amber-50 via-slate-50 to-orange-50 text-slate-900 p-8 rounded-2xl border-4 border-double border-amber-600 shadow-2xl flex flex-col items-center text-center gap-4 select-none overflow-hidden min-h-[380px] print:m-0 print:border-none print:shadow-none">
        {/* Decorative corner badges */}
        <div className="absolute top-4 right-4 text-3xl opacity-40">🤖</div>
        <div className="absolute top-4 left-4 text-3xl opacity-40">🚀</div>
        <div className="absolute bottom-4 right-4 text-3xl opacity-40">⭐</div>
        <div className="absolute bottom-4 left-4 text-3xl opacity-40">🏆</div>

        {/* Header Ribbon */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-amber-700 font-black tracking-wider text-xs">
            <Sparkles className="w-4 h-4" />
            <span>منصة ميني جي للروبوتكس والذكاء الاصطناعي للأطفال</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            شهادة تفوق وإنجاز برمجي 🎓
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1.5" />
        </div>

        {/* Body Text */}
        <p className="text-xs md:text-sm text-slate-600 max-w-lg mt-1">
          تُمنح هذه الشهادة تقديراً للجهد المتميز والإبداع المنطقي للبطل / البطلة:
        </p>

        <div className="text-xl md:text-2xl font-black text-indigo-900 border-b-2 border-indigo-300 pb-1 px-8">
          {studentName || 'اسم الطالب'}
        </div>

        <p className="text-xs text-slate-600 max-w-md">
          لاختتامه بنجاح كافة التحديات العملية والبرمجة الرسومية والتحكم اللحظي بروبوتات <span className="font-bold text-slate-800">Mini G Platform</span> ضمن مسار:
        </p>

        <div className="text-sm font-bold text-amber-800 bg-amber-100/70 px-4 py-1.5 rounded-full border border-amber-300/80">
          {courseName}
        </div>

        {/* Footer Signatures */}
        <div className="w-full grid grid-cols-2 pt-6 mt-auto border-t border-slate-300 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-slate-500 text-[11px]">المدرب المشرف:</span>
            <span className="font-bold text-slate-900 mt-0.5">{coachName}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-slate-500 text-[11px]">التاريخ والاعتماد:</span>
            <span className="font-bold text-slate-900 mt-0.5">{dateStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
