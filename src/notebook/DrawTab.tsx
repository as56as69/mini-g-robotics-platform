import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LETTER_PATHS, LETTERS_ARABIC, LETTERS_ENGLISH, NUMBERS_ARABIC, NUMBERS_ENGLISH, LETTERS_PER_SESSION, CELEBRATION_MESSAGES, BAGHDADI_WORDS, LangMode, CharMode } from './data';
import { useNotebook } from './notebookContext';
import { letterKey } from './utils';

/* كود ماجيك بالتفت — تبويب الرسم (تتبع الحروف)
 * ============================================================
 * الدفتر: ورقة بيضاء نظيفة بظل خفيف + خلفية بيج + خطوط مسطرة مدرسية.
 * الكانفس بمقياس devicePixelRatio لضمان حبر حاد طوال الوقت.
 * الحرف والدليل المنقط يتركزان على سطر الكتابة الأوسط.
 */

interface Props {
  lang: LangMode;
  mode: CharMode;
  setLang: (l: LangMode) => void;
  setMode: (m: CharMode) => void;
}

const INK = '#2d3436';
const PRIMARY = '#6c5ce7';
const ROW_H = 34;            // ارتفاع سطر المسطرة بالنقاط
const RESIZE_DEBOUNCE = 120;

export const DrawTab: React.FC<Props> = ({ lang, mode, setLang, setMode }) => {
  const { completed, addCompleted, addStars } = useNotebook();

  const list = mode === 'numbers'
    ? (lang === 'arabic' ? NUMBERS_ARABIC : NUMBERS_ENGLISH)
    : (lang === 'arabic' ? LETTERS_ARABIC : LETTERS_ENGLISH);
  const session = list.slice(0, LETTERS_PER_SESSION);

  const [index, setIndex] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const hasDrawnRef = useRef(false);
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);

  const char = session[index] ?? session[0];
  const key = letterKey(lang, mode, char);
  const isDone = completed.has(key);
  const path = LETTER_PATHS[char];

  /* --- آلة رسم الكانفس (نمط دقيق من «دفتر ماجيك كود.html» المُثبت) ---
   * - الكانفس بمقياس CSS 1:1 (بلا devicePixelRatio/تطبيع) حتى تطابق
   *   إحداثيات المؤشر (clientX - rect.left) أبعاد البيتامب تلقائياً.
   * - الحبر يُرسم فوراً من آخر نقطة (لا تجميع/إعادة رسم كامل).
   * ================================================================ */

  // رسم الدليل: حرف باهت + خط منقط + نقطة البداية في منتصف اللوحة.
  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    if (w <= 0 || h <= 0) return;
    const cx = w / 2, cy = h / 2;
    const size = Math.min(w, h) * 0.28;

    // حرف باهت خلفيًا
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.font = `${size * 1.8}px 'Comic Neue', 'Comic Sans MS', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PRIMARY;
    ctx.fillText(char, cx, cy);
    ctx.restore();

    if (path) {
      ctx.save();
      ctx.setLineDash([6, 8]);
      ctx.strokeStyle = PRIMARY;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      path.forEach((p, i) => {
        const px = (p.x / 100) * w, py = (p.y / 100) * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();

      const start = path[0];
      const sx = (start.x / 100) * w, sy = (start.y / 100) * h;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      ctx.fillStyle = PRIMARY;
      ctx.shadowBlur = 15;
      ctx.shadowColor = PRIMARY;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [char, path]);

  // يضبط حجم الكانفس ليطابق حاوية الدفتر (CSS 1:1، بلا dpr)
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(20, Math.round(rect.width));
    const h = Math.max(20, Math.round(rect.height));
    canvas.width = w;
    canvas.height = h;
    drawGuide();
  }, [drawGuide]);

  // مسح الكانفس وإعادة رسم الدليل فقط
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGuide();
  }, [drawGuide]);

  // رسم نقطة حبر فورية (كما في المرجع): خط من آخر نقطة، أو نقطة أولى
  const drawPoint = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    const pts = pointsRef.current;
    if (pts.length > 0) {
      const last = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    pts.push({ x, y });
  }, []);

  // إعادة ضبط عند تغيير الحرف/اللغة/الوضع
  useEffect(() => {
    setHasDrawn(false);
    hasDrawnRef.current = false;
    pointsRef.current = [];
    clearCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, lang, mode]);

  // مراقبة تغيّر حجم الحاوية مع debounce
  useEffect(() => {
    const apply = () => resizeCanvas();
    let t: number;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(apply, RESIZE_DEBOUNCE);
    };
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    apply();
    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeCanvas]);

  // أحداث الرسم (إحداثيات CSS مباشرة عبر getBoundingClientRect)
  const getPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: clientX, y: clientY };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const finish = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (hasDrawnRef.current && pointsRef.current.length >= 5 && !completed.has(key)) {
      addCompleted(key);
      addStars(1);
      const msg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebration(msg);
      setTimeout(() => {
        setCelebration(null);
        setHasDrawn(false);
        hasDrawnRef.current = false;
        pointsRef.current = [];
        clearCanvas();
        if (index < session.length - 1) { setIndex(index + 1); }
      }, 1500);
    }
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e.clientX, e.clientY);
    isDrawing.current = true;
    hasDrawnRef.current = true;
    setHasDrawn(true);
    pointsRef.current = [];
    drawPoint(x, y);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const { x, y } = getPos(e.clientX, e.clientY);
    drawPoint(x, y);
  };

  const onUp = () => finish();

  // اللمس: يستخدم حوادث لمس أصلية مع preventDefault (كما في المرجع)
  const onTouchDown = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const t = e.touches[0];
    const { x, y } = getPos(t.clientX, t.clientY);
    isDrawing.current = true;
    hasDrawnRef.current = true;
    setHasDrawn(true);
    pointsRef.current = [];
    drawPoint(x, y);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const { x, y } = getPos(t.clientX, t.clientY);
    drawPoint(x, y);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    finish();
  };

  const word = BAGHDADI_WORDS[char];
  const total = session.length;

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* التحكم باللغة والوضع */}
      <div className="flex-shrink-0 flex gap-2 flex-wrap justify-center px-4 pt-3 pb-2">
        <button onClick={() => setLang('arabic')} className={`font-bold px-3 py-1.5 rounded-[20px_6px_20px_6px] border-[3px] text-xs ${lang === 'arabic' ? 'bg-[#6c5ce7] text-white border-[#4a3f8a]' : 'bg-white text-[#2d3436] border-[#d4b8a0]'}`}>🇮🇶 عربي</button>
        <button onClick={() => setLang('english')} className={`font-bold px-3 py-1.5 rounded-[20px_6px_20px_6px] border-[3px] text-xs ${lang === 'english' ? 'bg-[#6c5ce7] text-white border-[#4a3f8a]' : 'bg-white text-[#2d3436] border-[#d4b8a0]'}`}>🇬🇧 English</button>
        <span className="mx-1 text-[#d4b8a0]">|</span>
        <button onClick={() => setMode('letters')} className={`font-bold px-3 py-1.5 rounded-[20px_6px_20px_6px] border-[3px] text-xs ${mode === 'letters' ? 'bg-[#00b894] text-white border-[#00917b]' : 'bg-white text-[#2d3436] border-[#d4b8a0]'}`}>🔤 حروف</button>
        <button onClick={() => setMode('numbers')} className={`font-bold px-3 py-1.5 rounded-[20px_6px_20px_6px] border-[3px] text-xs ${mode === 'numbers' ? 'bg-[#00b894] text-white border-[#00917b]' : 'bg-white text-[#2d3436] border-[#d4b8a0]'}`}>🔢 أرقام</button>
      </div>

      {/* منطقة الرسم: دفتر بارتفاع ثابت مضمون + شريط جانبي */}
      <div className="flex-1 min-h-0 px-3 sm:px-6 pb-3 flex gap-4 items-start overflow-y-auto">
        {/* خلفية ورقة بيج حول الدفتر */}
        <div className="flex-1 min-w-0 rounded-[14px_28px_14px_28px] bg-[#f6ead9] p-3 sm:p-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)]">
          {/* الدفتر الأبيض — ارتفاع ثابت مضمون (حسب نمط TraceCanvas المثبت) */}
          <div className="relative w-full h-[460px] border-[3px] border-[#efe3d2] rounded-[8px_18px_8px_18px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_0_#e6d6c2] overflow-hidden">
            {/* خطوط المسطرة المدرسية: كل سطر ثالث أغمق (خط الأساس) */}
            <div
              aria-hidden
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${ROW_H - 1}px, rgba(108,92,231,0.18) ${ROW_H - 1}px, rgba(108,92,231,0.18) ${ROW_H}px)`,
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${ROW_H * 3 - 1}px, rgba(108,92,231,0.32) ${ROW_H * 3 - 1}px, rgba(108,92,231,0.32) ${ROW_H * 3}px)`,
              }}
            />

            {/* الكانفس */}
            <div ref={wrapRef} className="absolute inset-0 z-[5]">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 touch-none cursor-crosshair"
                style={{ touchAction: 'none', zIndex: 5 }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onTouchStart={onTouchDown}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchEnd}
              />
            </div>

            {/* شريط المعلومات فوق الكانفس */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-3 py-2 bg-white/0 pointer-events-none">
              <span className="bg-white/80 px-2 py-0.5 rounded-lg text-xs font-bold text-[#2d3436]">{index + 1} من {total}</span>
              {isDone && <span className="bg-[#00b894] text-white px-2 py-0.5 rounded-full text-xs font-bold">⭐ متقن</span>}
            </div>

            {celebration && (              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                <div className="bg-white rounded-[20px_8px_20px_8px] border-4 border-dashed border-[#6c5ce7] px-6 py-4 text-center animate-bounce">
                  <div className="text-4xl">🎉</div>
                  <div className="text-lg font-bold text-[#2d3436] mt-1">ممتاز! {char}</div>
                  <div className="text-sm text-[#6c5ce7]">{word?.emoji} {word?.word}</div>
                  <div className="text-xs text-[#636e72] mt-1">{celebration}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* الشريط الجانبي */}
        <div className="w-48 flex-shrink-0 flex flex-col gap-3">
          <div className="bg-[#f8f4f0] rounded-[14px_5px_14px_5px] border-2 border-dashed border-[#d4b8a0] p-3 text-center">
            <div className="text-[10px] text-[#636e72] font-bold">⭐ الحرف الحالي</div>
            <div className="text-5xl font-bold text-[#2d3436] my-1">{char}</div>
            {word && <div className="text-[11px] text-[#636e72]">{word.emoji} {word.word} — {word.meaning}</div>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { if (index > 0) setIndex(index - 1); }} className="font-bold px-2 py-2 bg-[#74b9ff] text-white rounded-[20px_5px_20px_5px] border-[3px] border-[#4a8fd4] text-xs">⬅️ السابق</button>
            <button onClick={() => { if (index < total - 1) setIndex(index + 1); }} className="font-bold px-2 py-2 bg-[#55efc4] text-[#0a3d2a] rounded-[20px_5px_20px_5px] border-[3px] border-[#2cc998] text-xs">التالي ➡️</button>
            <button onClick={() => setIndex(Math.floor(Math.random() * total))} className="font-bold px-2 py-2 bg-[#fdcb6e] text-[#6c5200] rounded-[20px_5px_20px_5px] border-[3px] border-[#f0a500] text-xs">🔀 عشوائي</button>
            <button onClick={() => { setHasDrawn(false); hasDrawnRef.current = false; pointsRef.current = []; clearCanvas(); }} className="font-bold px-2 py-2 bg-[#ff7675] text-white rounded-[20px_5px_20px_5px] border-[3px] border-[#d63031] text-xs">🗑️ مسح</button>
          </div>
        </div>
      </div>
    </div>
  );
};
