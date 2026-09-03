import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LETTER_PATHS, LETTERS_ARABIC, LETTERS_ENGLISH, NUMBERS_ARABIC, NUMBERS_ENGLISH, LETTERS_PER_SESSION, CELEBRATION_MESSAGES, BAGHDADI_WORDS, LangMode, CharMode } from './data';
import { useNotebook } from './notebookContext';
import { letterKey, shuffle } from './utils';

/* كود ماجيك بالتفت — تبويب الرسم (تتبع الحروف)
 * ============================================================
 */

interface Props {
  lang: LangMode;
  mode: CharMode;
  setLang: (l: LangMode) => void;
  setMode: (m: CharMode) => void;
}

const INK = '#2d3436';
const PRIMARY = '#6c5ce7';

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
  const isDrawing = useRef(false);
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);

  const char = session[index] ?? session[0];
  const key = letterKey(lang, mode, char);
  const isDone = completed.has(key);
  const path = LETTER_PATHS[char];

  // إعادة ضبط عند تغيير الحرف/اللغة/الوضع
  useEffect(() => {
    setHasDrawn(false);
    pointsRef.current = [];
    clearCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, lang, mode]);

  // رسم الدليل
  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;

    const img = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);

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
      // خط منقط
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

      // نقطة البداية المتوهجة
      const start = path[0];
      const sx = (start.x / 100) * w, sy = (start.y / 100) * h;
      ctx.save();
      ctx.fillStyle = PRIMARY;
      ctx.shadowBlur = 15;
      ctx.shadowColor = PRIMARY;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.putImageData(img, 0, 0);
  }, [char, path]);

  // إعادة رسم الحبر
  const redrawInk = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pts = pointsRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGuide();
  }, [drawGuide]);

  // ضبط حجم الكانفس
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width - 12;
    canvas.height = rect.height - 12;
  }, [index]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width - 12;
    canvas.height = rect.height - 12;
    drawGuide();
  }, [drawGuide]);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // أحداث الرسم
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDone) return;
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
    if (!isDrawing.current || isDone) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    pointsRef.current.push({ x, y });
    redrawInk();
  };

  const onUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (hasDrawn && pointsRef.current.length >= 5 && !isDone) {
      addCompleted(key);
      addStars(1);
      const msg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebration(msg);
      const word = BAGHDADI_WORDS[char];
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
    <div className="max-w-4xl mx-auto">
      {/* التحكم باللغة والوضع */}
      <div className="flex gap-2 flex-wrap justify-center mb-4">
        <button onClick={() => setLang('arabic')} className={`font-bold px-3 py-1.5 rounded-[20px_6px_20px_6px] border-[3px] text-xs ${lang === 'arabic' ? 'bg-[#6c5ce7] text-white border-[#4a3f8a]' : 'bg-white text-[#2d3436] border-[#d4b8a0]'}`}>🇮🇶 عربي</button>
        <button onClick={() => setLang('english')} className={`font-bold px-3 py-1.5 rounded-[20px_6px_20px_6px] border-[3px] text-xs ${lang === 'english' ? 'bg-[#6c5ce7] text-white border-[#4a3f8a]' : 'bg-white text-[#2d3436] border-[#d4b8a0]'}`}>🇬🇧 English</button>
        <span className="mx-1 text-[#d4b8a0]">|</span>
        <button onClick={() => setMode('letters')} className={`font-bold px-3 py-1.5 rounded-[20px_6px_20px_6px] border-[3px] text-xs ${mode === 'letters' ? 'bg-[#00b894] text-white border-[#00917b]' : 'bg-white text-[#2d3436] border-[#d4b8a0]'}`}>🔤 حروف</button>
        <button onClick={() => setMode('numbers')} className={`font-bold px-3 py-1.5 rounded-[20px_6px_20px_6px] border-[3px] text-xs ${mode === 'numbers' ? 'bg-[#00b894] text-white border-[#00917b]' : 'bg-white text-[#2d3436] border-[#d4b8a0]'}`}>🔢 أرقام</button>
      </div>

      {/* مساحة الرسم */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        {/* الدفتر */}
        <div className="relative flex-1 min-h-[320px] bg-white rounded-[10px_24px_10px_24px] shadow-[0_10px_40px_rgba(0,0,0,0.15),6px_6px_0_#d4b8a0] overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute top-1.5 left-1.5 touch-none rounded cursor-crosshair"
            style={{ width: 'calc(100% - 12px)', height: 'calc(100% - 12px)', touchAction: 'none', zIndex: 5 }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
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

        {/* الشريط الجانبي */}
        <div className="sm:w-52 flex flex-col gap-3">
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
