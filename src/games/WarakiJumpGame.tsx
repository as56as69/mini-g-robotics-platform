import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Home } from 'lucide-react';
import { useWarakiJumpEngine, GAME_W, GAME_H, WARAKI_W, WARAKI_H } from './useWarakiJumpEngine';
import {
  PaperSprite,
  PaperPlatform,
  PaperObstacle,
  PaperOrb,
  PaperBalloon,
  ScribbleWorldBackdrop,
} from '../design/primitives';
import { INK, paperShadow } from '../design/tokens';

/* ============================================================
 * كود ماجيك — لعبة ورقي 🕹️ (هدية حسن لعباس بعد الموسم الأول)
 *
 * النمط النهائي (قرارات المستخدم): قفز ذاتي بلا خسارة.
 * - ورقي يقفز بحد ذاته فور لمس أي منصة — لا تحتاج لمسًا للقفز.
 * - تتحكم بالاتجاه فقط: لمس واسحب يمينًا/يسارًا (استجابة فورية).
 * - بلا خسارة إطلاقًا: عند ملامسة الحافة السفلية تظهر بالونة
 *   ترفعه لأقرب منصة — الكرات لا تُسقِط ولا شيء يُصفَّر.
 * - المكعبات تتحطم عند اللمس = بونص +2 كرة (بلا أي خطر).
 * - الكرات اللونية نظام التقدم الوحيد: كل 10 ←  ثيم خلفية جديد
 *   (ورق + لون وموضع الشمس + غيوم بأماكن جديدة).
 * معمارية: React يرسم الهيكل؛ حلقة rAF تُحرّك DOM مباشرة (60fps).
 * لا فلاتر SVG إطلاقًا — اهتزاز/شامبانو CSS خالص من الهوية.
 * ============================================================
 */

interface Props {
  onBack: () => void;
}

