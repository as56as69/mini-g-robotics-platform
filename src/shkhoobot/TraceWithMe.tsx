import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { INK } from '../design/tokens';
import { ScribbleItem, samplePath } from './ScribbleRenderer';

/* ============================================================
 * كود ماجيك — «شخبط وياي» ✏️ (خاصية تتبع الخطوط المنقطة)
 * ثلاث طبقات فوق بعضها تمامًا داخل ورقة الرسم:
 *   1) SVG الدليل: الخطوط المنقطة الفاتحة + نقاط الفحص المرئية
 *      (الدوائر الصغيرة = نفس الإحداثيات التي يفحصها hitTest
 *      بالضبط → ما يلمسه الطفل هو ما يُحتسب).
 *   2) SVG «الحبر المتقدّم»: نفس الخطوط بحالها الصلب بلون القلم
 *      تُحَبَّر تدريجيًا (pathLength=1 + strokeDashoffset).
 *   3) DrawingCanvas: مكوّن منفصل (React.memo) يلتقط الإصبع ويرسم.
 *
 * نظام التقدم = «Checkpoints Pipeline»:
 *   • كل شكل → نقاط فحص متقاربة ومتباعدة بانتظام (samplePath, CL=6).
 *   • أثناء السكّرة يفحص hitTest مسافة كل نقطة غير مزارة إلى المقطع
 *     الممسوح (من موضع الإصبع السابق إلى الحالي) ≤ TOLERANCE
 *     → لا تُفوَّت نقاط بسبب سرعة اليد أو قلة أحداث المؤشر.
 *   • المجموعة visitedIndices (Set) تسجّل كل نقطة مرة واحدة فقط،
 *     والنسبة = عددها/الإجمالي → تتحرك 0→100 بسلاسة.
 *   • عند التغطية ≥ 80% → onDone (احتفال، مرة واحدة).
 *
 * إحداثيات: كل شيء في viewBox 0 0 200 200، والإصبع يُقيَّس
 * بالمقياس الصريح canvas.width/rect.width (صيغة مضمونة للشاشات،
 * حتى لو تمدّد الـ canvas بأي مقاس غير مربّع).
 * ============================================================
 */

const VIEW = 200;
const GUIDE_COLOR = '#a0aec0';
const GUIDE_WIDTH = 4;
const PEN_COLOR = '#4A5568';
const PEN_WIDTH = 8;
const INK_WIDTH = 8;
/** المباعدة بين نقاط الفحص (مائدة منتظمة ~6 وحدات viewBox) */
const SAMPLING_STEP = 6;
/** هامش الخطأ المسموح — مسامح سخي (≈25 وحدة): لا تتقدم النسبة إلا بالأقرب */
const TOLERANCE = 25;
/** نسبة التغطية المطلوبة لاعتبار التتبع مكتملًا */
const DONE_RATIO = 0.8;

/* ------------------------------------------------------------
 * DrawingCanvas — مكوّن منفصل memoized لا يُعاد رسمه أثناء اللمس.
 * جميع الحالة تُدار بـ refs، والمعالجات DOM صريحة (addEventListener)
 * تُربط مرة واحدة عند التركيب — فلا يتأثر بمُمرّات React، ولا تُمسح
 * لوحة البكسلات (backing store) مهما حدث.
 * ----------------------------------------------------------- */
