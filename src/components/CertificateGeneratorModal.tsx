import React, { useState } from 'react';
import { Award, Printer, Download, Sparkles, UserCheck, Star, ShieldCheck, CheckCircle2, Bookmark } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CertificateGeneratorModal: React.FC = () => {
  const [studentName, setStudentName] = useState('زينب حيدر الموسوي');
  const [courseName, setCourseName] = useState('مسار هندسة الروبوتات والبرمجة الخوارزمية (منظومة Mini G)');
  const [coachName, setCoachName] = useState('المهندس علي أحمد التميمي');
  const [dateStr, setDateStr] = useState('2026-08-29');

  const handlePrint = () => {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              مركز إصدار الشهادات الهندسية المعتمدة (Official STEM Certificate of Excellence)
            </h3>
            <p className="text-[11px] text-slate-400">شهادات تفوق رسمية بطابع أكاديمي مرموق تمنح للطلاب المتميزين في مشاريع الروبوتكس</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs transition shadow-lg active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الشهادة المعتمدة 🖨️</span>
        </button>
      </div>

      {/* Editor Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-bold">اسم الطالب / المهندس الصغير:</label>
          <input
            type="text"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-bold">عنوان المسار / المنهج التدريبي:</label>
          <input
            type="text"
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-bold">المدرب / المشرف الأكاديمي:</label>
          <input
            type="text"
            value={coachName}
            onChange={e => setCoachName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Heavy Academic Certificate Preview */}
      <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-8 md:p-12 rounded-2xl border-4 border-double border-amber-500/80 shadow-2xl flex flex-col items-center text-center gap-5 select-none overflow-hidden min-h-[440px] print:m-0 print:border-none print:shadow-none">
        {/* Subtle Guilloche / Border Corner Accents */}
        <div className="absolute top-4 right-4 text-amber-500/30 text-4xl">❖</div>
        <div className="absolute top-4 left-4 text-amber-500/30 text-4xl">❖</div>
        <div className="absolute bottom-4 right-4 text-amber-500/30 text-4xl">❖</div>
        <div className="absolute bottom-4 left-4 text-amber-500/30 text-4xl">❖</div>

        {/* Certificate Header Strip */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px] font-bold tracking-widest uppercase">
            <Sparkles className="w-4 h-4" />
            <span>MINI G ROBOTICS & STEM ACADEMY</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight">
            شهادة تفوق واعتماد هندسي 🎓
          </h2>
          <div className="w-36 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-full mt-1" />
        </div>

        {/* Recipient Statement */}
        <p className="text-xs md:text-sm text-slate-400 max-w-lg mt-2">
          تشهد إدارة المنصة ومختبرات الروبوتكس المعتمدة بأن المهندس / المهندسة الصغيرة:
        </p>

        <div className="text-2xl md:text-3xl font-black text-amber-300 border-b-2 border-amber-500/40 pb-2 px-10 tracking-wide font-serif">
          {studentName || 'اسم الطالب الثلاثي'}
        </div>

        <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
          قد أتم بنجاح واقتدار كافة متطلبات المشاريع التطبيقية والبرمجة الخوارزمية وبناء التوأم الرقمي والتحكم بأنظمة الـ <strong className="text-white">ESP32</strong> ضمن المسار التخصصي:
        </p>

        <div className="text-xs sm:text-sm font-bold text-blue-300 bg-blue-950/60 px-5 py-2 rounded-xl border border-blue-500/40 shadow-inner">
          {courseName}
        </div>

        {/* Signatures & Seal */}
        <div className="w-full grid grid-cols-3 items-center pt-8 mt-auto border-t border-slate-800 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-slate-500 text-[10px]">المدرب المشرف:</span>
            <span className="font-bold text-white mt-0.5">{coachName}</span>
          </div>

          {/* Official Gold Seal Badge */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center text-amber-300 text-xl font-bold shadow-lg shadow-amber-500/20">
              ★
            </div>
            <span className="text-[9px] text-amber-400 font-mono mt-1">OFFICIAL SEAL</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-slate-500 text-[10px]">تاريخ الاعتماد:</span>
            <span className="font-bold text-white mt-0.5 font-mono">{dateStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
