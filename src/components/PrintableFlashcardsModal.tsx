import React from 'react';
import { Layers, Printer, Cpu, Terminal, CheckSquare, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SchoolUnit } from '../types/lms';

interface Props {
  units: SchoolUnit[];
}

interface MissionCard {
  id: string;
  protocolCode: string;
  title: string;
  objective: string;
  hardwarePins: string;
  blocksHint: string[];
  difficulty: string;
  criteria: string;
  /** Source badge: "عينة جاهزة" (built-in) or "منهاجك" (shared unit) */
  source: 'sample' | 'curriculum';
  color: string;
}

const ROBOT_LABEL: Record<string, string> = {
  mini_gf: 'Mini G-F (الميدالية)',
  mini_gm: 'Mini G-M (رفيق المكتب)',
  mini_g: 'Mini G (الروبوت الكامل)',
};

const FLASHCARDS: MissionCard[] = [
  {
    id: 'f1',
    protocolCode: 'LAB-PROTOCOL-S1',
    title: 'المهمة المخبرية 1: إشارة البدء ومعايرة الهابتيك 🚦',
    objective: 'برمجة إشارة دخل اللمس لتفعيل نبضة اهتزاز متزامنة مع إضاءة ليد الـ RGB باللون الأخضر للتأكد من سلامة توصيل الـ GPIO.',
    hardwarePins: 'WS2812B Data: Pin 8 | Haptic: Pin 4 | Touch: Pin 2',
    blocksHint: ['[🎨 لوّن الروبوت بلون: أخضر]', '[📳 هزاز الروبوت: نبضة قصيرة]'],
    difficulty: 'أساسي (Beginner)',
    criteria: 'معالجة إشارة الدخل GPIO وتوليد نبضة PWM مع الهابتيك',
    source: 'sample',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'f2',
    protocolCode: 'LAB-PROTOCOL-S2',
    title: 'المهمة المخبرية 2: الحسابات الكينماتيكية لسيرفو الرأس 🤖',
    objective: 'معايرة زوايا السيرفو بزاوية 45° ومزامنة مصفوفة تعابير شاشة الـ OLED مع إصدار نغمة ترحيبية بتردد 523Hz.',
    hardwarePins: 'Servo PWM: Pin 18 | OLED SDA: 21 / SCL: 22 | Buzzer: 19',
    blocksHint: ['[👀 عيون الروبوت: سعيد]', '[🤖 حرّك الرأس: 45 يمين]', '[🎵 تشغيل نغمة: الفوز]'],
    difficulty: 'متوسط (Intermediate)',
    criteria: 'معايرة زاوية الرأس بدقة 45° ومزامنة الحالة مع المحاكي',
    source: 'sample',
    color: 'from-cyan-600 to-blue-700',
  },
  {
    id: 'f3',
    protocolCode: 'LAB-PROTOCOL-S3',
    title: 'المهمة المخبرية 3: التحكم بالملاحة والتخاطب التوليدي 🧠',
    objective: 'توجيه محركات القيادة التفاضلية للأمام، وتفعيل وضع الذكاء الاصطناعي بشخصية الخوارزمي لنطق المسألة الرياضية.',
    hardwarePins: 'Motors L/R: Pin 14/27 | Servos: 25/26 | Audio DAC: 22',
    blocksHint: ['[🚗 تحرك بالعجلات: للأمام]', '[🦾 حركة الأذرع: رفع اليدين]', '[🎭 شخصية الذكاء: الخوارزمي]'],
    difficulty: 'متقدم (Advanced Pro)',
    criteria: 'تكامل واجهات GenAI API مع تحريك المفاصل المزدوجة',
    source: 'sample',
    color: 'from-purple-600 to-indigo-800',
  },
  {
    id: 'f4',
    protocolCode: 'LAB-PROTOCOL-S4',
    title: 'المهمة المخبرية 4: نظام الإنذار واستشعار اللمس 🛡️',
    objective: 'بناء حلقة شرطية تقرأ حساسية السعة الكهروسكونية (Capacitive Touch) وتطلق وميض طوارئ فوري بالأحمر.',
    hardwarePins: 'Touch Input: GPIO 2 | RGB Status: GPIO 8',
    blocksHint: ['[👆 عند لمس رأس الروبوت]', '[🎨 لوّن الروبوت: أحمر]', '[📳 هزاز الروبوت: نبضتان]'],
    difficulty: 'أساسي (Beginner)',
    criteria: 'ربط حدث اللمس مع اللون والهزاز',
    source: 'sample',
    color: 'from-slate-700 to-slate-900',
  },
];

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Standalone HTML used inside a dedicated print window — immune to the dashboard layout/overflow. */
const buildPrintHTML = (cards: MissionCard[]): string => {
  const cardsHtml = cards
    .map(
      (c) => `
      <div class="card">
        <div class="card-top">
          <div class="brand"><span class="chip-b">MG</span> ${esc(c.protocolCode)}</div>
          <div class="diff">${esc(c.difficulty)}</div>
        </div>
        <div class="title">${esc(c.title)}</div>
        <div class="objective">
          <div class="lbl">الهدف الهندسي:</div>
          <div class="obj-text">${esc(c.objective)}</div>
        </div>
        ${c.hardwarePins ? `<div class="pins"><span class="lbl">HARDWARE PINS:</span> <span class="pin-text">${esc(c.hardwarePins)}</span></div>` : ''}
        ${c.blocksHint.length ? `<div class="blocks"><div class="lbl">الكتل البرمجية (Blockly Flow):</div>${c.blocksHint.map(h => `<div class="blk">${esc(h)}</div>`).join('')}</div>` : ''}
        <div class="criteria"><span class="lbl">معيار التحقق:</span> ${esc(c.criteria)}</div>
        <div class="foot">
          <span class="ok">اعتماد المدرب: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
          <span class="spec">MINI G STEM SPEC</span>
        </div>
      </div>`
    )
    .join('');

  const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>بطاقات المهام المخبرية — Mini G Academy</title>
<style>
  @page { size: A4 portrait; margin: 7mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #0f172a; }
  .sheet-head { margin-bottom: 5mm; border-bottom: 0.4mm solid #0d9488; padding-bottom: 2.5mm; }
  .sheet-head h1 { margin: 0; font-size: 15pt; color: #0f172a; }
  .sheet-head .sub { margin-top: 1mm; font-size: 9pt; color: #475569; }
  .sheet-head .meta { margin-top: 1mm; font-size: 9pt; color: #334155; }
  .sheet-head .meta b { color: #0d9488; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
  .card {
    break-inside: avoid; page-break-inside: avoid;
    border-radius: 4mm; padding: 4mm 4.5mm;
    background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
    border: 0.5mm solid #1e293b; color: #fff;
    display: flex; flex-direction: column; gap: 2mm;
  }
  .card-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 0.35mm solid #1e293b; padding-bottom: 1.6mm; }
  .brand { display: flex; align-items: center; gap: 1.5mm; font-weight: 900; font-size: 8pt; }
  .chip-b { background: #0d9488; color: #fff; border-radius: 1.5mm; padding: 0.6mm 1.6mm; font-size: 7pt; }
  .diff { font-size: 7.5pt; color: #fbbf24; background: rgba(251,191,36,.12); border: 0.3mm solid rgba(251,191,36,.35); border-radius: 1.5mm; padding: 0.7mm 2mm; font-weight: 700; }
  .title { font-size: 10pt; font-weight: 900; line-height: 1.3; }
  .objective { background: #020617; border: 0.35mm solid #0f172a; border-radius: 2.5mm; padding: 2mm 2.5mm; }
  .lbl { font-size: 6.5pt; color: #94a3b8; font-weight: 800; margin-bottom: 0.8mm; }
  .obj-text { font-size: 8pt; line-height: 1.45; color: #cbd5e1; }
  .pins { background: #020617; border: 0.3mm solid #0f172a; border-radius: 2mm; padding: 1.6mm 2mm; }
  .pin-text { font-family: monospace; font-size: 7.5pt; color: #34d399; font-weight: 700; }
  .blocks { background: rgba(15,23,42,.6); border: 0.3mm solid #0f172a; border-radius: 2mm; padding: 1.8mm 2mm; }
  .blk { font-family: monospace; font-size: 7.5pt; color: #67e8f9; background: #0b1120; border: 0.3mm solid #1e293b; border-radius: 1mm; padding: 0.8mm 1.6mm; margin-top: 0.8mm; }
  .criteria { font-size: 7.5pt; color: #e2e8f0; background: rgba(13,148,136,.1); border: 0.3mm solid rgba(13,148,136,.3); border-radius: 1.5mm; padding: 1.2mm 1.8mm; }
  .criteria .lbl { color: #5eead4; display: inline; }
  .foot { display: flex; justify-content: space-between; align-items: center; border-top: 0.3mm solid #0f172a; margin-top: auto; padding-top: 1.6mm; font-size: 7pt; }
  .ok { color: #34d399; font-weight: 800; }
  .spec { font-family: monospace; color: #64748b; font-weight: 700; }
</style></head>
<body>
  <div class="sheet-head">
    <h1>بطاقات المهام المخبرية — Mini G Robotics Academy</h1>
    <div class="sub">بروتوكولات تجارب معتمدة تُوضع أمام كل محطة عمل لتمكين الطلاب من تنفيذ التحدي باحترافية</div>
    <div class="meta">
      عدد البطاقات: <b>${cards.length}</b> &nbsp;|&nbsp; تاريخ الإصدار: <b>${esc(date)}</b>
    </div>
  </div>
  <div class="grid">${cardsHtml}</div>
</body></html>`;
};

export const PrintableFlashcardsModal: React.FC<Props> = ({ units }) => {
  // Map shared curriculum units → mission cards
  const unitCards: MissionCard[] = units.map(u => ({
    id: u.id,
    protocolCode: u.protocolCode || 'LAB-PROTOCOL-??',
    title: u.titleAr,
    objective: u.descriptionAr,
    hardwarePins: u.hardwarePins || '',
    blocksHint: u.blocksHint || [],
    difficulty: u.difficulty,
    criteria: u.targetCriteria?.descriptionAr || '',
    source: 'curriculum' as const,
    color: 'from-teal-600 to-cyan-700',
  }));

  const allCards = [...unitCards, ...FLASHCARDS];

  const handlePrint = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const win = window.open('', '_blank');
    if (!win) {
      window.print();
      return;
    }
    win.document.open();
    win.document.write(buildPrintHTML(allCards));
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 250);
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
            <p className="text-[11px] text-slate-400">
              {unitCards.length} من منهاجك المشترك + {FLASHCARDS.length} عينات جاهزة = {allCards.length} بطاقة قابلة للطباعة
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={allCards.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow-lg active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة بطاقات المهام (A4) 🖨️</span>
        </button>
      </div>

      {allCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <div className="text-5xl opacity-30">📋</div>
          <div className="text-sm font-bold text-slate-300">لا توجد بطاقات مهام بعد</div>
          <div className="text-xs text-slate-500 max-w-md">
            أنشئ وحدة جديدة من تبويب «بناء وحدة جديدة» وستظهر بطاقة مهمتها هنا تلقائياً. البطاقات الجاهزة أدناه ستظهر فور توفرها.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allCards.map((card) => (
            <div
              key={card.id}
              className={`bg-gradient-to-b ${card.color} border-2 border-slate-800 rounded-2xl p-4.5 flex flex-col gap-3 shadow-xl relative overflow-hidden min-w-0`}
            >
              {/* Header Protocol */}
              <div className="flex items-center justify-between border-b border-white/15 pb-2 gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Cpu className="w-4 h-4 text-white/80 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-white truncate min-w-0">{card.protocolCode}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      card.source === 'curriculum'
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                        : 'bg-slate-500/20 text-slate-200 border-slate-400/30'
                    }`}
                  >
                    {card.source === 'curriculum' ? 'منهاجك' : 'عينة'}
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                    {card.difficulty}
                  </span>
                </div>
              </div>

              {/* Title & Objective */}
              <div className="min-w-0">
                <h4 className="font-black text-sm text-white leading-snug">{card.title}</h4>
                <p className="text-xs text-slate-200/90 mt-1.5 leading-relaxed bg-black/25 p-3 rounded-xl border border-white/10">
                  <strong className="text-cyan-300 block mb-1">الهدف الهندسي:</strong>
                  {card.objective}
                </p>
              </div>

              {/* Hardware Pins Spec */}
              {card.hardwarePins && (
                <div className="bg-black/30 p-2 rounded-lg border border-white/10 font-mono text-[10px] min-w-0">
                  <span className="text-slate-400 block">HARDWARE PINS:</span>
                  <span className="text-emerald-300 font-bold break-all">{card.hardwarePins}</span>
                </div>
              )}

              {/* Block Hints */}
              {card.blocksHint.length > 0 && (
                <div className="bg-black/25 p-2.5 rounded-xl border border-white/10 flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-cyan-300" />
                    <span>الكتل البرمجية المستهدفة (Blockly Flow):</span>
                  </span>
                  <div className="flex flex-col gap-1 mt-0.5">
                    {card.blocksHint.map((hint, idx) => (
                      <code key={idx} className="text-[11px] text-cyan-200 font-mono bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        {hint}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Criteria */}
              {card.criteria && (
                <div className="text-[10px] text-slate-100 bg-emerald-500/10 border border-emerald-400/30 rounded-lg px-2.5 py-1.5 min-w-0">
                  <span className="text-emerald-300 font-bold">معيار التحقق:</span> {card.criteria}
                </div>
              )}

              {/* Footer Verification Seal */}
              <div className="flex items-center justify-between text-[10px] text-slate-200/70 pt-1.5 border-t border-white/10 gap-2 min-w-0">
                <span className="flex items-center gap-1 shrink-0">
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-300" />
                  <span>اعتماد المدرب: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
                </span>
                <span className="font-mono font-bold shrink-0 whitespace-nowrap">MINI G STEM SPEC</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