export const WarakiJumpGame: React.FC<Props> = ({ onBack }) => {
  const {
    orbCount,
    themeIndex,
    rescuing,
    counterKey,
    platforms,
    orbs,
    heroRef,
    balloonRef,
    registerPlatform,
    registerOrb,
    setTouchX,
    reset,
  } = useWarakiJumpEngine();

  const stageRef = useRef<HTMLDivElement>(null);

  /** لمسة/سحب → إحداثي أفقي داخل اللعبة (مع مراعاة التحجيم) */
  const pointToGameX = useCallback((clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const scale = rect.width / GAME_W;
    const x = (clientX - rect.left) / scale;
    return Math.max(0, Math.min(GAME_W, x));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const x = pointToGameX(e.clientX);
      if (x === null) return;
      setTouchX(x);
      try {
        stageRef.current?.setPointerCapture(e.pointerId);
      } catch { /* noop */ }
    },
    [pointToGameX, setTouchX]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const x = pointToGameX(e.clientX);
      if (x !== null) setTouchX(x);
    },
    [pointToGameX, setTouchX]
  );

  const onPointerUp = useCallback(() => setTouchX(null), []);
  const onPointerCancel = useCallback(() => setTouchX(null), []);

  // ألوان الكرات (نفس تسلسل pritives) للشارة
  const orbProgress = orbCount % 10;
  const themeFlashKey = Math.floor(orbCount / 10);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col" dir="rtl">
      {/* شريط علوي */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 bg-[#f5f0e1] border-b-2 border-[#2b2a33]/20">
        <span className="doodle-title font-bold text-[#2b2a33] text-sm sm:text-base">
          🕹️ لعبة ورقي — هدية حسن 🎁
        </span>
        <button
          onClick={() => {
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
          onPointerCancel={onPointerCancel}
          className="relative touch-none select-none overflow-hidden border-[3px] rounded-[22px_30px_24px_36px] w-full"
          style={{
            maxWidth: GAME_W,
            maxHeight: '100%',
            aspectRatio: `${GAME_W} / ${GAME_H}`,
            borderColor: INK,
            boxShadow: paperShadow(true),
          }}
        >
          {/* الخلفية — ثيم يتبدل كل 10 كرات */}
          <ScribbleWorldBackdrop variant={themeIndex} />

          {/* المنصات + البطل + الكرات + البالونة — إحداثيات شاشة، المحرك يحدّث top مباشرة */}
          <div className="absolute inset-0">
            {/* ورقي البطل — القدم عند feetY */}
            <div
              ref={heroRef}
              className="absolute"
              style={{ width: WARAKI_W, height: WARAKI_H, zIndex: 10, willChange: 'top, left' }}
            >
              <PaperSprite className="mc-wiggle" />
            </div>

            {/* المنصات — top يضبطه المحرك كل إطار؛ المكعب يتحطم عند اللمس */}
            {platforms.map((p) => (
              <div
                key={p.id}
                ref={(el) => {
                  registerPlatform(p.id, el);
                }}
                className="absolute"
                style={{ left: `${(p.x / GAME_W) * 100}%`, width: `${(p.w / GAME_W) * 100}%`, top: GAME_H - p.y }}
              >
                <div className="mc-paper-wobble relative">
                  <PaperPlatform w={p.w} />
                  {p.cube && !p.cubeTaken && (
                    <span data-cube className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8">
                      <PaperObstacle className="w-full h-full" />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* الكرات اللونية — نظام التقدم الوحيد */}
            {orbs.map((o) => (
              <div
                key={o.id}
                ref={(el) => {
                  registerOrb(o.id, el);
                }}
                className="absolute -translate-x-1/2"
                style={{ zIndex: 8 }}
                data-topset
              >
                <PaperOrb colorIdx={o.colorIdx} className={`mc-orb-float ${o.colorIdx % 2 ? 'mc-orb-float2' : ''}`} />
              </div>
            ))}

            {/* بالونة الإنقاذ — تظهر فقط عند دفع ورقي لحافة الشاشة */}
            <div
              ref={balloonRef}
              className="absolute z-[9] pointer-events-none"
              style={{ left: '50%', bottom: -40, width: 70, height: 120, marginLeft: -35, opacity: 0, willChange: 'opacity' }}
            >
              <PaperBalloon className="mc-balloon-lift mc-wiggle-anim" />
            </div>
          </div>

          {/* شارة تقدم الكرات 🎨 — نظام التقدم الوحيد */}
          <div
            key={counterKey}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 doodle-title text-sm font-bold px-3 py-1 bg-[#fffef7] border-2"
            style={{ borderColor: INK, borderRadius: '12px 16px 12px 18px', color: INK, boxShadow: paperShadow(false) }}
          >
            <span className="mc-score-pop inline-block">🎨 {orbCount}</span>
            <span className="text-[#2b2a33]/40"> / 10</span>
            <span className="inline-flex gap-0.5 mr-1 align-middle">
              {Array.from({ length: orbProgress > 0 ? Math.min(orbProgress, 5) : 0 }).map((_, i) => (
                <span key={i} className="inline-block w-2 h-2 rounded-full border-[1.5px] border-[#2b2a33]/50" style={{ background: ['#ffd93d', '#4fc3f7', '#6bcf6b', '#ff8fb0', '#ff7f50'][i % 5] }} />
              ))}
            </span>
          </div>

          {/* تنبيه تبديل الثيم — كل 10 كرات */}
          <div key={themeFlashKey} className="points absolute top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            {themeFlashKey > 0 ? <span className="mc-theme-fade doodle-title font-bold text-sm" style={{ color: INK }}>ثيم جديد! 🎨</span> : null}
          </div>

          {/* طبقة بالونة الإنقاذ تعتيم خفيف للنص */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center">
            {rescuing && (
              <span className="mc-theme-fade doodle-title text-xs font-bold" style={{ color: '#b03a48' }}>
                البالونة تحملك للأعلى! 🎈
              </span>
            )}
          </div>
        </div>
      </div>

      {/* تذييل */}
      <div className="flex-shrink-0 text-center py-1 pointer-events-none">
        <span className="doodle-title text-[10px] text-[#2b2a33]/40">
          ورقي يقفز ذاتيًا — اسحب فقط للاتجاه، اجمع الكرات، وكل 10 كرات ثيم جديد! 🎈
        </span>
      </div>
    </div>
  );
};