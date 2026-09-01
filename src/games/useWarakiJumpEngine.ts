import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundFXManager } from '../ble/SoundFX';

/* ============================================================
 * كود ماجيك — نواة «لعبة ورقي» (Doodle Jump بالورق)
 * نظام إحداثيات بسيط ومضمون: كل شيء بإحداثيات شاشة مباشرة.
 *   screenY(worldY) = GAME_H - (worldY - camY)
 * - البطل: feetY عالمي → top = screenY(feetY) - WARAKI_H
 * - المنصات: top = screenY(p.y)
 * React يرسم الهيكل مرة؛ حلقة rAF تحدّث style.top مباشرة
 * (صفر setState أثناء اللعب). القفز من أسفل إلى أعلى.
 * ============================================================
 */

export const GAME_W = 360;
export const GAME_H = 560;
export const WARAKI_W = 70;
export const WARAKI_H = Math.round((WARAKI_W * 130) / 90); // ≈ 101

/** فيزياء اللعبة — وحدات بكسل/ثانية (y يزيد للأعلى) */
const GRAVITY = 1450;
const JUMP_V = 780; // أقصى ارتفاع ≈ 209px
const HORIZ_SPEED = 260;
const PLATFORM_W = 90;
const PLATFORM_GAP_MIN = 90;
const PLATFORM_GAP_MAX = 150;
const OBSTACLE_CHANCE = 0.22;

export type Platform = {
  id: number;
  x: number;
  y: number;
  w: number;
  obstacle: boolean;
};

let pid = 0;

function makePlatform(y: number, allowObstacle = true): Platform {
  return {
    id: pid++,
    x: 12 + Math.random() * (GAME_W - PLATFORM_W - 24),
    y,
    w: PLATFORM_W,
    obstacle: allowObstacle && Math.random() < OBSTACLE_CHANCE,
  };
}

