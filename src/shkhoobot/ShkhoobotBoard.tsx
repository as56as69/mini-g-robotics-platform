import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Home, RefreshCw } from 'lucide-react';
import { ScribbleBlob } from '../design/primitives';
import { INK, PAPER, paperShadow } from '../design/tokens';
import { SoundFXManager } from '../ble/SoundFX';
import { TraceCanvas } from './TraceCanvas';
import {
  SCRIBBLE_CATEGORIES,
  ScribbleDrawing,
  pickRandomPaper,
  ScribbleItem,
} from './ScribbleRenderer';

/* ============================================================
 * كود ماجيك — لوحة مستر شخبوط 🌀
 * وحش خربشة (خطوط متداخلة + عينان تتبعان) له لوحته الخاصة.
 * وضعان للرسم (قرار المستخدم):
 *   - «شخبوط يرسم»: شخبوط يرسم شيئًا من الفئة بنفسه (خربشة).
 *   - «شخبط وياي»: عرض تصميمي (Mockup) — دليل منقّط بلا تفاعل،
 *     التطوير التفاعلي مؤجل.
 * تخطيط عمود flex حقيقي (شريط / محتوى مرن) — بلا absolute inset.
 * ============================================================
 */

type Mood = 'idle' | 'think' | 'draw' | 'cheer';
type DrawMode = 'watch' | 'trace';

interface Props {
  onBack: () => void;
}

/** ألوان القصاصات الاحتفالية (بلا مكتبات خارجية) */
const CONFETTI_COLORS = ['#ffd93d', '#4fc3f7', '#6bcf6b', '#ff8fb0', '#ff7f50', '#9b6bff'];

