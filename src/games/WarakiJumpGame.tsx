import React, { useCallback, useRef, useState } from 'react';
import { Home } from 'lucide-react';
import { useWarakiJumpEngine, GAME_W, GAME_H, WARAKI_W, WARAKI_H, Platform } from './useWarakiJumpEngine';
import { PaperSprite, PaperPlatform, PaperObstacle, ScribbleWorldBackdrop } from '../design/primitives';
import { INK, PAPER, paperShadow } from '../design/tokens';
import { SoundFXManager } from '../ble/SoundFX';

/* ============================================================
 * كود ماجيك — لعبة ورقي 🕹️ (هدية حسن لعباس بعد الموسم الأول)
 * قفز إلى الأعلى بنمط Doodle Jump — لمسة = قفزة، سحب = حركة.
 * معمارية: React يرسم الهيكل مرة واحدة؛ حلقة rAF تُحرّك
 * طبقة العالم + البطل + المنصات مباشرة عبر DOM (60fps حقيقية).
 * لا فلاتر SVG إطلاقًا — اهتزاز CSS خالص من الهوية.
 * ============================================================
 */

interface Props {
  onBack: () => void;
}

export const WarakiJumpGame: React.FC<Props> = ({ onBack }) => {
  const { status, score, best, platforms, layerRef, heroRef, registerPlatform, jump, setTouchX, reset } =
    useWarakiJumpEngine();
  const stageRef = useRef<HTMLDivElement>(null);
  const [hintGone, setHintGone] = useState(false);

  /** لمسة → إحداثي أفقي داخل اللعبة */
  const pointToGameX = useCallback((clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return ((clientX - rect.left) / rect.width) * GAME_W;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const x = pointToGameX(e.clientX);
      if (x === null) return;
      setHintGone(true);
      jump();
      setTouchX(x);
      try { stageRef.current?.setPointerCapture(e.pointerId); } catch { /* noop */ }
    },
    [jump, setTouchX, pointToGameX]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const x = pointToGameX(e.clientX);
      if (x !== null) setTouchX(x);
    },
    [pointToGameX, setTouchX]
  );

  const onPointerUp = useCallback(() => setTouchX(null), []);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col" dir="rtl">
      {/* شريط علوي */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 bg-[#f5f0e1] border-b-2 border-[#2b2a33]/20">
        <span className="doodle-title font-bold text-[#2b2a33] text-sm sm:text-base">
          🕹️ لعبة ورقي — هدية حسن 🎁
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

      {/* مسرح اللعبة — عمود flex حقيقي، بلا مواضع مزمّعة */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-2">
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative touch-none select-none overflow-hidden border-[3px] rounded-[22px_30px_24px_36px] w-full"
          style={{
            maxWidth: GAME_W,
            maxHeight: '100%',
            aspectRatio: `${GAME_W} / ${GAME_H}`,
            background: PAPER.white,
            borderColor: INK,
            boxShadow: paperShadow(true),
          }}
        >
          {/* خلفية ساكنة */}
          <ScribbleWorldBackdrop />

          {/* طبقة العالم المنزلقة (تُحرَّك بـ transform من المحرك) */}
          <div ref={layerRef} className="absolute inset-0" style={{ willChange: 'transform' }}>
            {/* ورقي البطل — داخل الطبقة: المترجم يحرّكه بإحداثيات عالم */}
            <div ref={heroRef} className="absolute top-0 left-0" style={{ width: WARAKI_W, height: WARAKI_H, zIndex: 10, willChange: 'transform' }}>
              <PaperSprite className="mc-wiggle" />
            </div>

            {/* المنصات — top يضبطه المحرك كل إطار مباشرة */}
            {platforms.map((p) => (
              <div
                key={p.id}
                ref={(el) => {
                  registerPlatform(p.id, el);
                }}
                className="absolute"
                style={{ left: `${(p.x / GAME_W) * 100}%`, width: `${(p.w / GAME_W) * 100}%` }}
              >
                <div className="mc-paper-wobble">
                  <PaperPlatform w={p.w} />
                  {p.obstacle && <PaperObstacle className="absolute -top-8 left-1/2 -translate-x-1/2 w-10 h-9" />}
                </div>
              </div>
            ))}
          </div>

          {/* شارة النتيجة */}
          <div
            className="absolute top-2 right-2 z-20 doodle-title text-sm font-bold px-3 py-1 bg-[#ffecc2] border-2 border-[#2b2a33]/50"
            style={{ borderRadius: '12px 16px 12px 18px', color: INK }}
          >
            🪜 {score} {score >= best && score > 0 ? '🏆' : ''}
          </div>

          {/* شاشة الخسارة */}
          {status === 'lost' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#2b2a33]/10">
              <div
                className="bg-[#fffef7] border-[3px] px-7 py-5 text-center mx-4"
                style={{ borderColor: INK, boxShadow: paperShadow(true), borderRadius: '20px 28px 18px 26px' }}
              >
                <p className="doodle-title text-lg font-bold mb-1" style={{ color: INK }}>
                  أوبس! سقط ورقي… 📄
                </p>
                <p className="doodle-title text-sm mb-2" style={{ color: INK }}>
                  الارتفاع: {score} {score >= best && score > 0 ? '— رقم قياسي! 🏆' : `— الأفضل: ${best}`}
                </p>
                <button
                  onClick={() => {
                    SoundFXManager.playPaperRustle();
                    reset();
                  }}
                  className="doodle-title text-sm font-bold px-5 py-2 bg-[#6bcb77] text-white border-2 border-[#2b2a33] rounded-xl active:scale-95"
                >
                  إعادة المحاولة! 🔄
                </button>
              </div>
            </div>
          )}

          {/* تعليمات اللعب قبل أول قفزة */}
          {!hintGone && status === 'playing' && (
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 doodle-title text-[11px] text-[#2b2a33]/50 z-10 text-center px-3 whitespace-nowrap">
              المس الشاشة = قفزة 🦘 · اسحب يمينًا/يسارًا للحركة
            </p>
          )}
        </div>
      </div>

      {/* تذييل */}
      <div className="flex-shrink-0 text-center py-1 pointer-events-none">
        <span className="doodle-title text-[10px] text-[#2b2a33]/40">ورقي يقفز بلمسة إصبعك — بلا بلوكات، لعب حرّ! 🎈</span>
      </div>
    </div>
  );
};
