import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Home, RefreshCw } from 'lucide-react';
import { ScribbleBlob } from '../design/primitives';
import { PAPER, paperShadow } from '../design/tokens';
import { SoundFXManager } from '../ble/SoundFX';
import {
  SCRIBBLE_CATEGORIES,
  ScribbleDrawing,
  pickRandomPaper,
  ScribbleItem,
} from './ScribbleRenderer';

/* ============================================================
 * كود ماجيك — لوحة مستر شخبوط 🌀
 * وحش خربشة (خطوط متداخلة + عينان تتبعان) له لوحته الخاصة.
 * الطفل يختار فئة جاهزة → شخبوط يرسم شيئاً منها بالخربشة.
 * كل جلسة على ورقة مختلفة (قرار التصميم).
 * ============================================================
 */

type Mood = 'idle' | 'think' | 'draw' | 'cheer';

interface Props {
  onBack: () => void;
}

export const ShkhoobotBoard: React.FC<Props> = ({ onBack }) => {
  const [mood, setMood] = useState<Mood>('idle');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [drawing, setDrawing] = useState<{ item: ScribbleItem; seed: number } | null>(null);
  const [paper, setPaper] = useState(() => pickRandomPaper());
  const [drawKey, setDrawKey] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });

  /** ورقة جديدة لكل جلسة (عند كل فتح للوحة) */
  useEffect(() => {
    setPaper(pickRandomPaper());
    setSeed(Math.floor(Math.random() * 100000));
  }, []);

  /** العينان تتبعان المؤشر/الإصبع */
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const dy = ((e.clientY - r.top) / r.height - 0.35) * 0.6;
      setLook({ x: Math.max(-1, Math.min(1, dx * 2)), y: Math.max(-1, Math.min(1, dy * 2)) });
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, []);

  /** التفكير ثم الرسم */
  const drawItem = useCallback(
    (catId: string, itemId: string) => {
      const cat = SCRIBBLE_CATEGORIES.find((c) => c.id === catId);
      const item = cat?.items.find((i) => i.id === itemId);
      if (!item || mood === 'draw') return;
      SoundFXManager.playPaperRustle();
      setMood('think');
      window.setTimeout(() => {
        setMood('draw');
        setDrawing({ item, seed: Math.floor(Math.random() * 100000) });
        setDrawKey((k) => k + 1);
        SoundFXManager.playRobotChirp();
        window.setTimeout(() => setMood('cheer'), 2200);
      }, 900);
    },
    [mood]
  );

  const message = (() => {
    switch (mood) {
      case 'think':
        return 'هممم… كيف أرسمها بشخبطتي؟ 🤔';
      case 'draw':
        return 'أنظر! أرسمها خطاً بخط… ✏️';
      case 'cheer':
        return 'تمّت! كل شخبطة فريدة مثلي! 🌀';
      default:
        return 'هلا! أنا «مستر شخبوط» — اختر فئة وسأخربشها لك!';
    }
  })();

  return (
    <div className="flex-1 relative overflow-hidden" dir="rtl">
      {/* شريط علوي */}
      <div className="relative z-20 flex items-center justify-between px-3 py-2.5 bg-[#f5f0e1] border-b-2 border-[#2b2a33]/20">
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

      <div className="absolute inset-0 top-[44px] overflow-y-auto doodle-notebook doodle-paper-kraft px-3 sm:px-8 py-4" style={{ background: paper.bg }} dir="rtl">
        {/* تلميح الورقة */}
        <p className="doodle-title text-[10px] text-[#2b2a33]/45 text-center mb-2">
          ورقة هذه الجلسة: {paper.label} — كل جلسة لها ورقة جديدة! 📄
        </p>

        <div ref={boardRef} className="max-w-3xl mx-auto flex flex-col gap-3">
          {/* مسرح شخبوط + الرسمة */}
          <div className="relative flex items-center justify-center gap-4 flex-wrap">
            {/* مستر شخبوط */}
            <div className="relative w-40 sm:w-48" style={{ transform: `translate(${look.x * 3}px, ${look.y * 2}px)` }}>
              <ScribbleBlob seed={seed} mood={mood === 'think' ? 'think' : 'idle'} lookX={look.x} lookY={look.y} />
              <span className="character-badge absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-[#2b2a33] whitespace-nowrap">
                مستر شخبوط
              </span>
            </div>

            {/* الورقة البيضاء للرسمة */}
            <div
              className="relative w-48 h-48 sm:w-56 sm:h-56 border-[3px] border-[#2b2a33]"
              style={{ background: PAPER.white, borderRadius: '18px 26px 16px 24px', boxShadow: paperShadow(true) }}
            >
              {drawing ? (
                <ScribbleDrawing key={drawKey} item={drawing.item} seed={drawing.seed} live className="w-full h-full p-2" />
              ) : (
                <p className="doodle-title absolute inset-0 flex items-center justify-center text-[#2b2a33]/35 text-xs text-center px-4">
                  ورقة الرسم — اختر فئة وأشياءً 👇
                </p>
              )}
            </div>
          </div>

          {/* فقاعة الحالة */}
          <div className="doodle-wiggly mx-auto px-4 py-2 bg-[#fff5f5] border-[2.5px] border-[#2b2a33]" style={{ borderRadius: '14px 20px 12px 18px', boxShadow: paperShadow() }}>
            <p className="doodle-title text-[#2b2a33] text-xs sm:text-sm font-bold">{message}</p>
          </div>

          {/* لوحة الفئات */}
          <div className="flex flex-col gap-2 mt-1">
            {SCRIBBLE_CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 flex-wrap justify-center">
                <span className="doodle-title text-xs font-bold text-[#2b2a33]/70 w-20 text-left">{cat.icon} {cat.labelAr}</span>
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => drawItem(cat.id, item.id)}
                    disabled={mood === 'think' || mood === 'draw'}
                    className="doodle-title text-xs font-bold px-3 py-2 bg-white border-[2.5px] border-[#2b2a33] rounded-[12px_18px_12px_18px] transition active:scale-95 hover:bg-[#ffecc2] disabled:opacity-40"
                    style={{ boxShadow: '2px 3px 0 rgba(43,42,51,0.2)' }}
                  >
                    {item.icon} {item.labelAr}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* زر إعادة شكل شخبوط */}
          <div className="text-center mt-1">
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
