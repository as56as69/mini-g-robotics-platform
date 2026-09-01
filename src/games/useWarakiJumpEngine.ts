import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundFXManager } from '../ble/SoundFX';

/* ============================================================
 * كود ماجيك — نواة «لعبة ورقي» (Doodle Jump بالورق — بلا خسارة)
 *
 * الميكانيكا (قرارات المستخدم النهائية):
 * - قفز تلقائي: لحظة لمس أي منصة ينطلق ورقي للأعلى بحد ذاته،
 *   واللاعب يتحكم بالاتجاه فقط (لمس/سحب أفقي — استجابة فورية).
 * - القفزة دائمًا أعلى من المكعبات.
 * - بلا خسارة: عند ملامسة الحافة السفلية بقليل تظهر بالونة ترفعه
 *   لأقرب منصة — الكرات لا تُمسّ ولا شيء يُصفَّر.
 * - المكعبات تتحطم عند اللمس = بونص +2 كرة (بلا خطر).
 * - الكرات اللونية نظام التقدم الوحيد: كل 10 كرات → ثيم خلفية
 *   جديد (ورق + شمس بلون/مكان مختلف + غيوم بأماكن جديدة).
 * إحداثيات شاشة مباشرة: heroTop = GAME_H - (feetY - camY) - H.
 * حلقة rAF تحرّك DOM مباشرة — صفر setState أثناء اللعب.
 * ============================================================
 */

export const GAME_W = 360;
export const GAME_H = 560;
export const WARAKI_W = 76;
export const WARAKI_H = Math.round((WARAKI_W * 130) / 90); // ≈ 110

/** فيزياء — y يزيد للأعلى */
const GRAVITY = 1450;
const JUMP_V = 820; // ذروة ≈ 232px — أعلى من المكعبات دائمًا
const HORIZ_SPEED = 340; // تحكم سريع بالاتجاه
const PLATFORM_W = 90;
const PLATFORM_GAP_MIN = 85;
const PLATFORM_GAP_MAX = 130;
const CUBE_CHANCE = 0.3;
const ORB_CHANCE = 0.6; // كرة فوق منصة
const FLOAT_ORB_CHANCE = 0.35; // كرة عائمة في الفجوة
const LIFT_SPEED = 240; // سرعة رفع البالونة
/** عتبة الإنقاذ: وقوف feetY تحت الشاشة بهذا العمق = بالونة */
const RESCUE_LINE = WARAKI_H * 0.55;
/** نصف قطر جمع الكرة (بكسل) */
const ORB_PICK_R = 30;

export type Platform = {
  id: number;
  x: number;
  y: number;
  w: number;
  /** مكعب على المنصة — يتحطم عند اللمس ويمنح بونص */
  cube: boolean;
  cubeTaken: boolean;
};

export type Orb = {
  id: number;
  x: number; // مركز الكرة
  y: number;
  colorIdx: number;
  taken: boolean;
};

let pid = 0;
let oid = 0;

function makePlatform(y: number, allowCube = true): Platform {
  return {
    id: pid++,
    x: 12 + Math.random() * (GAME_W - PLATFORM_W - 24),
    y,
    w: PLATFORM_W,
    cube: allowCube && Math.random() < CUBE_CHANCE,
    cubeTaken: false,
  };
}

function makeOrb(x: number, y: number): Orb {
  return { id: oid++, x, y, colorIdx: Math.floor(Math.random() * 6), taken: false };
}

function cubeX(p: Platform): number {
  return p.x + p.w / 2;
}

