import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundFXManager } from '../ble/SoundFX';

/* ============================================================
 * كود ماجيك — نواة «لعبة ورقي» (Doodle Jump بالورق)
 * حلقة requestAnimationFrame: جاذبية، قفزة لمس واحدة، منصات
 * تصاعدية، عوائق ورقية، خسارة بالسقوط، ارتفاع كمقياس.
 * الصعوبة ثابتة (قرار التصميم) — تسارع لطيف فقط.
 * ============================================================
 */

export const GAME_W = 360;
export const GAME_H = 560;

/** فيزياء اللعبة — وحدات بكسل/ثانية (نظام y يزيد للأعلى) */
const GRAVITY = 1450; // تسارع السقوط (يُنقص vy حتى تصير سالبة = هبوط)
const JUMP_V = 780; // سرعة القفزة للأعلى (أقصى ارتفاع ≈ 209px)
const HORIZ_SPEED = 260; // سرعة الحركة الأفقية باللمس المستمر

export type Platform = {
  id: number;
  x: number;
  y: number;
  w: number;
  obstacle: boolean;
};

const PLATFORM_W = 90;
const PLATFORM_GAP_MIN = 90;
const PLATFORM_GAP_MAX = 150;
const OBSTACLE_CHANCE = 0.22; // ثابت — صعوبة ثابتة
/** ارتفاع سبيريت ورقي بالبكسل (70px عرض × نسبة viewBox 130/90) */
const WARAKI_H = 102;

let pid = 0;

function makePlatform(y: number, rnd: () => number): Platform {
  return {
    id: pid++,
    x: 12 + rnd() * (GAME_W - PLATFORM_W - 24),
    y,
    w: PLATFORM_W,
    obstacle: rnd() < OBSTACLE_CHANCE,
  };
}

export function useWarakiJumpEngine() {
  const [, forceRender] = useState(0);
  const [status, setStatus] = useState<'playing' | 'lost'>('playing');
  const [score, setScore] = useState(0);

  const world = useRef({
    /** إحداثيات العالم: y يزيد للأعلى، القدم على منصة y = p.y */
    warakiX: GAME_W / 2,
    warakiY: 40,
    vy: 0,
    camY: 0,
    status: 'playing' as 'playing' | 'lost',
    platforms: [] as Platform[],
    touchX: null as number | null,
    jumpFlash: 0,
    last: 0,
    running: false,
  });

  const reset = useCallback(() => {
    const w = world.current;
    const rnd = Math.random;
    w.warakiX = GAME_W / 2;
    w.warakiY = 40;
    w.vy = 0;
    w.camY = 0;
    w.platforms = [];
    pid = 0;
    // منصة أرضية + سلّم أولي صاعد
    w.platforms.push({ id: pid++, x: GAME_W / 2 - PLATFORM_W / 2, y: 40, w: PLATFORM_W, obstacle: false });
    let y = 40;
    while (y < GAME_H * 3.2) {
      y += PLATFORM_GAP_MIN + rnd() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      w.platforms.push(makePlatform(y, rnd));
    }
    w.touchX = null;
    w.jumpFlash = 0;
    w.status = 'playing';
    setStatus('playing');
    setScore(0);
    w.running = true;
    w.last = 0;
  }, []);

  /** نقرة/لمسة = قفزة (فقط حين يقف على منصة — نمط Doodle Jump البسيط) */
  const jump = useCallback(() => {
    const w = world.current;
    if (w.status === 'playing' && w.vy === 0) {
      w.vy = JUMP_V; // موجب = قفزة للأعلى في نظام y-up
      w.jumpFlash = 1;
      SoundFXManager.playClickBeep();
    }
  }, []);

  const setTouchX = useCallback((x: number | null) => {
    world.current.touchX = x;
  }, []);

  // ===== حلقة اللعب — تُحدّث العالم وتعيد الرسم كل إطار =====
  useEffect(() => {
    reset();
    let raf = 0;
    const step = (t: number) => {
      const w = world.current;
      const dt = Math.min(0.032, (t - (w.last || t)) / 1000);
      w.last = t;

      if (w.running && w.status === 'playing') {
        // حركة أفقية نحو الإصبع
        if (w.touchX !== null) {
          const dx = w.touchX - w.warakiX;
          w.warakiX += Math.sign(dx) * Math.min(Math.abs(dx), HORIZ_SPEED * dt);
          w.warakiX = Math.max(14, Math.min(GAME_W - 14, w.warakiX));
        }
        // جاذبية + حركة عمودية (y يزيد للأعلى — القفز vy موجب، الجاذبية تنقصه)
        w.vy -= GRAVITY * dt;
        const prevFeet = w.warakiY;
        w.warakiY += w.vy * dt;

        if (w.jumpFlash > 0) w.jumpFlash = Math.max(0, w.jumpFlash - dt * 2.4);

        // هبوط على المنصات — السقوط (vy<0) يعبر سطح المنصة نازلًا
        if (w.vy < 0) {
          for (const p of w.platforms) {
            if (
              w.warakiX > p.x - 8 &&
              w.warakiX < p.x + p.w + 8 &&
              prevFeet >= p.y &&
              w.warakiY <= p.y
            ) {
              w.warakiY = p.y;
              w.vy = 0;
              break;
            }
          }
        }

        // الكاميرا تتبع ورقي لأعلى فقط
        const targetCam = w.warakiY - GAME_H * 0.62;
        if (targetCam > w.camY) w.camY = targetCam;

        // إزالة المنصات البعيدة تحت الشاشة وإضافة جديدة في الأعلى
        w.platforms = w.platforms.filter((p) => p.y > w.camY - 140);
        const highest = Math.max(...w.platforms.map((p) => p.y));
        if (highest < w.camY + GAME_H * 1.6) {
          const rnd = Math.random;
          const gap = PLATFORM_GAP_MIN + rnd() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
          w.platforms.push(makePlatform(highest + gap, rnd));
        }

        // النتيجة = الارتفاع
        const newScore = Math.max(0, Math.floor(w.camY / 10));
        setScore((s) => (newScore > s ? newScore : s));

        // خسارة — سقط تحت الشاشة بعمق
        if (w.warakiY < w.camY - WARAKI_H) {
          w.status = 'lost';
          setStatus('lost');
          w.running = false;
        }
      }

      // إعادة الرسم كل إطار — اللعبة حيّة 60fps
      forceRender((n) => (n + 1) % 1000000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reset]);

  useEffect(() => {
    // حفظ أفضل نتيجة + إعادة تلقائية
    if (status === 'lost') {
      const best = Number(localStorage.getItem('mg_waraki_jump_best') || 0);
      if (score > best) localStorage.setItem('mg_waraki_jump_best', String(score));
      const t = setTimeout(() => reset(), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status, score, reset]);

  /** إحداثيات الشاشة لمركّب عالمي: y عالمي يزيد للأعلى */
  const toScreenY = useCallback(
    (worldY: number, cam: number): number => GAME_H - (worldY - cam),
    []
  );

  const state = {
    get warakiX() {
      return world.current.warakiX;
    },
    get warakiY() {
      return world.current.warakiY;
    },
    get vy() {
      return world.current.vy;
    },
    get platforms() {
      return world.current.platforms;
    },
    get camY() {
      return world.current.camY;
    },
    get jumpFlash() {
      return world.current.jumpFlash;
    },
    get warakiScreenY() {
      return GAME_H - (world.current.warakiY - world.current.camY);
    },
    get warakiH() {
      return WARAKI_H;
    },
  };

  return { status, score, state, toScreenY, jump, setTouchX, reset };
}
