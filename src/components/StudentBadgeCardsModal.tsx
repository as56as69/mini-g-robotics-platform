import React, { useState } from 'react';
import { QrCode, Printer, Sparkles, User, Key, CheckCircle, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentCard {
  id: string;
  name: string;
  loginCode: string;
  secretEmojis: string[];
  assignedRobot: string;
  stars: number;
}

const MOCK_STUDENTS: StudentCard[] = [
  { id: '1', name: 'زينب حيدر', loginCode: 'MG-7821', secretEmojis: ['🦁', '⭐', '🚀'], assignedRobot: 'Mini G-M (رفيق المكتب)', stars: 120 },
  { id: '2', name: 'أحمد علي', loginCode: 'MG-9412', secretEmojis: ['🐬', '🎨', '⚡'], assignedRobot: 'Mini G-M (رفيق المكتب)', stars: 95 },
  { id: '3', name: 'مصطفى حسين', loginCode: 'MG-3310', secretEmojis: ['🤖', '🔥', '🏆'], assignedRobot: 'Mini G-F (الميدالية)', stars: 140 },
  { id: '4', name: 'نور الهدى فراس', loginCode: 'MG-6654', secretEmojis: ['🌸', '💡', '🌟'], assignedRobot: 'Mini G (الروبوت الكامل)', stars: 180 },
  { id: '5', name: 'يوسف عمر', loginCode: 'MG-1290', secretEmojis: ['🐯', '🎮', '💎'], assignedRobot: 'Mini G-M (رفيق المكتب)', stars: 110 },
  { id: '6', name: 'مريم عمار', loginCode: 'MG-8801', secretEmojis: ['🦄', '🌙', '🎯'], assignedRobot: 'Mini G-F (الميدالية)', stars: 85 },
];

export const StudentBadgeCardsModal: React.FC = () => {
  const [students, setStudents] = useState<StudentCard[]>(MOCK_STUDENTS);
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedRobot, setSelectedRobot] = useState('Mini G-M');

  const handlePrint = () => {
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    window.print();
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const emojiPool = ['🦁', '🐬', '🤖', '🚀', '⭐', '🎨', '⚡', '🏆', '💡', '🎮', '💎', '🦄'];
    const shuffled = [...emojiPool].sort(() => 0.5 - Math.random());
    const randomEmojis = shuffled.slice(0, 3);
    const code = `MG-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCard: StudentCard = {
      id: `${Date.now()}`,
      name: newStudentName.trim(),
      loginCode: code,
      secretEmojis: randomEmojis,
      assignedRobot: selectedRobot,
      stars: 0
    };

    setStudents(prev => [newCard, ...prev]);
    setNewStudentName('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              بطاقات الدخول السريع للأطفال بالرموز التعبيرية (Emoji Login Badges)
            </h3>
            <p className="text-[11px] text-slate-400">تسهل على أطفال 7 سنوات تسجيل الدخول للفصل بدون كلمات مرور معقدة</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة بطاقات الفصل 🖨️</span>
        </button>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddStudent} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
        <input
          type="text"
          value={newStudentName}
          onChange={e => setNewStudentName(e.target.value)}
          placeholder="اسم الطالب الجديد..."
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={selectedRobot}
          onChange={e => setSelectedRobot(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="Mini G-F (الميدالية)">Mini G-F (الميدالية)</option>
          <option value="Mini G-M (رفيق المكتب)">Mini G-M (رفيق المكتب)</option>
          <option value="Mini G (الروبوت الكامل)">Mini G (الروبوت الكامل)</option>
        </select>
        <button
          type="submit"
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow active:scale-95"
        >
          + توليد بطاقة الطالب
        </button>
      </form>

      {/* Printable Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-2">
        {students.map((st) => (
          <div
            key={st.id}
            className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg relative overflow-hidden"
          >
            {/* Holographic Header Strip */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                MINI G PASS 🤖
              </span>
              <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                {st.loginCode}
              </span>
            </div>

            {/* Student Name */}
            <div>
              <h4 className="font-black text-base text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                <span>{st.name}</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{st.assignedRobot}</p>
            </div>

            {/* Visual Emoji Passcode */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-1">
              <span className="text-[9px] text-slate-400 font-bold">كلمة المرور الرمزية للطفل:</span>
              <div className="flex items-center gap-2 text-2xl tracking-widest py-0.5">
                {st.secretEmojis.map((em, i) => (
                  <span key={i} className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 shadow-inner">
                    {em}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer QR simulation */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Shield className="w-3 h-3" />
                <span>حساب معتمد للورشة</span>
              </span>
              <span className="text-amber-400 font-bold">⭐ {st.stars} XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