export function useWarakiJumpEngine() {
  const [status, setStatus] = useState<'playing' | 'lost'>('playing');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('mg_waraki_jump_best') || 0));

  /** منصات React (للرسم الأولي فقط) */
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const world = useRef({
    warakiX: GAME_W / 2,
    /** ارتفاع قدم ورقي فوق خط الأرض (يزيد للأعلى) */
    feetY: 40,
    vy: 0,
    camY: 0,
    playing: false,
    touchX: null as number | null,
    last: 0,
    platforms: [] as Platform[],
  });

  const heroRef = useRef<HTMLDivElement | null>(null);
  const platformEls = useRef(new Map<number, HTMLElement>());

  const reset = useCallback(() => {
    const w = world.current;
    w.warakiX = GAME_W / 2;
    w.feetY = 40;
    w.vy = 0;
    w.camY = 0;
    w.playing = true;
    w.touchX = null;
    w.last = 0;

    pid = 0;
    const list: Platform[] = [{ id: pid++, x: GAME_W / 2 - PLATFORM_W / 2, y: 40, w: PLATFORM_W, obstacle: false }];
    let y = 40;
    while (y < GAME_H * 3.4) {
      y += PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      list.push(makePlatform(y));
    }
    w.platforms = list;
    setPlatforms(list);
    setScore(0);
    setStatus('playing');
  }, []);

  const jump = useCallback(() => {
    const w = world.current;
    if (w.playing && w.vy === 0) {
      w.vy = JUMP_V;
      SoundFXManager.playClickBeep();
    }
  }, []);

  const setTouchX = useCallback((x: number | null) => {
    world.current.touchX = x;
  }, []);

  const registerPlatform = useCallback((id: number, el: HTMLDivElement | null) => {
    if (el) platformEls.current.set(id, el);
    else platformEls.current.delete(id);
  }, []);

  // ===== حلقة اللعب — منطق + رسم مباشر عبر style.top (صفر setState) =====
  useEffect(() => {
    reset();
    let raf = 0;
    const step = (t: number) => {
      const w = world.current;
      const dt = Math.min(0.032, (t - (w.last || t)) / 1000 || 0.016);
      w.last = t;

      if (w.playing) {
        // حركة أفقية نحو الإصبع
        if (w.touchX !== null) {
          const dx = w.touchX - w.warakiX;
          w.warakiX += Math.sign(dx) * Math.min(Math.abs(dx), HORIZ_SPEED * dt);
          w.warakiX = Math.max(24, Math.min(GAME_W - 14, w.warakiX));
        }
        // جاذبية (y يزيد للأعلى): vy موجبة = صعود
        w.vy -= GRAVITY * dt;
        const prevFeet = w.feetY;
        w.feetY += w.vy * dt;

        // هبوط عبر سطح منصة (vy سالبة = هابط)
        if (w.vy < 0) {
          for (const p of w.platforms) {
            if (
              w.warakiX > p.x - 6 &&
              w.warakiX < p.x + p.w + 8 &&
              prevFeet >= p.y &&
              w.feetY <= p.y
            ) {
              w.feetY = p.y;
              w.vy = 0;
              break;
            }
          }
        }

        // الكاميرا لأعلى فقط
        const targetCam = w.feetY - GAME_H * 0.62;
        if (targetCam > w.camY) w.camY = targetCam;

        // توليد منصات فوق الكاميرا + إزالة البعيدة (تحديث React نادر)
        const highest = w.platforms.reduce((m, p) => Math.max(m, p.y), 0);
        if (highest < w.camY + GAME_H * 1.6) {
          const newList = [...w.platforms];
          let y = highest;
          while (y < w.camY + GAME_H * 2.2) {
            y += PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
            newList.push(makePlatform(y));
          }
          // إزالة البعيدة أسفل الشاشة (خريطة DOM تُنظَّف تلقائيًا)
          const cutoff = w.camY - 200;
          w.platforms = newList.filter((p) => p.y > w.camY - 200 || p.id === newList[0]?.id);
          if (w.platforms.length !== newList.length) {
            w.platforms.unshift(newList[0]);
          }
          setPlatforms(w.platforms);
        }

        // تصادم العوائق — المكعب في منتصف المنصة: هبوط/وقوف فوقه = خسارة
        if (w.vy === 0) {
          for (const p of w.platforms) {
            if (p.obstacle && w.feetY === p.y) {
              const obstacleX = p.x + p.w / 2;
              if (Math.abs(w.warakiX - obstacleX) < 24) {
                w.playing = false;
                setStatus('lost');
              }
            }
          }
        }

        // خسارة — سقط تحت أسفل الشاشة
        if (w.feetY < w.camY - WARAKI_H) {
          w.playing = false;
          setStatus('lost');
        }
      }

      // ===== الرسم المباشر: كل شيء بإحداثيات شاشة =====
      // البطل: قدمه عند feetY — رأسه فوقها
      if (heroRef.current) {
        heroRef.current.style.top = `${GAME_H - (w.feetY - w.camY) - WARAKI_H}px`;
        heroRef.current.style.left = `${w.warakiX - WARAKI_W / 2}px`;
      }
      // المنصات
      platformEls.current.forEach((el, id) => {
        const p = w.platforms.find((q) => q.id === id);
        if (!p) return;
        const sy = GAME_H - (p.y - w.camY);
        el.style.top = `${sy}px`;
        el.style.visibility = sy > -80 && sy < GAME_H + 100 ? 'visible' : 'hidden';
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reset]);

  /** أفضل نتيجة + إعادة تلقائية عند الخسارة */
  useEffect(() => {
    if (status === 'lost') {
      const final = Math.max(0, Math.floor(world.current.camY / 10));
      setScore(final);
      if (final > best) {
        setBest(final);
        localStorage.setItem('mg_waraki_jump_best', String(final));
      }
      const t = setTimeout(() => reset(), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status, best, reset]);

  return { status, score, best, platforms, heroRef, registerPlatform, jump, setTouchX, reset };
}

