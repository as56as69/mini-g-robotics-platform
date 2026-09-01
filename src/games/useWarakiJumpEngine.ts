import { useCallback, useEffect, useRef, useState } from 'react';

/* ============================================================
 * كود ماجيك — نواة «لعبة ورقي» (Doodle Jump بالورق)
 * حلقة requestAnimationFrame: جاذبية، قفزة لمس واحدة، منصات
 * تصاعدية، عوائق ورقية، خسارة بالسقوط، ارتفاع كمقياس.
 * الصعوبة ثابتة (قرار التصميم) — تسارع لطيف فقط.
 * ============================================================
 */

export const GAME_W = 360;
export const GAME_H = 560;

/** فيزياء اللعبة — وحدات بكسل/ثانية */
const GRAVITY = 1500; // تسارع السقوط
const JUMP_V = -640; // سرعة القفزة الواحدة (لمسة = قفزة)
const HORIZ_SPEED = 260; // سرعة الحركة الأفقية باللمس المستمر
const FALL_BASE = 130; // سرعة صعود الكاميرا الأساسية
const FALL_PER_SCORE = 0.9; // تسارع الكاميرا مع الارتفاع (لطيف — صعوبة ثابتة)
const MAX_SCORE_DIGITS = 4;

export type Platform = {
  id: number;
  x: number;
  y: number;
  w: number;
  obstacle: boolean;
};

export type JumpPhase = 'ready' | 'playing' | 'lost';

export interface WarakiJumpState {
  status: 'playing' | 'lost';
  score: number;
  best: number;
}

interface EngineSnapshot {
  warakiX: number;
  warakiY: number; // نسبة للشاشة (0 أعلى)
  vy: number;
  platforms: Platform[];
  camY: number; // كم صعدنا (ارتفاع)
  status: 'playing' | 'lost';
}

const PLATFORM_W = 90;
const PLATFORM_GAP_MIN = 95;
const PLATFORM_GAP_MAX = 140;
const OBSTACLE_CHANCE = 0.22; // ثابت — صعوبة ثابتة

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
  const [status, setStatus] = useState<WarakiJumpState['status']>('playing');
  const [score, setScore] = useState(0);

  const world = useRef({
    warakiX: GAME_W / 2,
    warakiY: 0, // مسافة من الكاميرا (أسفل الشاشة = 0)
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
    w.warakiY = 0;
    w.vy = 0;
    w.camY = 0;
    w.platforms = [];
    pid = 0;
    // منصة أرضية + سلّم أولي
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

  /** نقرة/لمسة = قفزة (فقط عند ملامسة منصة — نمط Doodle Jump البسيط) */
  const jump = useCallback(() => {
    const w = world.current;
    if (w.vy === 0) {
      w.vy = JUMP_V;
      w.jumpFlash = 1;
    }
  }, []);

  const setTouchX = useCallback((x: number | null) => {
    world.current.touchX = x;
  }, []);

  // ===== حلقة اللعب =====
  useEffect(() => {
    reset();
    let raf = 0;
    const step = (t: number) => {
      const w = world.current;
      if (!w.running) {
        raf = requestAnimationFrame(step);
        return;
      }
      const dt = Math.min(0.032, (t - (w.last || t)) / 1000);
      w.last = t;

      if (w.status !== 'lost') {
        // حركة أفقية نحو الإصبع
        if (w.touchX !== null) {
          const dx = w.touchX - w.warakiX;
          w.warakiX += Math.sign(dx) * Math.min(Math.abs(dx), HORIZ_SPEED * dt);
        }
        // جاذبية + حركة
        w.vy += GRAVITY * dt;
        w.warakiY -= w.vy * dt;

        if (w.jumpFlash > 0) w.jumpFlash = Math.max(0, w.jumpFlash - dt * 2.4);

        // اصطدام بالمنصات من الأعلى فقط
        if (w.vy > 0) {
          for (const p of w.platforms) {
            const pTopY = p.y;
            const prevY = w.warakiY + w.vy * dt;
            if (
              w.warakiX > p.x - 6 &&
              w.warakiX < p.x + p.w + 6 &&
              prevY <= pTopY &&
              w.warakiY >= pTopY - 2
            ) {
              w.warakiY = pTopY;
              w.vy = 0;
              break;
            }
          }
        }

        // صعود الكاميرا يتبع ورقي
        const targetCam = w.warakiY - GAME_H * 0.62;
        if (targetCam > w.camY) w.camY = w.camY + (w.warakiY - GAME_H * 0.62 - w.camY) * 0.16;

        // إزالة المنصات البعيدة وإضافة جديدة
        const highest = Math.max(...w.platforms.map((p) => p.y));
        if (highest < w.camY + GAME_H * 1.6) {
          const rnd = Math.random;
          const gap = PLATFORM_GAP_MIN + rnd() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
          w.platforms.push(makePlatform(highest + gap, rnd));
          w.platforms = w.platforms.filter((p) => p.y > w.camY - 120);
        }

        const newScore = Math.max(0, Math.floor(w.camY / 10));
        if (newScore > 0) setScore((s) => (newScore > s ? newScore : s));

        // خسارة — سقط تحت الشاشة
        if (w.warakiY < w.camY - 60) {
          w.status = 'lost';
          setStatus('lost');
          w.running = false;
        }
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reset]);

  useEffect(() => {
    // حفظ أفضل نتيجة
    if (status === 'lost') {
      const best = Number(localStorage.getItem('mg_waraki_jump_best') || 0);
      if (score > best) localStorage.setItem('mg_waraki_jump_best', String(score));
      const t = setTimeout(() => reset(), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status, score, reset]);

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
  };

  return { status, score, maxDigits: MAX_SCORE_DIGITS, state, jump, setTouchX, reset };
}
