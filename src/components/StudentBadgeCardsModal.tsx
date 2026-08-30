import React, { useState } from 'react';
import { QrCode, Printer, Shield, Cpu } from 'lucide-react';
import { StudentProfile } from '../types/lms';
import confetti from 'canvas-confetti';

interface Props {
  /** Real roster coming from the shared school store (filtered to selected class) */
  students: StudentProfile[];
  /** Register a new student from the badges tab (goes straight into the selected section) */
  onAddStudent?: (input: { name: string; robot?: string }) => void | Promise<void>;
  /** Section whose cards we are printing (used in the print header) */
  sectionName?: string;
  /** Section join code (printed on the sheet header) */
  joinCode?: string;
}

const ROBOT_CHOICES = [
  'Mini G-F (الميدالية)',
  'Mini G-M (رفيق المكتب)',
  'Mini G (الروبوت الكامل)',
];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Standalone HTML used inside a dedicated print window — immune to the dashboard layout/overflow. */
const buildPrintHTML = (students: StudentProfile[], sectionName?: string, joinCode?: string): string => {
  const cards = students
    .map(
      (st) => `
      <div class="card">
        <div class="card-top">
          <div class="brand"><span class="chip-b">MG</span> MINI G ACADEMY</div>
          <div class="station">${esc(st.stationId)}</div>
        </div>
        <div class="title">JUNIOR ROBOTICS ENGINEER</div>
        <div class="name">${esc(st.name)}</div>
        <div class="robot">${esc(st.assignedRobot)}</div>
        <div class="secret">
          <div class="emoji-box">
            <div class="lbl">رمز الدخول السري</div>
            <div class="emojis">${(st.secretEmojis || []).map((e) => `<span class="em">${esc(e)}</span>`).join('')}</div>
          </div>
          <div class="login-box">
            <div class="lbl">LOGIN CODE</div>
            <div class="code" dir="ltr">${esc(st.loginCode)}</div>
          </div>
        </div>
        <div class="foot">
          <span class="ok">✔ معتمد للعام 2026</span>
          <span class="xp">⭐ ${st.stars || 0} XP</span>
        </div>
      </div>`
    )
    .join('');

  const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>بطاقات الفصل — ${esc(sectionName || '')}</title>
<style>
  @page { size: A4 portrait; margin: 7mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #0f172a; }
  .sheet-head { margin-bottom: 5mm; border-bottom: 0.4mm solid #1d4ed8; padding-bottom: 2.5mm; }
  .sheet-head h1 { margin: 0; font-size: 15pt; color: #1e293b; }
  .sheet-head .sub { margin-top: 1mm; font-size: 9pt; color: #475569; }
  .sheet-head .meta { margin-top: 1mm; font-size: 9pt; color: #334155; }
  .sheet-head .meta b { color: #1d4ed8; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
  .card {
    break-inside: avoid; page-break-inside: avoid;
    border-radius: 4mm; padding: 4mm 4.5mm;
    background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
    border: 0.5mm solid #1e293b; color: #fff;
    display: flex; flex-direction: column;
  }
  .card-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 0.35mm solid #1e293b; padding-bottom: 1.6mm; margin-bottom: 1.6mm; }
  .brand { display: flex; align-items: center; gap: 1.5mm; font-weight: 900; letter-spacing: 1px; font-size: 8pt; }
  .chip-b { background: #2563eb; color: #fff; border-radius: 1.5mm; padding: 0.6mm 1.6mm; font-size: 7pt; }
  .station { font-family: monospace; font-size: 7.5pt; color: #60a5fa; background: rgba(37,99,235,.18); border: 0.3mm solid rgba(96,165,250,.35); border-radius: 1.5mm; padding: 0.7mm 2mm; font-weight: 700; }
  .title { font-size: 6.5pt; letter-spacing: 0.5px; color: #94a3b8; font-family: monospace; }
  .name { font-size: 12pt; font-weight: 900; margin-top: 0.6mm; }
  .robot { font-size: 8pt; color: #cbd5e1; margin-top: 0.6mm; }
  .secret { display: flex; justify-content: space-between; align-items: center; background: #020617; border: 0.35mm solid #0f172a; border-radius: 2.5mm; padding: 2mm 2.5mm; margin-top: 2.2mm; }
  .lbl { font-size: 6.5pt; color: #64748b; font-weight: 700; }
  .emojis { display: flex; gap: 1.5mm; margin-top: 0.8mm; }
  .em { background: #0f172a; border: 0.3mm solid #1e293b; border-radius: 1mm; padding: 0.5mm 1.2mm; font-size: 12pt; line-height: 1; }
  .code { font-family: monospace; font-weight: 800; color: #fbbf24; font-size: 10pt; margin-top: 0.8mm; }
  .login-box { text-align: left; }
  .foot { display: flex; justify-content: space-between; align-items: center; border-top: 0.3mm solid #0f172a; margin-top: 2mm; padding-top: 1.6mm; font-size: 7pt; }
  .ok { color: #34d399; font-weight: 800; }
  .xp { font-family: monospace; color: #94a3b8; font-weight: 700; }
</style></head>
<body>
  <div class="sheet-head">
    <h1>بطاقات الفصل وبطاقات الدخول المعتمدة — Mini G Robotics Academy</h1>
    <div class="sub">وثائق رسمية للدخول إلى المختبر: تحمل رمز الإيموجي السري لكل مهندس صغير للتحقق من هويته قبل الدخول.</div>
    <div class="meta">
      الشعبة: <b>${esc(sectionName || '—')}</b> &nbsp;|&nbsp; كود الانضمام: <b dir="ltr">${esc(joinCode || '—')}</b> &nbsp;|&nbsp; عدد البطاقات: <b>${students.length}</b> &nbsp;|&nbsp; تاريخ الإصدار: <b>${esc(date)}</b>
    </div>
  </div>
  <div class="grid">${cards}</div>
</body></html>`;
};

export const StudentBadgeCardsModal: React.FC<Props> = ({ students, onAddStudent, sectionName, joinCode }) => {
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedRobot, setSelectedRobot] = useState(ROBOT_CHOICES[1]);
  const [submitting, setSubmitting] = useState(false);

  const handlePrint = () => {
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    const win = window.open('', '_blank');
    if (!win) {
      // popup blocked → fall back to printing the whole dashboard page
      window.print();
      return;
    }
    win.document.open();
    win.document.write(buildPrintHTML(students, sectionName, joinCode));
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 250);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !onAddStudent) return;
    setSubmitting(true);
    await onAddStudent({ name: newStudentName.trim(), robot: selectedRobot });
    setSubmitting(false);
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
            <p className="text-[11px] text-slate-400">بطاقات دخول ذكية تجمع بين رصانة هوية المهندس ورمز الإيموجي السري المناسب لسن 7 سنوات — تُطبع من سجل الشعبة الحقيقي</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={students.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow-lg active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة بطاقات الفصل (A4 Ready) 🖨️</span>
        </button>
      </div>

      {/* Quick Add Student Form — writes to the real roster of the selected section */}
      {onAddStudent && (
        <form onSubmit={handleAddStudent} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2.5 text-xs">
          <input
            type="text"
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            placeholder="أدخل الاسم الثلاثي للطالب الجديد (ستُصدر بطاقته فوراً)…"
            className="flex-1 min-w-[220px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <select
            value={selectedRobot}
            onChange={e => setSelectedRobot(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {ROBOT_CHOICES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            type="submit"
            disabled={submitting || !newStudentName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow active:scale-95"
          >
            {submitting ? 'جارِ…' : '+ تسجيل وإصدار بطاقة'}
          </button>
        </form>
      )}

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <div className="text-5xl opacity-30">🏷️</div>
          <div className="text-sm font-bold text-slate-300">لا توجد بطاقات بعد</div>
          <div className="text-xs text-slate-500 max-w-md">
            هذه الشعبة نفسها ليس فيها طلاب مسجلون بعد — اختر شعبةً أخرى من القائمة أعلى التبويب، أو سجّل أول طالب في هذه الشعبة من النموذج أعلاه، وستصدر بطاقته فوراً.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {students.map((st) => (
            <div
              key={st.id}
              className="bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 border-2 border-slate-750 hover:border-blue-500/50 rounded-2xl p-4.5 flex flex-col justify-between gap-3 shadow-xl relative overflow-hidden transition min-w-0"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 shrink">
                  <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-[10px] font-mono font-black text-white tracking-widest truncate min-w-0">
                    MINI G ACADEMY
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-bold shrink-0 whitespace-nowrap">
                  {st.stationId}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 font-mono block">JUNIOR ROBOTICS ENGINEER</span>
                <h4 className="font-black text-sm text-white mt-0.5 truncate min-w-0">{st.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate min-w-0">{st.assignedRobot}</p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2 min-w-0">
                <div className="flex flex-col min-w-0 shrink">
                  <span className="text-[9px] text-slate-500 font-bold">رمز الدخول السري:</span>
                  <div className="flex items-center gap-1.5 text-xl py-0.5 flex-wrap min-w-0">
                    {st.secretEmojis.map((em, i) => (
                      <span key={i} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                        {em}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] text-slate-500 font-mono block">LOGIN CODE</span>
                  <span className="font-mono text-xs font-bold text-amber-400" dir="ltr">{st.loginCode}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850 gap-2 min-w-0">
                <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                  <Shield className="w-3 h-3" />
                  <span>معتمد 2026</span>
                </span>
                <span className="font-mono text-slate-400 font-bold shrink-0 whitespace-nowrap">⭐ {st.stars || 0} XP</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};