export const ShkhoobotBoard: React.FC<Props> = ({ onBack }) => {
  const [mood, setMood] = useState<Mood>('idle');
  const [drawMode, setDrawMode] = useState<DrawMode>('watch');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [drawing, setDrawing] = useState<{ item: ScribbleItem; seed: number } | null>(null);
  const [paper, setPaper] = useState(() => pickRandomPaper());
  const [drawKey, setDrawKey] = useState(0);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [celebrate, setCelebrate] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  /** ورقة جديدة لكل جلسة (عند كل فتح للوحة) */
  useEffect(() => {
    setPaper(pickRandomPaper());
    setSeed(Math.floor(Math.random() * 100000));
  }, []);

  /** اكتمال التتبع — احتفال */
  const handleTraceComplete = useCallback((_ratio: number) => {
    setMood('cheer');
    setCelebrate(true);
    SoundFXManager.playVictory();
    window.setTimeout(() => setMood('idle'), 5000);
  }, []);

  /** تحديث نسبة التتبع */
  const handleTraceProgress = useCallback((_pct: number) => {
    // يمكن إضافة صوت clicks هنا لاحقاً
  }, []);

  /** العينان تتبعان المؤشر/الإصبع — مراقب شامل مُهدّأ (كل ~80ms) */
  useEffect(() => {
    let pending = false;
    const onMove = (e: PointerEvent) => {
      if (pending) return;
      pending = true;
      window.setTimeout(() => {
        pending = false;
        const el = boardRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const dy = ((e.clientY - r.top) / r.height - 0.35) * 0.6;
        setLook({
          x: Math.max(-1, Math.min(1, dx * 2)),
          y: Math.max(-1, Math.min(1, dy * 2)),
        });
      }, 80);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  /** التفكير ثم الرسم — في وضع «شخبوط يرسم» */
  const drawItem = useCallback(
    (catId: string, itemId: string) => {
      if (drawMode === 'trace') {
        traceItem(catId, itemId);
        return;
      }
      const cat = SCRIBBLE_CATEGORIES.find((c) => c.id === catId);
      const item = cat?.items.find((i) => i.id === itemId);
      if (!item) return;
      SoundFXManager.playPaperRustle();
      setMood('think');
      window.setTimeout(() => {
        setMood('draw');
        setDrawing({ item, seed: Math.floor(Math.random() * 100000) });
        setDrawKey((k) => k + 1);
        SoundFXManager.playRobotChirp();
        window.setTimeout(() => setMood('cheer'), 2400);
        window.setTimeout(() => setMood('idle'), 6000);
      }, 900);
    },
    [drawMode]
  );

  /** اختيار في وضع «شخبط وياي» — معاينة تصميمية: يعرض الشكل فقط (تفاعل لاحقًا) */
  const traceItem = useCallback((catId: string, itemId: string) => {
    const cat = SCRIBBLE_CATEGORIES.find((c) => c.id === catId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!item) return;
    SoundFXManager.playPaperRustle();
    setMood('idle');
    setCelebrate(false);
    setDrawing({ item, seed: Math.floor(Math.random() * 100000) });
    setDrawKey((k) => k + 1);
  }, []);

  const message = (() => {
    switch (mood) {
      case 'think':
        return 'هممم… كيف أرسمها بشخبطتي؟ 🤔';
      case 'draw':
        return 'أنظر! أرسمها خطاً بخط… ✏️';
      case 'cheer':
        return 'تمّت! كل شخبطة فريدة مثلي! 🌀';
      default:
        if (drawMode === 'trace')
          return 'اتّبع الخطوط المنقطة بقلمك — سأشجعك! ✏️🤗';
        return 'هلا! أنا «مستر شخبوط» — اختر فئة وسأخربشها لك!';
    }
  })();

  /** مبدّل الوضع — اليوم دائمًا في وضع التتبع افتراضيًا للرضوضة؟ (لا، افتراضيًا 'watch') */
  const switchMode = useCallback((mode: DrawMode) => {
    setDrawMode(mode);
    setCelebrate(false);
    setMood('idle');
    setDrawing(null);
    setDrawKey((k) => k + 1);
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col min-h-0" dir="rtl">
      {/* شريط علوي */}
      <div className="flex-shrink-0 z-20 flex items-center justify-between px-3 py-2.5 bg-[#f5f0e1] border-b-2 border-[#2b2a33]/20">
        <span className="doodle-title font-bold text-[#2b2a33] text-sm sm:text-base">
          🌀 مستر شخبوط — وحش الخربشات
        </span>
        <button
          onClick={() => {
            SoundFXManager.playPaperRustle();
            onBack();
          }}
          className="doodle-title flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-[#ffecc2] border-2 border-[#2b2a33]/40 rounded-xl text-[#2b2a33] hover:bg-[#ffd93d] transition active:scale-95"
        >
          <Home className="w-4 h-4" /> رجوع
        </button>
      </div>

      {/* محتوى اللوحة — عمود flex بتمرير، ارتفاع محسوب من flex */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-8 py-4"
        style={{ background: paper.bg }}
        dir="rtl"
      >
        <div ref={boardRef} className="max-w-3xl mx-auto flex flex-col gap-3">
          {/* مبدّل الوضع: «شخبوط يرسم» ↔ «شخبط وياي» */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => switchMode('watch')}
              className={`doodle-title text-sm font-bold px-4 py-2 border-[2.5px] rounded-2xl transition active:scale-95 ${
                drawMode === 'watch' ? 'bg-[#6bcb77] text-white' : 'bg-white text-[#2b2a33]'
              }`}
              style={{ borderColor: INK, boxShadow: paperShadow() }}
            >
              🌀 شخبوط يرسم
            </button>
            <button
              onClick={() => switchMode('trace')}
              className={`doodle-title text-sm font-bold px-4 py-2 border-[2.5px] rounded-2xl transition active:scale-95 ${
                drawMode === 'trace' ? 'bg-[#ffd93d] text-[#2b2a33]' : 'bg-white text-[#2b2a33]'
              }`}
              style={{ borderColor: INK, boxShadow: paperShadow() }}
            >
              ✏️ شخبط وياي
            </button>
          </div>

          {/* مسرح شخبوط + الرسمة */}
          <div className="flex items-start justify-center gap-4 sm:gap-6 flex-wrap">
            {/* مستر شخبوط — SVG بخط width/height صريحين دائمًا */}
            <div className="relative w-40 h-52 sm:w-48 sm:h-60 flex items-center justify-center flex-shrink-0">
              <ScribbleBlob
                seed={seed}
                mood={drawMode === 'trace' ? (mood === 'cheer' ? 'cheer' : 'idle') : mood === 'think' ? 'think' : 'idle'}
                lookX={look.x}
                lookY={look.y}
                className="mc-wiggle"
                style={{ width: '100%', height: '100%' }}
              />
              <span className="character-badge absolute top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-[#2b2a33] whitespace-nowrap z-10">
                مستر شخبوط
              </span>
            </div>

            {/* الورقة البيضاء للرسمة — في وضع «شخبط وياي» تعرض الدليل المنقط كتصميم ثابت */}
            <div
              className="relative w-56 h-56 sm:w-72 sm:h-72 border-[3px] border-[#2b2a33] flex-shrink-0 overflow-hidden"
              style={{ background: PAPER.white, borderRadius: '18px 26px 16px 24px', boxShadow: paperShadow(true) }}
            >
              {drawMode === 'trace' ? (
                drawing ? (
                  <TraceCanvas
                    key={'trace-' + drawKey}
                    item={drawing.item}
                    onComplete={handleTraceComplete}
                    onProgress={handleTraceProgress}
                    className="absolute inset-0"
                  />
                ) : (
                  <p className="doodle-title absolute inset-0 flex items-center justify-center text-[#2b2a33]/35 text-sm text-center px-6">
                    اختر شيئًا لتتبع خطوطه 🖍️👇
                  </p>
                )
              ) : drawing ? (
                <ScribbleDrawing
                  key={drawKey}
                  item={drawing.item}
                  seed={drawing.seed}
                  live
                  className="w-full h-full p-2 sm:p-3"
                />
              ) : (
                <p className="doodle-title absolute inset-0 flex items-center justify-center text-[#2b2a33]/35 text-sm text-center px-6">
                  ورقة الرسم — اختر فئة وأشياءً 👇
                </p>
              )}

              {/* قصاصات الاحتفال عند اكتمال التتبع */}
              {celebrate && (
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                  {Array.from({ length: 26 }).map((_, i) => {
                    const left = (i * 37) % 100;
                    const delay = (i % 8) * 0.12;
                    const dur = 2 + (i % 5) * 0.4;
                    return (
                      <span
                        key={i}
                        className="mc-confetti"
                        style={{
                          left: `${left}%`,
                          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                          animationDelay: `${delay}s`,
                          animationDuration: `${dur}s`,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* فقاعة الحالة */}
          <div
            className="mx-auto px-4 py-2 bg-[#fff5f5] border-[2.5px] border-[#2b2a33] w-fit"
            style={{ borderRadius: '14px 20px 12px 18px', boxShadow: paperShadow() }}
          >
            <p className="doodle-title text-[#2b2a33] text-xs sm:text-sm font-bold">{message}</p>
          </div>

          {/* لوحة الفئات — مسافة أريح بين الفئات وأزرار داكنة واضحة لأصابع الأطفال */}
          <div className="flex flex-col gap-4 mt-2">
            {SCRIBBLE_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.6)', border: '2px dashed rgba(43,42,51,0.18)' }}
              >
                <span className="doodle-title text-sm font-bold text-[#2b2a33] sm:w-28 sm:pl-3 flex-shrink-0 text-center sm:text-right">
                  {cat.icon} {cat.labelAr}
                </span>
                <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                  {cat.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => drawItem(cat.id, item.id)}
                      disabled={mood === 'think' || mood === 'draw'}
                      className="doodle-title text-sm font-bold px-4 py-2.5 bg-white text-[#2b2a33] border-[2.5px] border-[#2b2a33] rounded-[12px_18px_12px_18px] transition active:scale-95 hover:bg-[#ffecc2] disabled:opacity-40"
                      style={{ boxShadow: '2px 3px 0 rgba(43,42,51,0.2)' }}
                    >
                      {item.icon} {item.labelAr}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* زر إعادة شكل شخبوط */}
          <div className="text-center mt-1 pb-2">
            <button
              onClick={() => {
                SoundFXManager.playPaperRustle();
                setSeed(Math.floor(Math.random() * 100000));
              }}
              className="doodle-title text-sm font-bold px-5 py-2.5 bg-[#6bcb77] text-white border-[3px] border-[#2b2a33] rounded-2xl transition active:scale-95"
              style={{ boxShadow: paperShadow() }}
            >
              <RefreshCw className="inline w-4 h-4 ml-1" /> شكّل شخبوط من جديد! 🌀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