export function useWarakiJumpEngine() {
  /** React state — تحديثات نادرة (جمع كرة / ثيم / إنقاذ / توليد) */
  const [orbCount, setOrbCount] = useState(0);
  const [counterKey, setCounterKey] = useState(0);
  const [rescuing, setRescuing] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [orbs, setOrbs] = useState<Orb[]>([]);

  const world = useRef({
    warakiX: GAME_W / 2,
    feetY: 40,
    vy: 0,
    camY: 0,
    playing: true,
    rescuing: false,
    rescueTargetY: 0,
    touchX: null as number | null,
    last: 0,
    platforms: [] as Platform[],
    orbs: [] as Orb[],
    /** خرائط id → بيانات للوصول السريع في الحلقة */
    platformMap: new Map<number, Platform>(),
    orbMap: new Map<number, Orb>(),
  });

  const heroRef = useRef<HTMLDivElement | null>(null);
  const balloonRef = useRef<HTMLDivElement | null>(null);
  const platformEls = useRef(new Map<number, HTMLElement>());
  const orbEls = useRef(new Map<number, HTMLElement>());

  const registerPlatform = useCallback((id: number, el: HTMLDivElement | null) => {
    if (el) platformEls.current.set(id, el);
    else platformEls.current.delete(id);
  }, []);

  const registerOrb = useCallback((id: number, el: HTMLDivElement | null) => {
    if (el) orbEls.current.set(id, el);
    else orbEls.current.delete(id);
  }, []);

  const setTouchX = useCallback((x: number | null) => {
    world.current.touchX = x;
  }, []);

  const reset = useCallback(() => {
    const w = world.current;
    w.warakiX = GAME_W / 2;
    w.feetY = 40;
    w.vy = JUMP_V; // ينطلق بقفزة أولى فورًا — قفز ذاتي كامل
    w.camY = 0;
    w.playing = true;
    w.rescuing = false;
    w.touchX = null;
    w.last = 0;
    pid = 0;
    oid = 0;

    const list: Platform[] = [
      { id: pid++, x: GAME_W / 2 - PLATFORM_W / 2, y: 40, w: PLATFORM_W, cube: false, cubeTaken: false },
    ];
    const orbList: Orb[] = [];
    let y = 40;
    while (y < GAME_H * 3.6) {
      y += PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      const p = makePlatform(y);
      list.push(p);
      if (Math.random() < ORB_CHANCE) {
        orbList.push(makeOrb(p.x + p.w / 2, p.y + 55));
      }
      if (Math.random() < FLOAT_ORB_CHANCE) {
        orbList.push(makeOrb(24 + Math.random() * (GAME_W - 46), p.y + 45 + Math.random() * 22));
      }
    }
    w.platforms = list;
    w.orbs = orbList;
    w.platformMap = new Map(list.map((p) => [p.id, p]));
    w.orbMap = new Map(orbList.map((o) => [o.id, o]));
    setPlatforms(list);
    setOrbs(orbList);
    setOrbCount(0);
    setRescuing(false);
  }, []);

  /** جمع كرات — تحديث React نادر (عند الالتقاط فقط) */
  const collectOrb = useCallback((n: number) => {
    setOrbCount((prev) => prev + n);
    setCounterKey((k) => k + 1);
  }, []);

  // ===== حلقة اللعب — قفز ذاتي + إنقاذ + جمع (DOM مباشر، صفر setState/إطار) =====
  useEffect(() => {
    let raf = 0;
    const step = (t: number) => {
      const w = world.current;
      const dt = Math.min(0.032, (t - (w.last || t)) / 1000 || 0.016);
      w.last = t;

      if (w.playing) {
        // توجيه أفقي — يعمل أثناء اللعب والإنقاذ على السواء
        if (w.touchX !== null) {
          const dx = w.touchX - w.warakiX;
          w.warakiX += Math.sign(dx) * Math.min(Math.abs(dx), HORIZ_SPEED * dt);
          w.warakiX = Math.max(26, Math.min(GAME_W - 14, w.warakiX));
        }

        if (w.rescuing) {
          // ===== بالونة الإنقاذ: صعود بثبات نحو المنصة الهدف =====
          w.feetY += LIFT_SPEED * dt;
          if (w.feetY >= w.rescueTargetY) {
            w.feetY = w.rescueTargetY;
            w.rescuing = false;
            setRescuing(false);
            w.vy = JUMP_V; // ينطلق فورًا — قفز ذاتي
          }
        } else {
          // جاذبية + قفز ذاتي
          w.vy -= GRAVITY * dt;
          const prevFeet = w.feetY;
          w.feetY += w.vy * dt;

          if (w.vy < 0) {
            for (const p of w.platforms) {
              if (
                w.warakiX > p.x - 6 &&
                w.warakiX < p.x + p.w + 8 &&
                prevFeet >= p.y &&
                w.feetY <= p.y
              ) {
                w.feetY = p.y;
                // لمس مكعب؟ — يتحطم + بونص (بلا خسارة إطلاقًا)
                if (p.cube && !p.cubeTaken && Math.abs(w.warakiX - cubeX(p)) < 24) {
                  p.cubeTaken = true;
                  const el = platformEls.current.get(p.id);
                  const fx = el?.querySelector('[data-cube]');
                  if (fx) fx.classList.add('cube-shatter');
                  SoundFXManager.playPaperTorn();
                  collectOrb(2);
                }
                // ===== القفز الذاتي — ينطلق بحد ذاته فورًا =====
                w.vy = JUMP_V;
                break;
              }
            }
          }
        }

        // الكاميرا لأعلى فقط
        const targetCam = w.feetY - GAME_H * 0.62;
        if (targetCam > w.camY) w.camY = targetCam;

        // إنقاذ البالونة — فقط عند ملامسة الحافة السفلية بقليل
        if (!w.rescuing && w.feetY < w.camY - RESCUE_LINE) {
          w.rescuing = true;
          setRescuing(true);
          const above = w.platforms
            .filter((p) => p.y > w.camY + 30)
            .sort((a, b) => a.y - b.y)[0];
          w.rescueTargetY = above ? above.y : w.camY + 90;
          SoundFXManager.playPowerUp();
        }

        // جمع الكرات (فحص مسافة — بلا setState لكل إطار)
        const heroCx = w.warakiX;
        const heroCy = w.feetY + WARAKI_H * 0.45;
        for (const o of w.orbs) {
          if (o.taken) continue;
          const dx = heroCx - o.x;
          const dy = heroCy - o.y;
          if (dx * dx + dy * dy < 28 * 28) {
            o.taken = true;
            const el = orbEls.current.get(o.id);
            if (el) {
              el.classList.add('mc-orb-pop');
              window.setTimeout(() => {
                el.style.visibility = 'hidden';
              }, 360);
            }
            SoundFXManager.playClickBeep();
            collectOrb(1);
          }
        }

        // توليد منصات + كرات فوق الكاميرا (تحديث React نادر)
        const highest = w.platforms.reduce((m, p) => Math.max(m, p.y), 0);
        if (highest < w.camY + GAME_H * 1.6) {
          let y = highest;
          const newP: Platform[] = [];
          const newO: Orb[] = [];
          while (y < w.camY + GAME_H * 2.2) {
            y += PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
            const p = makePlatform(y);
            newP.push(p);
            w.platformMap.set(p.id, p);
            if (Math.random() < ORB_CHANCE) {
              newO.push(makeOrb(p.x + p.w / 2, p.y + 55));
            }
            if (Math.random() < FLOAT_ORB_CHANCE) {
              newO.push(makeOrb(24 + Math.random() * (GAME_W - 48), y + 42 + Math.random() * 24));
            }
          }
          w.platforms = [...w.platforms, ...newP];
          w.orbs = [...w.orbs, ...newO];
          for (const o of newO) w.orbMap.set(o.id, o);
          setPlatforms(w.platforms);
          setOrbs(w.orbs);
        }
      }

      // ===== الرسم المباشر (كل إطار — DOM فقط) =====
      if (heroRef.current) {
        heroRef.current.style.top = `${GAME_H - (w.feetY - w.camY) - WARAKI_H}px`;
        heroRef.current.style.left = `${w.warakiX - WARAKI_W / 2}px`;
      }
      if (balloonRef.current) {
        balloonRef.current.style.opacity = w.rescuing ? '1' : '0';
      }
      platformEls.current.forEach((el, id) => {
        const p = w.platformMap.get(id);
        if (!p) return;
        const sy = GAME_H - (p.y - w.camY);
        el.style.top = `${sy}px`;
        el.style.visibility = sy > -90 && sy < GAME_H + 110 ? 'visible' : 'hidden';
      });
      orbEls.current.forEach((el, id) => {
        const o = w.orbMap.get(id);
        if (!o) return;
        if (o.taken) return; // الإخفاء يتكفل به تأثير الالتقاط
        const sy = GAME_H - (o.y - w.camY);
        el.style.top = `${sy}px`;
        el.style.visibility = sy > -40 && sy < GAME_H + 80 ? 'visible' : 'hidden';
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    orbCount,
    themeIndex: Math.floor(orbCount / 10) % 4,
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
  };
}