const DrawingCanvas = React.memo(({
  guidePts,
  onHit,
  onDone,
  doneRef,
  className,
}: {
  guidePts: { x: number; y: number }[];
  onHit: (pt: { x: number; y: number }) => void;
  onDone: () => void;
  doneRef: React.MutableRefObject<boolean>;
  className?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  /** النقاط التي مرّ عليها الطفل بالفعل — كل نقطة تُحتسب مرة واحدة فقط */
  const visitedRef = useRef<Set<number>>(new Set());
  const totalRef = useRef<number>(guidePts.length);
  /** آخر موضع للإصبع ضمن السكّرة الحالية (لرصد المقطع الممسوح) */
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const onHitRef = useRef(onHit);
  const onDoneRef = useRef(onDone);
  onHitRef.current = onHit;
  onDoneRef.current = onDone;

  // إعادة التوليد عند تغيير الشكل فقط (لا أثناء الرسم) — إفراغ دفاعي إضافي
  useEffect(() => {
    visitedRef.current = new Set();
    totalRef.current = guidePts.length;
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, VIEW, VIEW);
  }, [guidePts]);

  /** فحص المقطع (أ)…(ب): كل نقطة فحص غير مزارة تبعد ≤ TOLERANCE عن المقطع تُحتسب.
   *  معالجة المقطع بدل نقطة-نقطة = مسح كامل حتى في الحركات السريعة. */
  const hitCheck = useCallback(
    (ax: number, ay: number, bx: number, by: number): boolean => {
      const pts = guidePts;
      if (pts.length === 0) return false;
      const abx = bx - ax;
      const aby = by - ay;
      const ab2 = abx * abx + aby * aby;
      let hitAny = false;
      for (let i = 0; i < pts.length; i++) {
        if (visitedRef.current.has(i)) continue;
        const px = pts[i].x;
        const py = pts[i].y;
        let t = 0;
        if (ab2 > 0) {
          t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / ab2));
        }
        const dx = ax + abx * t - px;
        const dy = ay + aby * t - py;
        if (dx * dx + dy * dy <= TOLERANCE * TOLERANCE) {
          visitedRef.current.add(i);
          onHitRef.current({ x: px, y: py });
          hitAny = true;
        }
      }
      return hitAny;
    },
    [guidePts]
  );

  /** إعلان الاكتمال عند ≥ DONE_RATIO — يقع مرّة واحدة، ولا يجمد الرسم */
  const checkDone = useCallback(() => {
    if (doneRef.current) return;
    const ratio = visitedRef.current.size / Math.max(1, totalRef.current);
    if (ratio < DONE_RATIO) return;
    doneRef.current = true; // قفل الاحتفال مرة واحدة فقط
    onDoneRef.current();
  }, [doneRef]);

  // المعالجات الأصلية — تُربط مرة واحدة عند التركيب وتخاطب الأحداث الحقيقية
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let capturedId = -1;

    /** إحداثيات الإصبع بمقياس viewBox صريح + تثبيت داخل الورقة */
    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const sx = r.width > 0 ? canvas.width / r.width : 1;
      const sy = r.height > 0 ? canvas.height / r.height : 1;
      const x = Math.min(VIEW, Math.max(0, (e.clientX - r.left) * sx));
      const y = Math.min(VIEW, Math.max(0, (e.clientY - r.top) * sy));
      return { x, y };
    };
    const ctx = () => canvas.getContext('2d');

    const strokeTo = (g: CanvasRenderingContext2D, x: number, y: number) => {
      g.strokeStyle = PEN_COLOR;
      g.lineWidth = PEN_WIDTH;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.lineTo(x, y);
      g.stroke();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return; // اليسار فقط
      const { x, y } = toLocal(e);
      drawing.current = true;
      lastPos.current = { x, y };
      const g = ctx();
      if (g) {
        g.beginPath();
        g.moveTo(x, y);
      }
      try {
        canvas.setPointerCapture(e.pointerId);
        capturedId = e.pointerId;
      } catch { /* noop */ }
      if (hitCheck(x, y, x, y)) checkDone();
    };

    const onMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      const { x, y } = toLocal(e);
      const g = ctx();
      if (g) strokeTo(g, x, y);
      const from = lastPos.current ?? { x, y };
      if (hitCheck(from.x, from.y, x, y)) checkDone();
      lastPos.current = { x, y };
    };

    const onUp = () => {
      drawing.current = false;
      lastPos.current = null;
      if (capturedId !== -1) {
        try { canvas.releasePointerCapture(capturedId); } catch { /* noop */ }
        capturedId = -1;
      }
    };
    // إن فقد التقاط الإصبع أو غادر المؤشر أثناء السكّرة → إنهاؤها لئلا يرسم خطوط قفز
    const onStopStroke = () => {
      drawing.current = false;
      lastPos.current = null;
    };
    const onCtx = (e: Event) => e.preventDefault(); // منع قائمة الضغط الطويل (جوال)

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('lostpointercapture', onStopStroke);
    canvas.addEventListener('pointerleave', onStopStroke);
    canvas.addEventListener('contextmenu', onCtx);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('lostpointercapture', onStopStroke);
      canvas.removeEventListener('pointerleave', onStopStroke);
      canvas.removeEventListener('contextmenu', onCtx);
    };
  }, [hitCheck, checkDone]);

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
 * TraceWithMe — المكوّن الرئيسي: الدليل + نقاط الفحص + الحبر + DrawingCanvas
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
  const [flash, setFlash] = useState<{ x: number; y: number; key: number }[]>([]);
  const flashKeyRef = useRef(0);
  const stableOnDoneRef = useRef(onDone);
  stableOnDoneRef.current = onDone;

  /** نقاط الفحص: مولّدة من نفس بيانات strokes، تُصفّى خارج الورقة دفاعًا */
  const guidePts = useMemo(() => {
    const all = item.strokes.flatMap((stroke) => samplePath(stroke, SAMPLING_STEP));
    return all.filter((p) => p.x >= 0 && p.x <= VIEW && p.y >= 0 && p.y <= VIEW);
  }, [item]);
  const total = guidePts.length;
  const progress = total > 0 ? Math.min(1, hits / total) : 0;

  // تشخيص عند التركيب: إحصاء النقاط لكل شكل (يساعد على تعقّب أي انحراف)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[شخبط وياي] «${item.labelAr}» → نقاط فحص: ${total}`);
    }
  }, [item, total]);

  useEffect(() => {
    doneRef.current = false;
    setHits(0);
    setDone(false);
    setFlash([]);
  }, [item]);

  // إخفاء وميض "النقطة المُصابة" بعد ثوانٍ — مع بقاء الإشارات للنقاط الأخيرة
  useEffect(() => {
    if (flash.length === 0) return;
    const t = window.setTimeout(() => setFlash([]), 700);
    return () => window.clearTimeout(t);
  }, [flash]);

  const handleHit = useCallback(
    (pt: { x: number; y: number }) => {
      setHits((h) => h + 1);
      const key = ++flashKeyRef.current;
      setFlash((f) => [...f.slice(-9), { x: pt.x, y: pt.y, key }]);
      onTick?.();
    },
    [onTick]
  );

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
      {/* الطبقة 1: الدليل المنقط الفاتح + نقاط الفحص (خلفية، بلا تفاعل) */}
      <div key="guide" className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} preserveAspectRatio="none" className="w-full h-full" aria-label={`دليل رسم ${item.labelAr}`}>
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
          {/* نقاط الفحص المرئية — نفس إحداثيات hitTest بالضبط */}
          <g fill={GUIDE_COLOR} opacity={0.75}>
            {guidePts.map((p, i) => (
              <circle key={`cp${i}`} cx={p.x} cy={p.y} r={1.8} />
            ))}
          </g>
          {/* وميض النقط المُصابة — نبضة خضراء تتوسع وتتلاشى */}
          {flash.map((f) => (
            <circle key={f.key} className="mc-trace-flash" cx={f.x} cy={f.y} r={6} fill="#59ba6b" />
          ))}
        </svg>
      </div>

      {/* الطبقة 2: الحبر المتقدّم — دائم الحضور، يُظهر بعد أول ضربة فقط */}
      <div key="ink" className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ zIndex: 2, opacity: hits > 0 ? 1 : 0 }}>
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} preserveAspectRatio="none" className="w-full h-full" aria-hidden="true">
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