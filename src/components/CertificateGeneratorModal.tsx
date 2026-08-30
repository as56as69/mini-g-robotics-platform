import React, { useState, useMemo } from 'react';
import { Award, Printer, Sparkles, UserCheck, Star, ShieldCheck, CheckCircle2, Loader2, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { StudentProfile, SchoolUnit } from '../types/lms';
import { schoolApi } from '../services/schoolApi';

interface Props {
  students: StudentProfile[];
  units: SchoolUnit[];
  sectionName?: string;
  joinCode?: string;
  coachName?: string;
}

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

/** Standalone A4 landscape HTML for the certificate — immune to dashboard overflow. */
function buildCertHTML(opts: {
  studentName: string;
  courseName: string;
  coachName: string;
  dateStr: string;
  certNumber: string;
}): string {
  const { studentName, courseName, coachName, dateStr, certNumber } = opts;
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>شهادة تفوق — ${esc(studentName)}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
  .cert {
    width: 100%; min-height: 190mm;
    background: linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%);
    border: 1.2mm double #f59e0b; border-radius: 6mm;
    padding: 10mm 14mm; color: #f8fafc;
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5mm;
    position: relative; overflow: hidden;
  }
  .corner { position: absolute; font-size: 18pt; color: rgba(245,158,11,.35); }
  .c1 { top: 4mm; right: 6mm; } .c2 { top: 4mm; left: 6mm; }
  .c3 { bottom: 4mm; right: 6mm; } .c4 { bottom: 4mm; left: 6mm; }
  .brand { display: flex; align-items: center; gap: 3mm; color: #fbbf24; font-size: 9pt; font-weight: 800; letter-spacing: 2px; }
  .title { font-size: 26pt; font-weight: 900; color: #ffffff; margin-top: 2mm; }
  .ribbon { width: 60mm; height: 1.2mm; background: linear-gradient(90deg,#fbbf24,#f97316,#fbbf24); border-radius: 2mm; margin-top: 1mm; }
  .lead { font-size: 10pt; color: #94a3b8; max-width: 140mm; margin-top: 2mm; }
  .name { font-size: 24pt; font-weight: 900; color: #fde68a; border-bottom: 0.6mm solid rgba(245,158,11,.45); padding-bottom: 2mm; padding-inline: 16mm; font-family: 'Times New Roman', serif; }
  .body { font-size: 10pt; color: #cbd5e1; max-width: 150mm; line-height: 1.6; }
  .course { font-size: 11pt; font-weight: 800; color: #93c5fd; background: rgba(30,58,138,.5); border: 0.4mm solid rgba(59,130,246,.5); border-radius: 3mm; padding: 2.5mm 6mm; }
  .signrow { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; width: 100%; margin-top: auto; padding-top: 6mm; border-top: 0.3mm solid #1e293b; }
  .sig { display: flex; flex-direction: column; align-items: center; font-size: 9pt; }
  .sig .lbl { color: #64748b; font-size: 8pt; }
  .sig .val { color: #ffffff; font-weight: 800; margin-top: 0.8mm; }
  .seal { display: flex; flex-direction: column; align-items: center; }
  .seal .star { width: 16mm; height: 16mm; border-radius: 50%; border: 0.6mm solid #fbbf24; background: rgba(245,158,11,.18); display: flex; align-items: center; justify-content: center; font-size: 22pt; color: #fbbf24; font-weight: 900; }
  .seal .tag { font-size: 7pt; color: #fbbf24; letter-spacing: 1px; margin-top: 1mm; }
  .certno { position: absolute; bottom: 3mm; left: 50%; transform: translateX(-50%); font-size: 7pt; color: #475569; font-family: monospace; letter-spacing: 1px; }
</style></head>
<body>
  <div class="cert">
    <span class="corner c1">❖</span><span class="corner c2">❖</span>
    <span class="corner c3">❖</span><span class="corner c4">❖</span>
    <div class="brand"><span>✦</span> MINI G ROBOTICS & STEM ACADEMY <span>✦</span></div>
    <div class="title">شهادة تفوق واعتماد هندسي 🎓</div>
    <div class="ribbon"></div>
    <div class="lead">تشهد إدارة المنصة ومختبرات الروبوتكس المعتمدة بأن المهندس / المهندسة الصغيرة:</div>
    <div class="name">${esc(studentName || 'اسم الطالب')}</div>
    <div class="body">قد أتم بنجاح واقتدار كافة متطلبات المشاريع التطبيقية والبرمجة الخوارزمية وبناء التوأم الرقمي والتحكم بأنظمة الـ <strong style="color:#fff">ESP32</strong> ضمن المسار التخصصي:</div>
    <div class="course">${esc(courseName)}</div>
    <div class="signrow">
      <div class="sig"><span class="lbl">المدرب المشرف:</span><span class="val">${esc(coachName)}</span></div>
      <div class="seal"><div class="star">★</div><div class="tag">OFFICIAL SEAL</div></div>
      <div class="sig"><span class="lbl">تاريخ الاعتماد:</span><span class="val">${esc(dateStr)}</span></div>
    </div>
    <div class="certno">${esc(certNumber)}</div>
  </div>
</body></html>`;
}

export const CertificateGeneratorModal: React.FC<Props> = ({ students, units, sectionName, joinCode, coachName }) => {
  const [selectedId, setSelectedId] = useState<string>(students[0]?.id ?? '');
  const [courseName, setCourseName] = useState('');
  const [coach, setCoach] = useState(coachName || '');
  const [issuing, setIssuing] = useState(false);
  const [lastCert, setLastCert] = useState<{ certNumber: string; studentName: string } | null>(null);

  const selected = useMemo(
    () => students.find(s => s.id === selectedId) ?? students[0] ?? null,
    [students, selectedId],
  );

  // Auto-fill course name from the active unit of the section (or last completed quest)
  const autoCourse = useMemo(() => {
    if (!selected) return '';
    const completed = selected.completedQuests || [];
    if (completed.length) {
      const lastId = completed[completed.length - 1];
      const u = units.find(x => x.id === lastId);
      if (u) return u.titleAr;
    }
    // fallback: any unit
    if (units[0]) return units[0].titleAr;
    return 'مسار هندسة الروبوتات والبرمجة الخوارزمية (منظومة Mini G)';
  }, [selected, units]);

  const effectiveCourse = courseName || autoCourse;
  const todayStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleIssueAndPrint = async () => {
    if (!selected) return;
    setIssuing(true);
    let certNumber = `CERT-${String(Math.floor(1000 + Math.random() * 9000))}`;
    let updatedStudent: StudentProfile | null = null;
    try {
      updatedStudent = await schoolApi.issueCertificate(selected.id, {
        courseName: effectiveCourse,
        coachName: coach || undefined,
        level: 'تفوق',
      });
      const certs = updatedStudent.certificates || [];
      const last = certs[certs.length - 1];
      if (last) certNumber = last.certNumber;
    } catch {
      // offline — still print with a local cert number
    }
    setLastCert({ certNumber, studentName: selected.name });
    setIssuing(false);

    confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    win.document.open();
    win.document.write(buildCertHTML({
      studentName: selected.name,
      courseName: effectiveCourse,
      coachName: coach || 'المهندس المشرف',
      dateStr: todayStr,
      certNumber,
    }));
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 300);
  };

  const handleReprint = () => {
    if (!lastCert) return;
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    win.document.open();
    win.document.write(buildCertHTML({
      studentName: lastCert.studentName,
      courseName: effectiveCourse,
      coachName: coach || 'المهندس المشرف',
      dateStr: todayStr,
      certNumber: lastCert.certNumber,
    }));
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 300);
  };

  if (students.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3 text-center max-w-3xl mx-auto w-full">
        <GraduationCap className="w-10 h-10 text-amber-400/50" />
        <div className="text-sm font-bold text-slate-300">لا يوجد طلاب في هذه الشعبة بعد</div>
        <div className="text-xs text-slate-500 max-w-md">سجّل طلاباً من تبويب «الفصول والشعب» ثم ارجع هنا لمنح الشهادات. اختر شعبة أخرى من القائمة إن كانت هذه الشعبة فارغة.</div>
      </div>
    );
  }

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
            <p className="text-[11px] text-slate-400">
              شهادات تفوق رسمية تُمنح لطلاب الشعبة {sectionName ? `«${sectionName}»` : ''} — تُسجَّل في ملف الطالب المشترك
            </p>
          </div>
        </div>

        <button
          onClick={handleIssueAndPrint}
          disabled={issuing || !selected}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition shadow-lg active:scale-95"
        >
          {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          <span>منح وطباعة الشهادة 🎓</span>
        </button>
      </div>

      {/* Student picker + auto-fill */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-bold">اختر الطالب:</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {students.map(st => (
              <option key={st.id} value={st.id}>
                {st.name} — ⭐{st.stars} · {st.xp}XP · {(st.completedQuests || []).length} وحدة
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-bold">عنوان المسار (تلقائي من الوحدة):</label>
          <input
            type="text"
            value={effectiveCourse}
            onChange={e => setCourseName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-bold">المدرب / المشرف الأكاديمي:</label>
          <input
            type="text"
            value={coach}
            onChange={e => setCoach(e.target.value)}
            placeholder="المهندس علي أحمد التميمي"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {selected && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> {selected.stars} نجمة</span>
          <span className="text-slate-600">•</span>
          <span>{selected.xp} XP</span>
          <span className="text-slate-600">•</span>
          <span>{(selected.completedQuests || []).length} وحدة مكتملة</span>
          {joinCode && (<><span className="text-slate-600">•</span><span>الشعبة: <b className="text-slate-300">{sectionName}</b> <span dir="ltr" className="font-mono text-amber-300">({joinCode})</span></span></>)}
          {(selected.certificates || []).length > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {(selected.certificates || []).length} شهادة سابقة
              </span>
            </>
          )}
        </div>
      )}

      {/* Certificate preview */}
      <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6 md:p-10 rounded-2xl border-4 border-double border-amber-500/80 shadow-2xl flex flex-col items-center text-center gap-4 select-none overflow-hidden min-h-[400px]">
        <div className="absolute top-3 right-3 text-amber-500/30 text-3xl">❖</div>
        <div className="absolute top-3 left-3 text-amber-500/30 text-3xl">❖</div>
        <div className="absolute bottom-3 right-3 text-amber-500/30 text-3xl">❖</div>
        <div className="absolute bottom-3 left-3 text-amber-500/30 text-3xl">❖</div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px] font-bold tracking-widest uppercase">
            <Sparkles className="w-4 h-4" />
            <span>MINI G ROBOTICS & STEM ACADEMY</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight">شهادة تفوق واعتماد هندسي 🎓</h2>
          <div className="w-36 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-full mt-1" />
        </div>

        <p className="text-xs md:text-sm text-slate-400 max-w-lg mt-2">
          تشهد إدارة المنصة ومختبرات الروبوتكس المعتمدة بأن المهندس / المهندسة الصغيرة:
        </p>

        <div className="text-2xl md:text-3xl font-black text-amber-300 border-b-2 border-amber-500/40 pb-2 px-10 tracking-wide font-serif">
          {selected?.name || 'اسم الطالب الثلاثي'}
        </div>

        <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
          قد أتم بنجاح واقتدار كافة متطلبات المشاريع التطبيقية والبرمجة الخوارزمية وبناء التوأم الرقمي والتحكم بأنظمة الـ <strong className="text-white">ESP32</strong> ضمن المسار التخصصي:
        </p>

        <div className="text-xs sm:text-sm font-bold text-blue-300 bg-blue-950/60 px-5 py-2 rounded-xl border border-blue-500/40 shadow-inner">
          {effectiveCourse}
        </div>

        <div className="w-full grid grid-cols-3 items-center pt-6 mt-auto border-t border-slate-800 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-slate-500 text-[10px]">المدرب المشرف:</span>
            <span className="font-bold text-white mt-0.5">{coach || 'المهندس المشرف'}</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center text-amber-300 text-xl font-bold shadow-lg shadow-amber-500/20">★</div>
            <span className="text-[9px] text-amber-400 font-mono mt-1">OFFICIAL SEAL</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-slate-500 text-[10px]">تاريخ الاعتماد:</span>
            <span className="font-bold text-white mt-0.5 font-mono">{todayStr}</span>
          </div>
        </div>

        {lastCert && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 font-mono tracking-wider">
            {lastCert.certNumber}
          </div>
        )}
      </div>

      {/* Previously issued certificates for this student */}
      {selected && (selected.certificates || []).length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>الشهادات السابقة لهذا الطالب ({(selected.certificates || []).length}):</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {(selected.certificates || []).map(c => (
              <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-amber-300 font-bold">{c.certNumber}</span>
                  <span className="text-slate-400">— {c.courseName.slice(0, 40)}</span>
                </div>
                <span className="text-slate-500 font-mono">{fmtDate(c.issuedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastCert && (
        <button
          onClick={handleReprint}
          className="self-center flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[11px] transition active:scale-95"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>إعادة طباعة الشهادة {lastCert.certNumber}</span>
        </button>
      )}
    </div>
  );
};
