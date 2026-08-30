import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Printer, Sparkles, Loader2, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SchoolUnit } from '../types/lms';
import { generateFromUnit, type WorksheetQuestion } from '../services/worksheetGenerator';
import { schoolApi } from '../services/schoolApi';

interface Props {
  units: SchoolUnit[];
  /** Currently selected section — auto-fills the sheet header */
  sectionName?: string;
  joinCode?: string;
}

const SAMPLE_SHEETS = [
  {
    id: 'sample1',
    title: 'ورقة عمل 1: مفاهيم البرمجة والحساسات في الروبوت',
    grade: 'الصف الثاني إلى الرابع الابتدائي',
    description: 'صل كل جزء في روبوت ميني جي بوظيفته الحقيقية:',
    questions: [
      { q: '1. ما هي وظيفة حساس المسافة (Ultrasonic / ToF)؟', options: ['قياس المسافة وتفادي الحواجز', 'تشغيل الأغاني', 'تغيير لون الليد', 'تسجيل الصوت'], correctIndex: 0 },
      { q: '2. ما هو دور محرك السيرفو (Servo Motor)؟', options: ['تسجيل الصوت', 'تدوير الرأس والمفاصل بزوايا محددة', 'تغذية البطارية', 'تشغيل الأغاني'], correctIndex: 1 },
      { q: '3. أي قطعة مسؤولة عن إضاءة الروبوت بألوان متعددة؟', options: ['مكبر الصوت', 'محرك السيرفو', 'ليدات RGB', 'مستشعر اللمس'], correctIndex: 2 },
    ] as WorksheetQuestion[],
  },
  {
    id: 'sample2',
    title: 'ورقة عمل 2: خوارزمية المشاعر والألوان',
    grade: 'الصف الثالث إلى الخامس الابتدائي',
    description: 'اكتب الكود الرسومي المناسب للتعبير عن الحالات التالية:',
    questions: [
      { q: '1. عندما يشعر الروبوت بالسعادة، ما اللون الأنسب؟', options: ['الأخضر أو الأصفر', 'الأحمر', 'الأسود', 'الأزرق الداكن'], correctIndex: 0 },
      { q: '2. إذا لمس الطفل الروبوت، ما البلوك الذي يبدأ البرنامج؟', options: ['[عند لمس الروبوت]', '[كرر 5 مرات]', '[انتظر 10 ثوان]', '[عند البدء]'], correctIndex: 0 },
      { q: '3. أي تعبير عيون يدل على الفرح؟', options: ['عيون غاضبة', 'عيون حزينة', 'عيون سعيدة', 'عيون مغلقة'], correctIndex: 2 },
    ] as WorksheetQuestion[],
  },
];

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];

