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
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const isDoneRef = useRef(false);

  const char = session[index] ?? session[0];
  const key = letterKey(lang, mode, char);
  const isDone = completed.has(key);
  const path = LETTER_PATHS[char];

  isDoneRef.current = isDone;

  /* --- آلة رسم الكانفس بمقياس DPR --- */

  // رسم الدليل: حرف باهت + خط منقط + نقطة البداية، متمركز على سطر الكتابة الأوسط.
  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    // بمسح حسب الأبعاد الفعلية بالنقاط بعد تحويل dpr
    const w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    // سطر الكتابة الأوسط
    const rows = Math.max(1, Math.floor(h / ROW_H));
    const cy = (Math.floor(rows / 2) + 0.5) * ROW_H;
    const cx = w / 2;

    const letterSize = Math.min(w, ROW_H * 2.4) * 0.9;

    // حرف باهت خلفيًا على سطر الكتابة
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.font = `${letterSize}px 'Comic Neue', 'Comic Sans MS', cursive`;
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
        const px = (p.x / 100) * w, py = cy + ((p.y - 50) / 100) * ROW_H;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();

      const start = path[0];
      const sx = (start.x / 100) * w, sy = cy + ((start.y - 50) / 100) * ROW_H;
      ctx.save();
      ctx.fillStyle = PRIMARY;
      ctx.shadowBlur = 15;
      ctx.shadowColor = PRIMARY;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [char, path]);

  // يضبط حجم الكانفس ليطابق حاوية الدفتر (مع dpr) ويُرجع أبعاد CSS.
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(20, rect.width);
    const h = Math.max(20, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGuide();
  }, [drawGuide]);

  // إعادة رسم الحبر فوق الدليل
  const redrawInk = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = canvas.width / dpr, h = canvas.height / dpr;
    const pts = pointsRef.current;
    ctx.clearRect(0, 0, w, h);
    drawGuide();
    if (pts.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();
  }, [drawGuide]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    drawGuide();
  }, [drawGuide]);

  // إعادة ضبط عند تغيير الحرف/اللغة/الوضع
  useEffect(() => {
    setHasDrawn(false);
    pointsRef.current = [];
    clearCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, lang, mode]);

  // مراقبة تغيّر حجم الحاوية مع debounce (يشمل دوران الشاشة و dpr)
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

  // أحداث الرسم
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDoneRef.current) return;
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    pointsRef.current = [{ x, y }];
    redrawInk();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || isDoneRef.current) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    pointsRef.current.push({ x, y });
    redrawInk();
  };

  const onUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (hasDrawn && pointsRef.current.length >= 5 && !isDoneRef.current) {
      addCompleted(key);
      addStars(1);
      const msg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebration(msg);
      setTimeout(() => {
        setCelebration(null);
        setHasDrawn(false);
        pointsRef.current = [];
        clearCanvas();
        if (index < session.length - 1) { setIndex(index + 1); }
      }, 1500);
    }
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

      {/* منطقة الرسم: تملأ المساحة المتبقية */}
      <div className="flex-1 min-h-0 px-3 sm:px-6 pb-3 flex gap-4 items-stretch">
        {/* خلفية ورقة بيج حول الدفتر */}
        <div className="flex-1 min-w-0 rounded-[14px_28px_14px_28px] bg-[#f6ead9] p-3 sm:p-4 flex shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)]">
          {/* الدفتر الأبيض */}
          <div className="relative flex-1 border-[3px] border-[#efe3d2] rounded-[8px_18px_8px_18px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_0_#e6d6c2] overflow-hidden">
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
              />
            </div>

            {/* شريط المعلومات فوق الكانفس */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-3 py-2 bg-white/0 pointer-events-none">
              <span className="bg-white/80 px-2 py-0.5 rounded-lg text-xs font-bold text-[#2d3436]">{index + 1} من {total}</span>
              {isDone && <span className="bg-[#00b894] text-white px-2 py-0.5 rounded-full text-xs font-bold">⭐ متقن</span>}
            </div>

            {celebration && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
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
        <div className="w-48 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          <div className="bg-[#f8f4f0] rounded-[14px_5px_14px_5px] border-2 border-dashed border-[#d4b8a0] p-3 text-center">
            <div className="text-[10px] text-[#636e72] font-bold">⭐ الحرف الحالي</div>
            <div className="text-5xl font-bold text-[#2d3436] my-1">{char}</div>
            {word && <div className="text-[11px] text-[#636e72]">{word.emoji} {word.word} — {word.meaning}</div>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { if (index > 0) setIndex(index - 1); }} className="font-bold px-2 py-2 bg-[#74b9ff] text-white rounded-[20px_5px_20px_5px] border-[3px] border-[#4a8fd4] text-xs">⬅️ السابق</button>
            <button onClick={() => { if (index < total - 1) setIndex(index + 1); }} className="font-bold px-2 py-2 bg-[#55efc4] text-[#0a3d2a] rounded-[20px_5px_20px_5px] border-[3px] border-[#2cc998] text-xs">التالي ➡️</button>
            <button onClick={() => setIndex(Math.floor(Math.random() * total))} className="font-bold px-2 py-2 bg-[#fdcb6e] text-[#6c5200] rounded-[20px_5px_20px_5px] border-[3px] border-[#f0a500] text-xs">🔀 عشوائي</button>
            <button onClick={() => { setHasDrawn(false); pointsRef.current = []; clearCanvas(); }} className="font-bold px-2 py-2 bg-[#ff7675] text-white rounded-[20px_5px_20px_5px] border-[3px] border-[#d63031] text-xs">🗑️ مسح</button>
          </div>
        </div>
      </div>
    </div>
  );
};
