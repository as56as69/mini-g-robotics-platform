import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { INK } from '../design/tokens';
import { ScribbleItem, samplePath } from './ScribbleRenderer';

/* ============================================================
 * كود ماجيك — «شخبط وياي» ✏️ (خاصية تتبع الخطوط المنقطة)
 * ثلاث طبقات فوق بعضها تمامًا داخل ورقة الرسم:
 *   1) SVG الدليل: الخطوط المنقطة الفاتحة (خلفية، بلا تفاعل).
 *   2) SVG «الحبر المتقدّم»: نفس الخطوط لكن بحالها الصلب بلون
 *      القلم تُحَبَّر تدريجيًا من البداية حسب نسبة التغطية
 *      (pathLength=1 + strokeDashoffset) → الطفل يرى أثر تتبعه.
 *   3) DrawingCanvas: مكوّن منفصل (React.memo) يلتقط الإصبع
 *      ويرسم فوق الجميع — لا يعيد رسمه React أثناء اللمس أبداً.
 * عند لمس دليل جديد (قرب ≤ عتبة) → onTick.
 * عند تغطية ≥ 80% من نقاط الدليل → onDone (احتفال).
 * إحداثيات: كل شيء في viewBox 0 0 200 200، والإبهام يُقيَّس
 * بمراعاة حجم العرض الفعلي (مثل لعبة ورقي).
 * ============================================================
 */

const VIEW = 200;
const GUIDE_COLOR = '#a0aec0';
const GUIDE_WIDTH = 4;
const PEN_COLOR = '#4A5568';
const PEN_WIDTH = 6;
const INK_WIDTH = 6;
/** المباعدة بين نقاط الدليل (أوسع من السابق لتجنب التداخل المفرط) */
const SAMPLING_STEP = 6;
/** نصف قطر المسح: نحو ضعف المباعدة → ~12 نقطة/لمسة بدل ~78 */
const HIT_RADIUS = 12;
/** نسبة التغطية المطلوبة لاعتبار التتبع مكتملًا */
const DONE_RATIO = 0.8;

/* ------------------------------------------------------------
 * DrawingCanvas — مكوّن منفصل مemoized لا يُعاد رسمه أثناء اللمس.
 * جميع الحالة تُدار بـ refs، والماوس/اللمس عبر معالجات DOM صريحة
 * (addEventListener) تُربط مرة واحدة عند التركيب — فلا يتأثر بسكّة
 * React أبدًا، ولا تُمسح لوحة البكسلات (backing store) مهما حدث.
 * ----------------------------------------------------------- */
