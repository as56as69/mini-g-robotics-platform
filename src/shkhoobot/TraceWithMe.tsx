import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { INK } from '../design/tokens';
import { ScribbleItem, samplePath } from './ScribbleRenderer';

/* ============================================================
 * كود ماجيك — «خربش معي» ✏️ (خاصية تتبع الخطوط المنقطة)
 * طبقتان فوق بعضهما تمامًا:
 *   - SVG الدليل: خطوط منقطة فاتحة تعرض الشكل المختار (خلفية).
 *   - Canvas الرسم: يلتقط إصبع/قلم الطفل ويرسم فوقها (أمامية).
 * عند ملامسة إصبع الطفل لدليل جديد (قرب ≤ عتبة) → onTick.
 * عند تغطية ≥ 80% من نقاط الدليل → onDone (احتفال).
 * إحداثيات: كل شيء في viewBox 0 0 200 200، والإبهام يُقيَّس
 * بمراعاة حجم العرض الفعلي (مثل لعبة ورقي).
 * ============================================================
 */

const VIEW = 200;
const GUIDE_COLOR = '#a0aec0'; // رمادي فاتح مريح لعين الطفل
const GUIDE_WIDTH = 4;
const PEN_COLOR = '#4A5568';
const PEN_WIDTH = 6;
const HIT_RADIUS = 15;
const DONE_RATIO = 0.8;

interface Props {
  item: ScribbleItem;
  onTick?: () => void;
  onDone?: () => void;
  className?: string;
}

export const TraceWithMe: React.FC<Props> = ({ item, onTick, onDone, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guidePts = useRef<{ x: number; y: number }[]>([]);
  const drawing = useRef(false);
  const doneRef = useRef(false);
  const hitsRef = useRef(0);
  const [hitsDisplay, setHitsDisplay] = useState(0);
  const [done, setDone] = useState(false);

  const totalPts = useRef(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    guidePts.current = item.strokes.flatMap((stroke) => samplePath(stroke, 3));
    totalPts.current = guidePts.current.length;
    hitsRef.current = 0;
    doneRef.current = false;
    setHitsDisplay(0);
    setDone(false);
  }, [item]);

  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    drawing.current = false;
    setDone(true);
    onDoneRef.current?.();
  }, []);

  const toView = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const r = canvas.getBoundingClientRect();
      const scale = r.width / VIEW;
      return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale };
    },
    []
  );

  const hitTest = useCallback(
    (x: number, y: number): boolean => {
      const pts = guidePts.current;
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - x;
        const dy = pts[i].y - y;
        if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
          pts.splice(i, 1);
          hitsRef.current += 1;
          setHitsDisplay(hitsRef.current);
          if (totalPts.current > 0 && hitsRef.current / totalPts.current >= DONE_RATIO) complete();
          return true;
        }
      }
      return false;
    },
    [complete]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (doneRef.current) return;
      const p = toView(e.clientX, e.clientY);
      const canvas = canvasRef.current;
      const g = canvas?.getContext('2d');
      if (!p || !canvas || !g) return;
      drawing.current = true;
      g.beginPath();
      g.moveTo(p.x, p.y);
      try { canvas.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
      if (hitTest(p.x, p.y)) onTick?.();
    },
    [toView, onTick, hitTest]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawing.current || doneRef.current) return;
      const p = toView(e.clientX, e.clientY);
      const canvas = canvasRef.current;
      const g = canvas?.getContext('2d');
      if (!p || !canvas || !g) return;
      g.strokeStyle = PEN_COLOR;
      g.lineWidth = PEN_WIDTH;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.lineTo(p.x, p.y);
      g.stroke();
      if (hitTest(p.x, p.y)) onTick?.();
    },
    [toView, onTick, hitTest]
  );

  const onPointerUp = useCallback(() => { drawing.current = false; }, []);

  const reset = useCallback(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (canvas && g) g.clearRect(0, 0, VIEW, VIEW);
    guidePts.current = item.strokes.flatMap((stroke) => samplePath(stroke, 3));
    totalPts.current = guidePts.current.length;
    hitsRef.current = 0;
    doneRef.current = false;
    drawing.current = false;
    setHitsDisplay(0);
    setDone(false);
  }, [item]);

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

      {/* طبقة رسم الطفل — Canvas أمامي */}
      <canvas
        ref={canvasRef}
        width={VIEW}
        height={VIEW}
        className="absolute inset-0 select-none cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ zIndex: 2 }}
      />

      {/* مؤشر التقدم (نسبة 0..100%) */}
      {!done && (
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 z-3 pointer-events-none doodle-title text-xs font-bold px-2 py-0.5 bg-white border-2"
          style={{ color: INK, borderRadius: '10px 14px 10px 14px', borderColor: INK, boxShadow: '2px 3px 0 rgba(43,42,51,0.2)' }}
        >
          ✏️ {Math.round((hitsDisplay / Math.max(1, totalPts.current)) * 100)}%
        </div>
      )}

      {/* زر مسح وإعادة */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-3">
        <button
          onClick={reset}
          className="doodle-title flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-[#fff3c4] text-[#2b2a33] border-2 border-[#2b2a33] rounded-xl active:scale-95"
          style={{ boxShadow: '2px 3px 0 rgba(43,42,51,0.2)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> أمسح وأعيد
        </button>
      </div>
    </div>
  );
};