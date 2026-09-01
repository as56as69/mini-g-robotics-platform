import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { INK } from '../design/tokens';
import { ScribbleItem, samplePath } from './ScribbleRenderer';

/* ============================================================
 * كود ماجيك — «شخبط وياي» ✏️ (خاصية تتبع الخطوط المنقطة)
 * طبقتان فوق بعضهما تمامًا:
 *   - SVG الدليل: خطوط منقطة فاتحة تعرض الشكل المختار (خلفية).
 *   - DrawingCanvas: مكوّن منفصل (React.memo) يلتقط الإصبع ويرسم
 *     فوقها (أمامية) — لا يعيد رسمه React أثناء اللمس أبداً.
 * عند ملامسة إصبع الطفل لدليل جديد (قرب ≤ عتبة) → onTick.
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
const HIT_RADIUS = 15;
const DONE_RATIO = 0.8;

/* ------------------------------------------------------------
 * DrawingCanvas — مكوّن منفصل مemoized لا يُعاد رسمه أثناء اللمس
 * جميع الحالة تُدار بـ refs (لا setState → لا re-render → لا مسح).
 * ي_cmunicate مع الأعلى عبر stable callbacks فقط.
 * ----------------------------------------------------------- */
const DrawingCanvas = React.memo(({
  item,
  guidePts,
  onHit,
  onDone,
  doneRef,
  className,
}: {
  item: ScribbleItem;
  guidePts: { x: number; y: number }[];
  onHit: () => void;
  onDone: () => void;
  doneRef: React.MutableRefObject<boolean>;
  className?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const localDone = useRef(false);
  const ptsRef = useRef(guidePts); // نقاط الدليل المتبقية (يتم حذف المُضرب منها)

  // إعادة توليد النقاط عند تغيير الشكل فقط (لا during draw)
  useEffect(() => {
    ptsRef.current = guidePts;
    localDone.current = false;
  }, [guidePts]);

  const hitTest = useCallback(
    (x: number, y: number): boolean => {
      const pts = ptsRef.current;
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - x;
        const dy = pts[i].y - y;
        if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
          pts.splice(i, 1);
          return true;
        }
      }
      return false;
    },
    []
  );

  const checkDone = useCallback(() => {
    if (localDone.current || doneRef.current) return;
    localDone.current = true;
    doneRef.current = true;
    drawing.current = false;
    onDone();
  }, [onDone, doneRef]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (localDone.current) return;
      const canvas = canvasRef.current;
      const r = canvas?.getBoundingClientRect();
      if (!r) return;
      const scale = r.width / VIEW;
      const x = (e.clientX - r.left) / scale;
      const y = (e.clientY - r.top) / scale;
      const g = canvas?.getContext('2d');
      if (!canvas || !g) return;
      drawing.current = true;
      g.beginPath();
      g.moveTo(x, y);
      try { canvas.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
      if (hitTest(x, y)) onHit();
    },
    [hitTest, onHit]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawing.current || localDone.current) return;
      const canvas = canvasRef.current;
      const r = canvas?.getBoundingClientRect();
      if (!r) return;
      const scale = r.width / VIEW;
      const x = (e.clientX - r.left) / scale;
      const y = (e.clientY - r.top) / scale;
      const g = canvas?.getContext('2d');
      if (!g) return;
      g.strokeStyle = PEN_COLOR;
      g.lineWidth = PEN_WIDTH;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.lineTo(x, y);
      g.stroke();
      if (hitTest(x, y)) {
        onHit();
        if (ptsRef.current.length === 0) checkDone();
      }
    },
    [hitTest, onHit, checkDone]
  );

  const onPointerUp = useCallback(() => { drawing.current = false; }, []);

  return (
    <canvas
      ref={canvasRef}
      width={VIEW}
      height={VIEW}
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ zIndex: 2 }}
    />
  );
});
DrawingCanvas.displayName = 'DrawingCanvas';

/* ------------------------------------------------------------
 * TraceWithMe — المكوّن الرئيسي: SVG الدليل + DrawingCanvas
 * ----------------------------------------------------------- */
interface Props {
  item: ScribbleItem;
  onTick?: () => void;
  onDone?: () => void;
  className?: string;
}

export const TraceWithMe: React.FC<Props> = ({ item, onTick, onDone, className = '' }) => {
  const doneRef = useRef(false);
  const [hits, setHits] = useState(0);
  const [done, setDone] = useState(false);
  const stableOnDoneRef = useRef(onDone);
  stableOnDoneRef.current = onDone;

  const guidePts = useMemo(() => item.strokes.flatMap((stroke) => samplePath(stroke, 3)), [item]);
  const total = guidePts.length;

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

  return (
    <div className={className} dir="ltr">
      {/* طبقة الدليل — SVG منقط فاتح (خلفية، بلا تفاعل) */}
      <div className="absolute inset-0 pointer-events-none">
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

      {/* طبقة رسم الطفل — مكوّن منفصل مemoized لا يُعاد أثناء الرسم */}
      <DrawingCanvas
        item={item}
        guidePts={guidePts}
        onHit={handleHit}
        onDone={handleDone}
        doneRef={doneRef}
        className="absolute inset-0 touch-none select-none cursor-crosshair"
      />

      {/* مؤشر التقدم (نسبة 0..100%) */}
      {!done && (
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 z-3 pointer-events-none doodle-title text-xs font-bold px-2 py-0.5 bg-white border-2"
          style={{ color: INK, borderRadius: '10px 14px 10px 14px', borderColor: INK, boxShadow: '2px 3px 0 rgba(43,42,51,0.2)' }}
        >
          ✏️ {Math.round((hits / Math.max(1, total)) * 100)}%
        </div>
      )}

      {/* رسائل حالة التتبع */}
      {!done && hits > 0 && (
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 z-3 pointer-events-none doodle-title text-xs font-bold px-2 py-0.5 bg-[#ffecc2] border-2"
          style={{ color: INK, borderRadius: '10px 14px 10px 14px', borderColor: INK, boxShadow: '2px 3px 0 rgba(43,42,51,0.2)' }}
        >
          أحسنت! وصل {Math.round((hits / Math.max(1, total)) * 100)}% — واصل! ✏️
        </div>
      )}
    </div>
  );
};