const DrawingCanvas = React.memo(({
  guidePts,
  onHit,
  onDone,
  doneRef,
  className,
}: {
  guidePts: { x: number; y: number }[];
  onHit: () => void;
  onDone: () => void;
  doneRef: React.MutableRefObject<boolean>;
  className?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const ptsRef = useRef(guidePts); // نقاط الدليل المتبقية (يُحذف المُضرب منها)
  const totalRef = useRef<number>(guidePts.length); // إجمالي النقاط (ثابت)
  const hitsCountRef = useRef(0); // عدد النقاط المستهلكة

  /** أحدث المراجع للـ callbacks حتى لا تتعمق المعالجات الملحقة مرةً واحدة */
  const onHitRef = useRef(onHit);
  const onDoneRef = useRef(onDone);
  onHitRef.current = onHit;
  onDoneRef.current = onDone;

  // إعادة التوليد عند تغيير الشكل فقط (لا أثناء الرسم)
  useEffect(() => {
    ptsRef.current = guidePts;
    totalRef.current = guidePts.length;
    hitsCountRef.current = 0;
  }, [guidePts]);

  const hitTest = useCallback(
    (x: number, y: number): boolean => {
      const pts = ptsRef.current;
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - x;
        const dy = pts[i].y - y;
        if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
          pts.splice(i, 1);
          hitsCountRef.current += 1;
          return true;
        }
      }
      return false;
    },
    []
  );

  /** إعلان الاكتمال عند ≥ DONE_RATIO — يقع مرّة واحدة، ولا يجمد الرسم */
  const checkDone = useCallback(() => {
    if (doneRef.current) return;
    const ratio = hitsCountRef.current / Math.max(1, totalRef.current);
    if (ratio < DONE_RATIO) return;
    doneRef.current = true; // قفل الاحتفال مرة واحدة فقط
    onDoneRef.current();
  }, [doneRef]);

  // المعالجات الأصلية — تُربط مرة واحدة عند التركيب وتخاطب الأحداث الحقيقية
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let capturedId = -1;

    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const s = r.width / VIEW;
      return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
    };
    const ctx = () => canvas.getContext('2d');

    const onDown = (e: PointerEvent) => {
      const { x, y } = toLocal(e);
      drawing.current = true;
      const g = ctx();
      if (!g) return;
      g.beginPath();
      g.moveTo(x, y);
      try {
        canvas.setPointerCapture(e.pointerId);
        capturedId = e.pointerId;
      } catch { /* noop */ }
      if (hitTest(x, y)) {
        onHitRef.current();
        checkDone();
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      const { x, y } = toLocal(e);
      const g = ctx();
      if (!g) return;
      g.strokeStyle = PEN_COLOR;
      g.lineWidth = PEN_WIDTH;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.lineTo(x, y);
      g.stroke();
      if (hitTest(x, y)) {
        onHitRef.current();
        checkDone();
      }
    };

    const onUp = () => {
      drawing.current = false;
      if (capturedId !== -1) {
        try { canvas.releasePointerCapture(capturedId); } catch { /* noop */ }
        capturedId = -1;
      }
    };
    const onCtx = (e: Event) => e.preventDefault(); // منع قائمة الضغط الطويل (جوال)

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('contextmenu', onCtx);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('contextmenu', onCtx);
    };
  }, [hitTest, checkDone]);

  return (
    <canvas
      ref={canvasRef}
      width={VIEW}
      height={VIEW}
      className={className}
      style={{ zIndex: 3 }}
    />
  );
});
DrawingCanvas.displayName = 'DrawingCanvas';

/* ------------------------------------------------------------
 * TraceWithMe — المكوّن الرئيسي: الدليل + الحبر المتقدّم + DrawingCanvas
 * ----------------------------------------------------------- */
interface Props {
  item: ScribbleItem;
  onTick?: () => void;
  onDone?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const TraceWithMe: React.FC<Props> = ({ item, onTick, onDone, onRetry, className = '' }) => {
  const doneRef = useRef(false);
  const [hits, setHits] = useState(0);
  const [done, setDone] = useState(false);
  const stableOnDoneRef = useRef(onDone);
  stableOnDoneRef.current = onDone;

  const guidePts = useMemo(() => item.strokes.flatMap((stroke) => samplePath(stroke, SAMPLING_STEP)), [item]);
  const total = guidePts.length;
  const progress = total > 0 ? Math.min(1, hits / total) : 0;

  useEffect(() => {
    doneRef.current = false;
    setHits(0);
    setDone(false);
  }, [item]);

  const handleHit = useCallback(() => {
    setHits((h) => h + 1);
    onTick?.();
  }, [onTick]);

  const handleDone = useCallback(() => {
    setDone(true);
    stableOnDoneRef.current?.();
  }, []);

  /** كل ضربة تولّد نقطةٍ تُحَبَّر — نرسم نسخًا صلبة من كل stroke بمقدار التقدم */
  const guideInk = useMemo(
    () =>
      item.strokes.map((d, i) => {
        const key = `ink${i}`;
        const offset = 1 - progress;
        const common = {
          fill: 'none',
          stroke: PEN_COLOR,
          strokeWidth: INK_WIDTH,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          pathLength: 1,
        };
        if (d.startsWith('circle:')) {
          const segs = d.split(' ').map((seg) => {
            const [cx, cy, r] = seg.slice(7).split(',').map(Number);
            return { cx, cy, r };
          });
          if (segs.length <= 1) {
            return (
              <circle
                key={key}
                {...common}
                cx={segs[0].cx}
                cy={segs[0].cy}
                r={segs[0].r}
                strokeDasharray="1"
                strokeDashoffset={offset}
              />
            );
          }
          return (
            <g key={key}>
              {segs.map((c, j) => (
                <circle
                  key={`${key}-${j}`}
                  cx={c.cx}
                  cy={c.cy}
                  r={c.r}
                  fill="none"
                  stroke={PEN_COLOR}
                  strokeWidth={INK_WIDTH}
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset={offset}
                />
              ))}
            </g>
          );
        }
        return (
          <path key={key} d={d} {...common} strokeDasharray="1" strokeDashoffset={offset} />
        );
      }),
    [item, progress]
  );

  return (
    <div className={className} dir="ltr">
      {/* الطبقة 1: الدليل المنقط الفاتح (خلفية، بلا تفاعل) — دائم الحضور */}
      <div key="guide" className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="w-full h-full" aria-label={`دليل رسم ${item.labelAr}`}>
          <g fill="none" stroke={GUIDE_COLOR} strokeWidth={GUIDE_WIDTH} strokeDasharray="7 6" strokeLinecap="round" strokeLinejoin="round">
            {item.strokes.map((d, i) => {
              if (d.startsWith('circle:')) {
                return d.split(' ').map((seg, j) => {
                  const [cx, cy, r] = seg.slice(7).split(',').map(Number);
                  return <circle key={`g${i}-${j}`} cx={cx} cy={cy} r={r} />;
                });
              }
              return <path key={`g${i}`} d={d} />;
            })}
          </g>
        </svg>
      </div>

      {/* الطبقة 2: الحبر المتقدّم — دائم الحضور، يُظهر بعد أول ضربة فقط */}
      <div key="ink" className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ zIndex: 2, opacity: hits > 0 ? 1 : 0 }}>
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="w-full h-full" aria-hidden="true">
          {hits > 0 && guideInk}
        </svg>
      </div>

