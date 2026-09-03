import React, { useState } from 'react';
import { MEDALS } from './data';
import { useNotebook } from './notebookContext';

/* كود ماجيك بالتفت — تبويب المعلم (إدارة الطلاب)
 * ============================================================
 */

export const TeacherTab: React.FC = () => {
  const { students, currentStudent, setCurrentStudent, addStudent, deleteStudent } = useNotebook();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setMsg('😅 اكتب اسم الطفل!'); return; }
    if (students.some((s) => s.name === trimmed)) { setMsg('😅 هذا الاسم موجود بالفعل!'); return; }
    addStudent(trimmed);
    setName('');
    setAdding(false);
    setMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-bold text-xl text-[#2d3436]">👩‍🏫 لوحة المعلم</h2>
        <button onClick={() => setAdding(!adding)} className="font-bold px-4 py-2 bg-[#6c5ce7] text-white rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#4a3f8a]">➕ إضافة طفل</button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-white rounded-[24px_8px_24px_8px] border-4 border-dashed border-[#6c5ce7] max-w-sm">
          <h3 className="font-bold mb-3 text-center text-[#2d3436]">👶 إضافة طفل جديد</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="اكتب اسم الطفل..."
            maxLength={20}
            autoFocus
            className="w-full p-2.5 font-bold text-base border-[3px] border-dashed border-[#d4b8a0] rounded-[20px_6px_20px_6px] outline-none focus:border-[#6c5ce7] mb-3"
          />
          <div className="flex gap-2 justify-center">
            <button onClick={() => setAdding(false)} className="font-bold px-4 py-2 bg-[#ff7675] text-white rounded-[30px_8px_30px_8px]">إلغاء</button>
            <button onClick={submit} className="font-bold px-4 py-2 bg-[#6c5ce7] text-white rounded-[30px_8px_30px_8px] shadow-[3px_3px_0_#4a3f8a]">✅ إضافة</button>
          </div>
        </div>
      )}

      {msg && <div className="mb-3 bg-white px-4 py-2 rounded-xl border-2 border-dashed border-[#ff6b6b] text-sm font-bold text-center">{msg}</div>}

      {students.length === 0 ? (
        <div className="text-center py-16 text-[#636e72]">
          🧸 لا يوجد أطفال بعد
          <br /><span className="text-sm">اضغط "إضافة طفل" لإضافة طالب جديد</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((s, i) => {
            const total = 28;
            const pct = total > 0 ? Math.round((s.completedLetters.length / total) * 100) : 0;
            const medals = Object.entries(MEDALS).filter(([, m]) => s.stars >= m.stars).map(([, m]) => m.emoji).join('') || '🔰';
            return (
              <div
                key={i}
                onClick={() => setCurrentStudent(s)}
                className={`bg-white rounded-[18px_5px_18px_5px] border-[3px] p-4 shadow-[4px_4px_0_rgba(0,0,0,0.06)] cursor-pointer transition ${
                  currentStudent?.name === s.name ? 'border-[#6c5ce7] ring-2 ring-[#6c5ce7]/40' : 'border-dashed border-[#d4b8a0]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-lg text-[#2d3436]">👶 {s.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`هل تريد حذف ${s.name}؟`)) deleteStudent(i); }}
                    className="text-[#ff6b6b] font-bold"
                    title="حذف"
                  >✕</button>
                </div>
                <div className="text-sm text-[#636e72] mt-1">⭐ {s.stars} نجمة | 📚 {s.completedLetters.length}/28 حرف</div>
                <div className="w-full h-2 bg-[#dfe6e9] rounded-lg overflow-hidden mt-2">
                  <div className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] transition-all" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="text-sm mt-2">{medals}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
