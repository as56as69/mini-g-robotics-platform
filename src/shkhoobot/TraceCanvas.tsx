import React, { useCallback, useEffect, useRef, useState } from 'react';
import { INK } from '../design/tokens';
import { samplePath, ScribbleItem } from './ScribbleRenderer';

/* ============================================================
 * كود ماجيك — «شخبط وياي» ✏️ (Canvas + SVG مدمج)
 *
 * البنية:
 *   1) Canvas (z=5): حبر الطفل فقط — pointer events
 *   2) SVG (z=10, pointer-events:none): دليل الخطوط المنقط
 *   3) شارة نسبة (z=15): تتحدث لحظياً
 *
 * الاكتمال: نقاط الدليل تُsample، مسافة ≤ 30px من حبر الطفل = "زُرت"،
 * نسبة ≥ 80% → احتفال.
 * ============================================================
 */

const GUIDE_COLOR = '#a0aec0';
const GUIDE_WIDTH = 4;
const INK_COLOR = '#4A5568';
const INK_WIDTH = 8;
const SAMPLING_STEP = 6;
const COMPLETION_THRESHOLD = 0.8;
const HIT_RADIUS = 30;

interface Props {
  item: ScribbleItem;
  onComplete?: (ratio: number) => void;
  onProgress?: (pct: number) => void;
  className?: string;
}

function guidePoints(strokes: string[]): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (const d of strokes) {
    if (d.startsWith('circle:')) {
      const segs = d.split(' ');
      for (const seg of segs) {
        const [cx, cy, r] = seg.slice(7).split(',').map(Number);
        for (let a = 0; a < Math.PI * 2; a += 0.3) {
          points.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
      }
    } else {
      points.push(...samplePath(d, SAMPLING_STEP));
    }
  }
  return points;
}

export const TraceCanvas: React.FC<Props> = ({
  item,
  onComplete,
  onProgress,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inkPoints, setInkPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [progressPct, setProgressPct] = useState(0);
  const [completed, setCompleted] = useState(false);
  const isDrawing = useRef(false);
  const visitedRef = useRef(new Set<number>());

  const guidePts = React.useMemo(() => guidePoints(item.strokes), [item.strokes]);

  const redrawInk = useCallback((pts: Array<{ x: number; y: number }>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (pts.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = INK_WIDTH;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (completed) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      setInkPoints((prev) => {
        const next = [...prev, { x, y }];
        redrawInk(next);
        return next;
      });
    },
    [completed, redrawInk],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || completed) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      setInkPoints((prev) => {
        const next = [...prev, { x, y }];
        redrawInk(next);
        return next;
      });
    },
    [completed, redrawInk],
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      setInkPoints((pts) => {
        for (let i = 0; i < guidePts.length; i++) {
          if (visitedRef.current.has(i)) continue;
          const gp = guidePts[i];
          for (const ip of pts) {
            const dx = ip.x / scaleX - gp.x;
            const dy = ip.y / scaleY - gp.y;
            if (Math.hypot(dx, dy) <= HIT_RADIUS) {
              visitedRef.current.add(i);
              break;
            }
          }
        }
        const ratio = guidePts.length > 0 ? visitedRef.current.size / guidePts.length : 0;
        const pct = Math.min(100, Math.round(ratio * 100));
        setProgressPct(pct);
        onProgress?.(pct);

        if (ratio >= COMPLETION_THRESHOLD && !completed) {
          setCompleted(true);
          onComplete?.(ratio);
        }
        return pts;
      });
    },
    [guidePts, completed, onComplete, onProgress],
  );

  useEffect(() => {
    setInkPoints([]);
    setProgressPct(0);
    setCompleted(false);
    visitedRef.current.clear();
    redrawInk([]);
  }, [item.id, redrawInk]);

  return (
    <div className={`relative w-full h-full ${className}`} dir="ltr">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-5 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      />

      <svg
        className="absolute inset-0 w-full h-full z-10 pointer-events-none select-none"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g
          fill="none"
          stroke={GUIDE_COLOR}
          strokeWidth={GUIDE_WIDTH}
          strokeDasharray="7 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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

      {progressPct > 0 && (
        <div
          className="absolute bottom-2 right-2 z-15 doodle-title text-xs font-bold px-2 py-0.5 bg-[#ffecc2] border-2"
          style={{
            color: INK,
            borderRadius: '10px 14px 10px 14px',
            borderColor: INK,
            boxShadow: '2px 3px 0 rgba(43,42,51,0.2)',
          }}
        >
          {progressPct}% ✏️
        </div>
      )}

      {!completed && (
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none doodle-title text-xs font-bold px-2 py-0.5 bg-[#ffecc2] border-2"
          style={{
            color: INK,
            borderRadius: '10px 14px 10px 14px',
            borderColor: INK,
            boxShadow: '2px 3px 0 rgba(43,42,51,0.2)',
          }}
        >
          اتّبع الخطوط المنقطة بقلمك 🖍️
        </div>
      )}

      {completed && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className="doodle-title text-lg font-bold px-4 py-2 bg-[#6bcb77] text-white border-3 border-[#2b2a33]"
            style={{ borderRadius: '16px 24px 14px 22px', boxShadow: '3px 4px 0 rgba(43,42,51,0.2)' }}
          >
            🎉 ممتاز! أكملت التتبع! {progressPct}%
          </div>
        </div>
      )}
    </div>
  );
};