function buildPrintHTML(
  title: string,
  grade: string,
  description: string,
  questions: WorksheetQuestion[],
  sectionName?: string,
  joinCode?: string,
): string {
  const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const qHtml = questions
    .map(
      (q, i) => `
      <div class="q">
        <div class="q-text">${i + 1}. ${esc(q.q)}</div>
        <div class="opts">
          ${q.options.map((o, j) => `<label class="opt"><span class="box"></span><span class="ltr">${LETTERS[j]}</span> ${esc(o)}</label>`).join('')}
        </div>
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #0f172a; }
  .head { border-bottom: 0.5mm solid #0f172a; padding-bottom: 3mm; margin-bottom: 4mm; display: flex; justify-content: space-between; align-items: flex-start; }
  .head h1 { margin: 0; font-size: 13pt; }
  .head .sub { font-size: 9pt; color: #475569; margin-top: 1mm; }
  .head .meta { text-align: left; font-size: 9pt; }
  .head .meta b { color: #0d9488; }
  .desc { font-size: 10pt; font-weight: 700; color: #334155; margin-bottom: 4mm; }
  .q { margin-bottom: 4mm; }
  .q-text { font-size: 10pt; font-weight: 800; margin-bottom: 1.5mm; }
  .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm 4mm; padding-right: 5mm; }
  .opt { display: flex; align-items: center; gap: 1.5mm; font-size: 9pt; }
  .box { display: inline-block; width: 4mm; height: 4mm; border: 0.4mm solid #334155; border-radius: 1mm; flex-shrink: 0; }
  .ltr { font-weight: 700; color: #0d9488; }
  .foot { margin-top: 6mm; border-top: 0.3mm solid #94a3b8; padding-top: 2mm; display: flex; justify-content: space-between; font-size: 8pt; color: #64748b; }
  .foot b { color: #0f172a; }
</style></head>
<body>
  <div class="head">
    <div>
      <h1>${esc(title)}</h1>
      <div class="sub">${esc(grade)} • منصة ميني جي التعليمية</div>
    </div>
    <div class="meta">
      <div>اسم الطالب: _________________</div>
      <div style="margin-top:1mm">الشعبة: <b>${esc(sectionName || '_________________')}</b></div>
      ${joinCode ? `<div style="margin-top:1mm">كود الانضمام: <b dir="ltr">${esc(joinCode)}</b></div>` : ''}
      <div style="margin-top:1mm">التاريخ: <b>${esc(date)}</b></div>
    </div>
  </div>
  <div class="desc">${esc(description)}</div>
  ${qHtml}
  <div class="foot">
    <span>تقييم المدرب: [ ⭐ ⭐ ⭐ ] — ملاحظات: ____________________</span>
    <span><b>Mini G Platform</b></span>
  </div>
</body></html>`;
}

export const PrintableActivitiesModal: React.FC<Props> = ({ units, sectionName, joinCode }) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id ?? '');
  const [questionCount, setQuestionCount] = useState<3 | 5 | 7>(3);
  const [questions, setQuestions] = useState<WorksheetQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [useServer, setUseServer] = useState(true);

  const selectedUnit = useMemo(
    () => units.find(u => u.id === selectedUnitId) ?? units[0] ?? null,
    [units, selectedUnitId],
  );

  // Regenerate whenever selection or count changes (client-side first; server as enhancement)
  useEffect(() => {
    if (!selectedUnit) {
      setQuestions([]);
      return;
    }
    // Prefer server generation (also supports future AI); fall back to client template
    if (useServer) {
      setLoading(true);
      schoolApi
        .generateWorksheet(selectedUnit.id, questionCount)
        .then(({ questions: qs }) => setQuestions(qs))
        .catch(() => setQuestions(generateFromUnit(selectedUnit, questionCount)))
        .finally(() => setLoading(false));
    } else {
      setQuestions(generateFromUnit(selectedUnit, questionCount));
    }
  }, [selectedUnit, questionCount, useServer]);

  const handlePrint = () => {
    if (questions.length === 0) return;
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    const win = window.open('', '_blank');
    if (!win) {
      window.print();
      return;
    }
    const title = selectedUnit ? `ورقة عمل: ${selectedUnit.titleAr}` : 'ورقة عمل';
    const grade = selectedUnit?.difficulty ? `المستوى ${selectedUnit.difficulty}` : '';
    const desc = selectedUnit?.descriptionAr || '';
    win.document.open();
    win.document.write(buildPrintHTML(title, grade, desc, questions, sectionName, joinCode));
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 250);
  };

  const handlePrintSample = (sample: typeof SAMPLE_SHEETS[number]) => {
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    win.document.open();
    win.document.write(buildPrintHTML(sample.title, sample.grade, sample.description, sample.questions, sectionName, joinCode));
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 250);
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
            <p className="text-[11px] text-slate-400">
              تُولَّد أسئلة اختيار من متعدد من وحدات المنهاج المشترك + عينات جاهزة — ترويسة الشعبة تلقائية
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={loading || questions.length === 0}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow active:scale-95"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          <span>طباعة ورقة العمل (A4) 🖨️</span>
        </button>
      </div>

      {/* Generator Controls */}
      {units.length > 0 ? (
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <label className="font-bold text-slate-300 shrink-0">الوحدة:</label>
            <select
              value={selectedUnitId}
              onChange={e => setSelectedUnitId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 min-w-[180px]"
            >
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.titleAr.slice(0, 50)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-300 shrink-0">عدد الأسئلة:</label>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
              {([3, 5, 7] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`px-3 py-1 rounded-md font-bold transition ${questionCount === n ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={useServer}
              onChange={e => setUseServer(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>توليد من الخادم</span>
          </label>
        </div>
      ) : (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
          لا توجد وحدات في المنهاج بعد — أنشئ وحدة من تبويب «بناء وحدة جديدة» لتوليد ورقة عمل منها. العينات الجاهزة أدناه متاحة فوراً.
        </div>
      )}

      {/* Worksheet Preview (curriculum-generated) */}
      {selectedUnit && questions.length > 0 && (
        <div className="bg-white text-slate-900 p-5 md:p-6 rounded-2xl border-2 border-slate-300 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 flex-wrap gap-2">
            <div>
              <h2 className="text-sm md:text-base font-black">ورقة عمل: {selectedUnit.titleAr}</h2>
              <p className="text-[11px] text-slate-600 mt-0.5">المستوى {selectedUnit.difficulty} • منصة ميني جي للروبوتكس</p>
            </div>
            <div className="text-left text-[11px]">
              <div>اسم الطالب: _________________</div>
              <div className="mt-1">الشعبة: <b>{sectionName || '_______'}</b> {joinCode && <span dir="ltr" className="font-mono">({joinCode})</span>}</div>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-700">{selectedUnit.descriptionAr}</p>
          <div className="flex flex-col gap-3 text-xs">
            {questions.map((q, i) => (
              <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900">{i + 1}. {q.q}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 pr-2 text-slate-700">
                  {q.options.map((opt, j) => (
                    <label key={j} className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-400 rounded shrink-0" />
                      <span className="font-bold text-emerald-700">{LETTERS[j]}.</span>
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-2 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-600">
            <span>تقييم المدرب: [ ⭐ ⭐ ⭐ ]</span>
            <span className="font-bold">Mini G Platform</span>
          </div>
        </div>
      )}

      {/* Sample Worksheets */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>عينات جاهزة للطباعة الفورية:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_SHEETS.map(s => (
            <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
              <h4 className="font-bold text-xs text-slate-100">{s.title}</h4>
              <p className="text-[10px] text-slate-400">{s.grade} • {s.questions.length} أسئلة اختيار من متعدد</p>
              <button
                onClick={() => handlePrintSample(s)}
                className="mt-1 self-start flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة العينة (A4)</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
