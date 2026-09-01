import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundFXManager } from '../ble/SoundFX';

/* ============================================================
 * كود ماجيك — نواة «لعبة ورقي» (Doodle Jump بالورق)
 * معمارية صارمة: React يرسم الهيكل مرة واحدة، وحلقة rAF
 * تحرّك عناصر DOM مباشرة بـ transform (صفر setState أثناء
 * اللعب). نظام الإحداثيات: y يزيد للأعلى، الكاميرا camY.
 * المنصات: داخل طبقة عالم بإحداثيات عالم — الطبقة كلها
 * تنزلق بـ translateY(camY) وورقي فوقها بإحداثياته.
 * ============================================================
 */

export const GAME_W = 360;
export const GAME_H = 560;
/** أبعاد سبيريت ورقي داخل الطبقة */
export const WARAKI_W = 70;
export const WARAKI_H = Math.round((WARAKI_W * 130) / 90);

/** فيزياء اللعبة — وحدات بكسل/ثانية (نظام y يزيد للأعلى) */
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

interface PlatformNode extends Platform {
  /** عنصر DOM الخاص بالمنصة — الرسم عبره مباشرة */
  el: HTMLDivElement | null;
}

let pid = 0;

function makePlatform(y: number): Platform {
  return {
    id: pid++,
    x: 12 + Math.random() * (GAME_W - PLATFORM_W - 24),
    y,
    w: PLATFORM_W,
    obstacle: Math.random() < OBSTACLE_CHANCE,
  };
}

export function useWarakiJumpEngine() {
  const [status, setStatus] = useState<'playing' | 'lost'>('playing');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('mg_waraki_jump_best') || 0));

  /** نسخة React من المنصات للرسم الأولي — الحلقة تضيف للخريطة مباشرة */
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const world = useRef({
    warakiX: GAME_W / 2,
    warakiY: 40,
    vy: 0,
    camY: 0,
    playing: false,
    touchX: null as number | null,
    last: 0,
    platforms: [] as PlatformNode[],
  });

  const layerRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  /** عناصر DOM للمنصات — الحلقة تُخفي ما خرج عن الشاشة */
  const platformEls = useRef(new Map<number, HTMLElement>());

  const reset = useCallback(() => {
    const w = world.current;
    w.warakiX = GAME_W / 2;
    w.warakiY = 40;
    w.vy = 0;
    w.camY = 0;
    w.playing = true;
    w.touchX = null;
    w.last = 0;

    pid = 0;
    const list: PlatformNode[] = [];
    list.push({ id: pid++, x: GAME_W / 2 - PLATFORM_W / 2, y: 40, w: PLATFORM_W, obstacle: false, el: null });
    let y = 40;
    while (y < GAME_H * 3.2) {
      y += PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      list.push({ ...makePlatform(y), el: null });
    }
    world.current.platforms = list;
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

  /** ربط عنصر DOM لمنصة — تُستدعى من ref في المكون */
  const registerPlatform = useCallback((id: number, el: HTMLDivElement | null) => {
    if (el) platformEls.current.set(id, el);
    else platformEls.current.delete(id);
  }, []);

  // ===== حلقة اللعب + الرسم (DOM مباشر — صفر setState أثناء اللعب) =====
  useEffect(() => {
    reset();
    let raf = 0;
    const step = (t: number) => {
      const w = world.current;
      const dt = Math.min(0.032, (t - (w.last || t)) / 1000 || 0.016);
      w.last = t;

      if (w.playing) {
        if (w.touchX !== null) {
          const dx = w.touchX - w.warakiX;
          w.warakiX += Math.sign(dx) * Math.min(Math.abs(dx), HORIZ_SPEED * dt);
          w.warakiX = Math.max(14, Math.min(GAME_W - 14, w.warakiX));
        }
        w.vy -= GRAVITY * dt;
        const prevFeet = w.warakiY;
        w.warakiY += w.vy * dt;

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

        const targetCam = w.warakiY - GAME_H * 0.62;
        if (targetCam > w.camY) w.camY = targetCam;

        // توليد منصات جديدة (تحديث React نادر — مرة كل ~منصة)
        const highest = w.platforms.reduce((m, p) => Math.max(m, p.y), 0);
        if (highest < w.camY + GAME_H * 1.6) {
          w.platforms.push({ ...makePlatform(highest + PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN)), el: null });
          setPlatforms([...w.platforms]);
        }

        // خسارة
        if (w.warakiY < w.camY - WARAKI_H - 40) {
          w.playing = false;
          setScore(Math.floor(w.camY / 10));
          setStatus('lost');
        }
      }

      // ===== الرسم المباشر =====
      const layer = layerRef.current;
      if (layer) {
        layer.style.transform = `translateY(${w.camY}px)`;
      }
      if (heroRef.current) {
        // داخل الطبقة المزاحة: y الشاشة = -(warakiY) + camY (نظام y-up)
        heroRef.current.style.transform = `translate(${w.warakiX - WARAKI_W / 2}px, ${-(w.warakiY - w.camY)}px)`;
      }
      // إظهار/إخفاء المنصات حسب موقعها من الكاميرا
      platformEls.current.forEach((el, id) => {
        const p = w.platforms.find((q) => q.id === id);
        if (!p) return;
        const screenY = GAME_H - (p.y - w.camY);
        el.style.top = `${screenY}px`;
        el.style.visibility = screenY > -60 && screenY < GAME_H + 80 ? 'visible' : 'hidden';
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reset]);

  useEffect(() => {
    if (status === 'lost') {
      const final = Math.floor(world.current.camY / 10);
      setScore(final);
      if (final > best) {
        setBest(final);
        localStorage.setItem('mg_waraki_jump_best', String(final));
      }
      const t = setTimeout(() => reset(), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status, reset]);

  return { status, score, best, platforms, layerRef, heroRef, registerPlatform, jump, setTouchX, reset };
}
