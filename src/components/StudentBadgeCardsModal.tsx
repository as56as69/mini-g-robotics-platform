import React, { useState } from 'react';
import { QrCode, Printer, Sparkles, User, Key, CheckCircle, Shield, Cpu, Award, Zap, HardDrive } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentCard {
  id: string;
  name: string;
  loginCode: string;
  secretEmojis: string[];
  assignedRobot: string;
  stationId: string;
  stars: number;
}

const MOCK_STUDENTS: StudentCard[] = [
  { id: '1', name: 'زينب حيدر الموسوي', loginCode: 'MG-7821', secretEmojis: ['🦁', '⭐', '🚀'], assignedRobot: 'Mini G-M (رفيق المكتب)', stationId: 'Station-01', stars: 120 },
  { id: '2', name: 'أحمد علي السعدي', loginCode: 'MG-9412', secretEmojis: ['🐬', '🎨', '⚡'], assignedRobot: 'Mini G-M (رفيق المكتب)', stationId: 'Station-02', stars: 95 },
  { id: '3', name: 'مصطفى حسين الشمري', loginCode: 'MG-3310', secretEmojis: ['🤖', '🔥', '🏆'], assignedRobot: 'Mini G-F (الميدالية)', stationId: 'Station-03', stars: 140 },
  { id: '4', name: 'نور الهدى فراس الجبوري', loginCode: 'MG-6654', secretEmojis: ['🌸', '💡', '🌟'], assignedRobot: 'Mini G (الروبوت الكامل)', stationId: 'Station-04', stars: 180 },
  { id: '5', name: 'يوسف عمر الكرخي', loginCode: 'MG-1290', secretEmojis: ['🐯', '🎮', '💎'], assignedRobot: 'Mini G-M (رفيق المكتب)', stationId: 'Station-05', stars: 110 },
  { id: '6', name: 'مريم عمار الزيدي', loginCode: 'MG-8801', secretEmojis: ['🦄', '🌙', '🎯'], assignedRobot: 'Mini G-F (الميدالية)', stationId: 'Station-06', stars: 85 },
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
      stationId: `Station-${(students.length + 1).toString().padStart(2, '0')}`,
      stars: 0
    };

    setStudents(prev => [newCard, ...prev]);
    setNewStudentName('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col gap-5 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              بطاقات المهندس الصغير وبطاقات الدخول المعتمدة (Junior Robotics Engineer Pass)
            </h3>
            <p className="text-[11px] text-slate-400">بطاقات دخول ذكية تجمع بين رصانة هوية المهندس ورمز الإيموجي السري المناسب لسن 7 سنوات</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة بطاقات الفصل (A4 Ready) 🖨️</span>
        </button>
      </div>

      {/* Quick Add Student Form */}
      <form onSubmit={handleAddStudent} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2.5 text-xs">
        <input
          type="text"
          value={newStudentName}
          onChange={e => setNewStudentName(e.target.value)}
          placeholder="أدخل الاسم الثلاثي للطالب الجديد..."
          className="flex-1 min-w-[220px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
        />
        <select
          value={selectedRobot}
          onChange={e => setSelectedRobot(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="Mini G-F (الميدالية)">Mini G-F (الميدالية)</option>
          <option value="Mini G-M (رفيق المكتب)">Mini G-M (رفيق المكتب)</option>
          <option value="Mini G (الروبوت الكامل)">Mini G (الروبوت الكامل)</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow active:scale-95"
        >
          + إصدار بطاقة معتمدة
        </button>
      </form>

      {/* Engineering Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2">
        {students.map((st) => (
          <div
            key={st.id}
            className="bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 border-2 border-slate-750 hover:border-blue-500/50 rounded-2xl p-4.5 flex flex-col justify-between gap-3 shadow-xl relative overflow-hidden transition"
          >
            {/* Top Badge Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-mono font-black text-white tracking-widest">
                  MINI G ACADEMY
                </span>
              </div>
              <span className="font-mono text-[10px] bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-bold">
                {st.stationId}
              </span>
            </div>

            {/* Student Name & Official Title */}
            <div>
              <span className="text-[9px] text-slate-500 font-mono block">JUNIOR ROBOTICS ENGINEER</span>
              <h4 className="font-black text-sm text-white mt-0.5">{st.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{st.assignedRobot}</p>
            </div>

            {/* Secret Emoji & Passcode Vault */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-bold">رمز الدخول السري:</span>
                <div className="flex items-center gap-1.5 text-xl py-0.5">
                  {st.secretEmojis.map((em, i) => (
                    <span key={i} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {em}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-500 font-mono block">LOGIN CODE</span>
                <span className="font-mono text-xs font-bold text-amber-400">{st.loginCode}</span>
              </div>
            </div>

            {/* Footer Verification Bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Shield className="w-3 h-3" />
                <span>معتمد للعام 2026</span>
              </span>
              <span className="font-mono text-slate-400 font-bold">⭐ {st.stars} XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