      {/* الطبقة 3: رسم الطفل — مكوّن منفصل بمعالجات أصلية، موضع بنية ثابت مضمون */}
      <DrawingCanvas
        key="canvas"
        guidePts={guidePts}
        onHit={handleHit}
        onDone={handleDone}
        doneRef={doneRef}
        className="absolute inset-0 touch-none select-none cursor-crosshair"
      />

      {/* شارة التقدم (نسبة 0..100%) — دائمة الحضور، تُخبأ عند اكتمال التغطية */}
      <div key="badge" className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none doodle-title text-xs font-bold px-2 py-0.5 bg-white border-2 transition-opacity duration-300" style={{ color: INK, borderRadius: '10px 14px 10px 14px', borderColor: INK, boxShadow: '2px 3px 0 rgba(43,42,51,0.2)', opacity: progress < 1 ? 1 : 0 }}>
        ✏️ {Math.round(progress * 100)}%
      </div>

      {/* رسائل حالة التتبع — دائمة الحضور، تخفى عند الاكتمال */}
      <div key="hint" className="absolute top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none doodle-title text-xs font-bold px-2 py-0.5 bg-[#ffecc2] border-2 transition-opacity duration-300" style={{ color: INK, borderRadius: '10px 14px 10px 14px', borderColor: INK, boxShadow: '2px 3px 0 rgba(43,42,51,0.2)', opacity: !done ? 1 : 0 }}>
        {hits > 0
          ? `أحسنت! وصل ${Math.round(progress * 100)}% — واصل! ✏️`
          : 'اتّبع الخط المنقط بقلمك 🖍️'}
      </div>

      {/* زر إعادة التتبع (يمسح الرسم ويعيد نفس الشكل) */}
      {onRetry && (
        <button
          key="retry"
          onClick={() => {
            if (!done) return;
            onRetry();
          }}
          title="أعد التتبع من جديد"
          className="absolute top-1 left-1 z-10 doodle-title text-xs font-bold px-2 py-1 bg-[#ffecc2] border-[2.5px] border-[#2b2a33] rounded-xl active:scale-90 transition"
          style={{ boxShadow: '2px 3px 0 rgba(43,42,51,0.2)' }}
        >
          <RefreshCw className="inline w-3.5 h-3.5 mr-1" /> أعِد من جديد
        </button>
      )}
    </div>
  );
};