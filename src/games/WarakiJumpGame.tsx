import React, { useCallback, useRef } from 'react';
import { Home } from 'lucide-react';
import { useWarakiJumpEngine, GAME_W, GAME_H, Platform } from './useWarakiJumpEngine';
import { PaperSprite, PaperPlatform, PaperObstacle, ScribbleWorldBackdrop } from '../design/primitives';
import { INK, PAPER, paperShadow } from '../design/tokens';
import { SoundFXManager } from '../ble/SoundFX';

/* ============================================================
 * كود ماجيك — لعبة ورقي 🕹️ (هدية حسن لعباس بعد الموسم الأول)
 * قفز إلى الأعلى بنمط Doodle Jump — لمسة واحدة = قفزة،
 * سحب الإصبع أفقياً = حركة. كل الرسوم من الهوية الورقية
 * (tokens + primitives) — نفس عالم المغامرات تمامًا.
 * ============================================================
 */

interface Props {
  onBack: () => void;
}

export const WarakiJumpGame: React.FC<Props> = ({ onBack }) => {
  const { status, score, state, jump, setTouchX, reset } = useWarakiJumpEngine();
  const stageRef = useRef<HTMLDivElement>(null);

  const best = Number(localStorage.getItem('mg_waraki_jump_best') || 0);

  /** تحويل إحداثيات اللمس إلى إحداثيات اللعبة */
  const pointToGame = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * GAME_W,
      y: clientY,
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const p = pointToGame(e.clientX, e.clientY);
      if (!p) return;
      SoundFXManager.playClickBeep();
      jump();
      setTouchX(p.x);
      stageRef.current?.setPointerCapture(e.pointerId);
    },
    [jump, setTouchX]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const p = pointToGame(e.clientX, e.clientY);
      if (p) setTouchX(p.x);
    },
    [pointToGame, setTouchX]
  );

  const onPointerUp = useCallback(() => setTouchX(null), []);

  const pose = state.vy < -60 ? 'jump' : state.vy > 160 ? 'fall' : 'idle';

  return (
    <div className="flex-1 relative overflow-hidden" dir="rtl">
      {/* شريط علوي */}
      <div className="relative z-20 flex items-center justify-between px-3 py-2.5 bg-[#f5f0e1] border-b-2 border-[#2b2a33]/20">
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

      {/* مسرح اللعبة */}
      <div className="absolute inset-0 top-[44px] flex items-center justify-center p-2">
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative touch-none select-none overflow-hidden border-[3px] rounded-[22px_30px_24px_36px]"
          style={{
            width: 'min(96vw, ' + GAME_W + 'px)',
            height: 'min(88vh, ' + GAME_H + 'px)',
            background: PAPER.white,
            borderColor: INK,
            boxShadow: paperShadow(true),
          }}
        >
          {/* خلفية العالم */}
          <ScribbleWorldBackdrop />

          {/* المنصات */}
          {state.platforms.map((p: Platform) => {
            const screenY = GAME_H - (p.y - state.warakiY);
            return (
              <div
                key={p.id}
                className="absolute mc-paper-wobble"
                style={{
                  left: `${(p.x / GAME_W) * 100}%`,
                  top: `${screenY}px`,
                  width: `${(p.w / GAME_W) * 100}%`,
                }}
              >
                <PaperPlatform w={p.w} />
                {p.obstacle && (
                  <PaperObstacle className="absolute -top-9 left-1/2 -translate-x-1/2 w-11 h-10" />
                )}
              </div>
            );
          })}

          {/* ورقي البطل */}
          <div
            className={`absolute w-[70px] ${state.jumpFlash > 0 ? 'mc-waraki-jump' : ''}`}
            style={{
              left: `${(state.warakiX / GAME_W) * 100}%`,
              top: `${GAME_H - state.warakiY + state.camY - 74}px`,
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          >
            <PaperSprite lookX={0} lookY={pose === 'fall' ? 0.4 : pose === 'jump' ? -0.6 : 0} pose={pose} />
          </div>

          {/* شارة النتيجة */}
          <div className="absolute top-2 right-2 z-20 doodle-title text-sm font-bold px-3 py-1 bg-[#ffecc2] border-2 border-[#2b2a33]/50" style={{ borderRadius: '12px 16px 12px 18px', color: INK }}>
            🪜 {score} {score > best && score > 0 ? '🏆' : ''}
          </div>

          {/* شاشة الخسارة */}
          {status === 'lost' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#2b2a33]/10">
              <div
                className="doodle-wiggly bg-[#fffef7] border-[3px] px-7 py-5 text-center mx-4"
                style={{ borderColor: INK, boxShadow: paperShadow(true), borderRadius: '20px 28px 18px 26px' }}
              >
                <p className="doodle-title text-lg font-bold mb-1" style={{ color: INK }}>
                  أوبس! سقط ورقي… 📄
                </p>
                <p className="doodle-title text-sm mb-2" style={{ color: INK }}>
                  الارتفاع: {score} {score >= best && score > 0 ? '— رقم قياسي! 🏆' : `— الأفضل: ${best}`}
                </p>
                <p className="doodle-title text-[10px] text-[#2b2a33]/50">جارٍ إعادة المحاولة…</p>
              </div>
            </div>
          )}

          {/* تعليمات اللعب (تظهر في الأعلى فقط قبل أول قفزة) */}
          {score === 0 && status === 'playing' && (
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 doodle-title text-[11px] text-[#2b2a33]/50 z-10 text-center px-3">
              المس الشاشة = قفزة 🦘 · اسحب إصبعك يمينًا/يسارًا للحركة
            </p>
          )}
        </div>
      </div>

      {/* تذييل الهوية */}
      <div className="absolute bottom-1.5 inset-x-0 text-center z-20 pointer-events-none">
        <span className="doodle-title text-[10px] text-[#2b2a33]/40">ورقي يقفز بلمسة إصبعك — بلا بلوكات، لعب حرّ! 🎈</span>
      </div>
    </div>
  );
};
