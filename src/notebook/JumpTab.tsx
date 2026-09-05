import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useNotebook } from './notebookContext';
import type { ShopState } from './utils';

/* كود ماجيك بالتفت — لعبة "قفز حرفوش" 🐲 (Qdood-Jump خفيف للأطفال)
 * ============================================================
 * - قفز مستمر بلا نهاية على غيوم كثيفة (سهلة، كثيرة الحواجز)
 * - تحريك يمين/يسار فقط (لمس + أسهم + مسح)
 * - اختيار بين حرفين يظهر بين الحين والآخر (صح = طيران عالٍ، خطأ = إعادة آمنة)
 * - كل 5 اختيارات مُنجَزة → تتغير المرحلة (خلفية + ألوان الحواجز)
 * - لا خسارة: من يسقط للأسفل ترفعه «النُّفّاخة» 🎈 تحمل حرفًا وتمضي اللعبة
 * - جمع نجوم ملونة → صرفها في متجر قبعات/خلفيات
 * الصوت: Web Audio (بدون ملفات)
 * ============================================================
 */

interface Props { letters: string[]; onBack: () => void; }

/* ══════ ثوابت الفيزياء ══════ */
const W = 360, H = 640;
const GRAVITY = 0.42;
const JUMP_VY = -12.5;
const MEGA_VY = -20.5;
const MAX_FALL_VY = 9;          // نزول أبطأ (طفو) لسهولة التحكم
const MOVE_SPEED = 6;
const PR = 17;                  // نصف قطر اللاعب
const STEP = 55;                // حواجز أكثر (كان 70)
const PLAT_W = 84;              // حواجز أعرض (كان 66)
const LETTER_W = 62;            // دوائر الحروف
const GATE_EVERY = 5;           // اختيار حرف كل 5 حواجز (أبكر وأكثر ظهورًا)
const FIRST_GATE_AT = 3;        // أول اختيار يظهر مبكرًا عند الحاجز 3
const SOLVED_PER_STAGE = 5;     // اكتمال مرحلة بعد 5 اختيارات

/* ══════ مراحل العالم المتغيّرة (الخلفية + مظهر الحواجز) ══════ */
const STAGES = [
  { bg: 'sky', name: 'سماء', plat: '#c9b6ff', edge: '#6c5ce7', line: '#5a4bbf' },
  { bg: 'bg_garden', name: 'الحديقة', plat: '#a9dfbf', edge: '#1e8449', line: '#145a32' },
  { bg: 'bg_sunset', name: 'الغروب', plat: '#f5cba7', edge: '#e67e22', line: '#ca6f1e' },
  { bg: 'bg_sea', name: 'البحر', plat: '#aed6f1', edge: '#1f618d', line: '#154360' },
  { bg: 'bg_night', name: 'الليل', plat: '#b2a0ed', edge: '#6c3483', line: '#512e5f' },
  { bg: 'bg_rainbow', name: 'قوس قزح', plat: '#f9e79f', edge: '#d68910', line: '#b9770e' },
];

/* ══════ المتجر ══════ */
interface ShopItem { id: string; name: string; emoji: string; cost: number; type: 'hat' | 'bg'; }
const SHOP_ITEMS: ShopItem[] = [
  { id: 'hat_crayon', name: 'قبعة شمعية', emoji: '👑', cost: 5, type: 'hat' },
  { id: 'hat_turban', name: 'عمامة بغدادية', emoji: '🧕', cost: 8, type: 'hat' },
  { id: 'hat_star', name: 'قبعة نجمة', emoji: '⭐', cost: 10, type: 'hat' },
  { id: 'hat_crown', name: 'تاج الملك', emoji: '🤴', cost: 15, type: 'hat' },
  { id: 'bg_sunset', name: 'شمس بغداد الغاربة', emoji: '🌇', cost: 8, type: 'bg' },
  { id: 'bg_garden', name: 'حديقة الحروف', emoji: '🌳', cost: 12, type: 'bg' },
  { id: 'bg_sea', name: 'بحر الأمواج', emoji: '🌊', cost: 18, type: 'bg' },
  { id: 'bg_night', name: 'ليلة دجلة', emoji: '🌙', cost: 15, type: 'bg' },
  { id: 'bg_rainbow', name: 'قوس قزح', emoji: '🌈', cost: 20, type: 'bg' },
];

/* ══════ نظام الصوت ══════ */
function makeSound() {
  let ctx: AudioContext | null = null;
  const AC = typeof window !== 'undefined'
    ? (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
    : undefined;
  const ac = () => {
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };
  const tone = (freq: number, start: number, dur: number, type: OscillatorType, gain: number) => {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    const t0 = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  };
  return {
    unlock() { const c = ac(); if (c && c.state === 'suspended') void c.resume(); },
    correct() { tone(523, 0, 0.14, 'triangle', 0.2); tone(659, 0.1, 0.14, 'triangle', 0.2); tone(784, 0.2, 0.28, 'triangle', 0.2); },
    stageUp() { tone(523, 0, 0.12, 'triangle', 0.2); tone(659, 0.1, 0.12, 'triangle', 0.2); tone(784, 0.2, 0.12, 'triangle', 0.2); tone(1047, 0.3, 0.35, 'triangle', 0.25); },
    coin() { tone(988, 0, 0.12, 'sine', 0.18); tone(1319, 0.09, 0.2, 'sine', 0.18); },
    retry() { tone(330, 0, 0.12, 'sine', 0.12); tone(247, 0.1, 0.14, 'sine', 0.12); },
    rescue() { tone(392, 0, 0.16, 'sine', 0.16); tone(523, 0.16, 0.22, 'sine', 0.16); },
    jump() { tone(392, 0, 0.1, 'sine', 0.1); },
    buy() { tone(660, 0, 0.1, 'square', 0.12); tone(880, 0.1, 0.22, 'square', 0.12); },
  };
}

/* ══════ أدوات رسم مساعدة ══════ */
function traceStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/* ══════ رسم Sprite حرفوش خفيف ══════ */
function drawHarfoosh(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, hat: string, wobble: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(wobble) * 0.12);
  ctx.lineWidth = 2; ctx.strokeStyle = '#2b2a33';
  ctx.fillStyle = '#ffd93d';
  ctx.beginPath(); ctx.moveTo(-7, -16); ctx.lineTo(0, -33); ctx.lineTo(7, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#a78bfa';
  ctx.beginPath(); ctx.ellipse(-14, -7, 7, 13, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(14, -7, 7, 13, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(-8, 16, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(8, 16, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, 2, PR - 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 9, 9, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a3f8a';
  ctx.beginPath(); ctx.ellipse(2, 11, 6, 4, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#ff8fab';
  ctx.beginPath(); ctx.arc(-13, 5, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(13, 6, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-7, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2a33'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(-7, 0, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(7, 0, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#2b2a33';
  ctx.beginPath(); ctx.arc(-7, 1, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, 1, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-8, 0, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, 0, 1, 0, Math.PI * 2); ctx.fill();
  drawHat(ctx, hat);
  ctx.strokeStyle = '#2b2a33'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-PR + 4, 4, 8, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.font = '10px Cairo, sans-serif'; ctx.fillText('🎒', -PR + 1, 1);
  ctx.restore();
}

function drawHat(ctx: CanvasRenderingContext2D, hat: string) {
  ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = '#2b2a33';
  switch (hat) {
    case 'hat_crayon':
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath(); ctx.moveTo(-10, -20); ctx.lineTo(0, -41); ctx.lineTo(10, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case 'hat_turban':
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath(); ctx.ellipse(0, -22, 13, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#27ae60';
      ctx.beginPath(); ctx.arc(0, -27, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    case 'hat_star':
      ctx.fillStyle = '#fdcb6e'; traceStar(ctx, 0, -26, 9, 5); ctx.fill(); ctx.stroke();
      break;
    case 'hat_crown':
      ctx.fillStyle = '#f9ca24';
      ctx.beginPath();
      ctx.moveTo(-11, -18); ctx.lineTo(-11, -30); ctx.lineTo(-5, -23); ctx.lineTo(0, -31); ctx.lineTo(5, -23); ctx.lineTo(11, -30); ctx.lineTo(11, -18); ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    default: break;
  }
  ctx.restore();
}

/* ══════ رسم الخلفيات ══════ */
function drawBackground(ctx: CanvasRenderingContext2D, bg: string, scroll: number) {
  const mod = (v: number, m: number) => ((v % m) + m) % m;
  ctx.fillStyle = '#fffdf7'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(180,160,220,0.16)'; ctx.lineWidth = 1;
  const off = mod(scroll, 28);
  for (let y = -off; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(108,92,231,0.06)'; ctx.fillRect(0, 0, 18, H);
  switch (bg) {
    case 'bg_sunset': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#ff9f43'); g.addColorStop(1, '#ff6b6b');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(253,203,110,0.9)';
      ctx.beginPath(); ctx.arc(W / 2, H - 50, 75, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bg_garden': {
      for (let i = 0; i < 7; i++) {
        const x = (i * 60 + mod(scroll * 0.6, 60)) - 20;
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(x, H - 90, 22, 90);
        ctx.fillStyle = '#27ae60';
        ctx.beginPath(); ctx.arc(x + 11, H - 96, 20, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'bg_sea': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#79b8ff'); g.addColorStop(0.5, '#3da9f5'); g.addColorStop(1, '#0a5cc8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffeaa7';
      ctx.beginPath(); ctx.arc(312, 74, 26, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = 'rgba(253,203,110,0.5)';
        ctx.beginPath(); ctx.arc(312 + i * 9, 74 - i * 9, 22 - i * 5, 0, Math.PI * 2); ctx.fill();
      }
      for (let band = 0; band < 3; band++) {
        const wy = H - 78 + band * 26;
        ctx.fillStyle = band === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.moveTo(0, wy);
        for (let x = 0; x <= W; x += 22) ctx.quadraticCurveTo(x + 11, wy - 11, x + 22, wy);
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(30 + i * 70 + ((scroll * 0.25) % 40), H - 40 + (i % 2) * 18, 5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'bg_night': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2c3e50'); g.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fdcb6e';
      ctx.beginPath(); ctx.arc(mod(scroll * 0.2, W), 70, 22, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 16; i++) { ctx.fillStyle = '#fff'; ctx.fillRect((i * 29) % W, (i * 47) % H, 2, 2); }
      break;
    }
    case 'bg_rainbow': {
      const cols = ['#ff6b6b', '#fdcb6e', '#2ecc71', '#54a0ff', '#9b59b6'];
      cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, (H / cols.length) * i, W, H / cols.length); });
      break;
    }
    default: {
      ctx.fillStyle = 'rgba(253,203,110,0.5)';
      ctx.beginPath(); ctx.arc(318, 60, 24, 0, Math.PI * 2); ctx.fill();
      break;
    }
  }
}

/* ══════ الأنواع ══════ */
interface Platform { x: number; y: number; w: number; kind: 'normal' | 'letter'; letter?: string; isTarget?: boolean; broken: boolean; }
interface StarObj { x: number; y: number; c: string; taken: boolean; }
interface Balloon { x: number; y: number; letter: string; }

/* ══════ المكوّن ══════ */
const JumpTab: React.FC<Props> = ({ letters, onBack }) => {
  const { stars, addStars } = useNotebook();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<{ start: () => void } | null>(null);
  const keys = useRef({ left: false, right: false });
  const scoreRef = useRef(0);
  const sessionStars = useRef(0);
  const statusRef = useRef<'idle' | 'playing'>('idle');
  const hatRef = useRef('none');
  const bgRef = useRef('sky');
  const soundRef = useRef(true);
  const sfxRef = useRef<ReturnType<typeof makeSound> | null>(null);
  const pendingBuyRef = useRef(false);

  const [shop, setShop] = useState<ShopState>(() => {
    try {
      const raw = localStorage.getItem('mg_harfoosh_shop');
      if (raw) return JSON.parse(raw);
    } catch { /* noop */ }
    return { owned: [], equippedHat: 'none', equippedBg: 'sky' };
  });
  const [status, setStatus] = useState<'idle' | 'playing'>('idle');
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem('mg_harfoosh_best') || 0));
  const [soundOn, setSoundOn] = useState(true);
  const [target, setTarget] = useState<string>('');
  const [hud, setHud] = useState({ score: 0, stage: 1, stageName: 'سماء', solved: 0, rescues: 0 });

  const list = useMemo(() => (letters && letters.length ? letters : ['أ', 'ب', 'ت']), [letters]);

  if (!sfxRef.current) sfxRef.current = makeSound();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { keys.current.left = true; keys.current.right = false; }
      if (e.key === 'ArrowRight') { keys.current.right = true; keys.current.left = false; }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.current.left = false;
      if (e.key === 'ArrowRight') keys.current.right = false;
    };
    const clearKeys = () => { keys.current.left = false; keys.current.right = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clearKeys);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clearKeys);
    };
  }, []);

  // عكس الحالات الحالية إلى refs تُقرأ داخل حلقة اللعبة
  statusRef.current = status;
  hatRef.current = shop.equippedHat;
  // أثناء اللعب تُدار الخلفية بمراحل العالم (لا نمسحها بخلفية المتجر)
  if (statusRef.current !== 'playing') bgRef.current = shop.equippedBg || 'sky';
  soundRef.current = soundOn;

  const persistShop = useCallback((s: ShopState) => {
    setShop(s);
    try { localStorage.setItem('mg_harfoosh_shop', JSON.stringify(s)); } catch { /* noop */ }
  }, []);

  const buy = (item: ShopItem) => {
    if (pendingBuyRef.current) return;
    if (shop.owned.includes(item.id) || stars < item.cost) return;
    pendingBuyRef.current = true;
    addStars(-item.cost);
    persistShop({ ...shop, owned: [...shop.owned, item.id] });
    if (sfxRef.current && soundOn) sfxRef.current.buy();
    setTimeout(() => { pendingBuyRef.current = false; }, 250);
  };

  const equip = (itemId: string, type: 'hat' | 'bg') => {
    persistShop(type === 'hat' ? { ...shop, equippedHat: itemId } : { ...shop, equippedBg: itemId });
  };

  /* ══════ الحلقة الرئيسية ══════ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sfx = sfxRef.current;

    let raf = 0;
    let alive = true;
    let frameCount = 0;

    // حالة اللعبة (داخل الحلقة)
    let px = W / 2, py = H - 120, vy = 0, camY = 0, phase = 0, front = 0, maxClimb = 0;
    let stage = 0, solved = 0, rescues = 0;
    let platforms: Platform[] = [];
    let starsArr: StarObj[] = [];
    let spawnCount = 0;
    let bodyColor = '#6c5ce7';
    let pal = STAGES[0];
    let rescuing = false, rescueT = 0;
    let balloon: Balloon = { x: W / 2, y: H + 40, letter: 'أ' };
    const BODY_COLORS = ['#6c5ce7', '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    const STAR_COLORS = ['#FF4B4B', '#F39C12', '#2EA44F', '#2E86DE', '#9B59B6', '#E91E63'];
    const anchor = H * 0.45;

    /* ── المساعدون ── */
    const letterColor = (l: string) => {
      const i = list.indexOf(l);
      return i >= 0 ? BODY_COLORS[i % BODY_COLORS.length] : '#6c5ce7';
    };

    const pickRound = (): [string, string] => {
      const t = list[Math.floor(Math.random() * list.length)];
      const rest = list.filter((c) => c !== t);
      const d = rest.length ? rest[Math.floor(Math.random() * rest.length)] : 'أ';
      return [t, d];
    };

    const addPlatform = (y: number, kind: 'normal' | 'letter' = 'normal', letter?: string, isTarget?: boolean, xC?: number) => {
      const w = kind === 'letter' ? LETTER_W : PLAT_W;
      const x = xC ?? (10 + Math.random() * (W - w - 20));
      platforms.push({ x, y, w, kind, letter, isTarget, broken: false });
    };

    /* زوج منصّتي حروف جنبًا إلى جنب قرب المنتصف لسهولة الاختيار */
    const addLetterPair = (y: number, t: string, d: string) => {
      const left = Math.random() < 0.5 ? t : d;
      const right = left === t ? d : t;
      addPlatform(y, 'letter', left, left === t, 76);
      addPlatform(y, 'letter', right, right === t, 224);
    };

    const addStar = (y: number, x?: number) => {
      starsArr.push({ x: x ?? (10 + Math.random() * (W - 20)), y, c: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)], taken: false });
    };

    /* البناء المشترك: حواجز أصلب (55) + من باب الحين: «اختيار حرفين»
     * - الزوج فوق الحاجز الحالي بـ120 (يُدرك بقفزة عادية)
     * - الحرف الصحيح = نجاح فوري: يتحوَّل الزوج لغُيمة ويُحسب الحرف وتنطلق القفزة السحرية
     * - «منصة النجاح» فوقها بـ250 منصّة هبوط (تُدرك فقط بالقفزة السحرية بعد الاختيار الصحيح)
     */
    const spawnNext = () => {
      phase++;
      if (phase === FIRST_GATE_AT || (phase - FIRST_GATE_AT) % GATE_EVERY === 0) {
        const pair = pickRound();
        const pairY = front - 120;
        addLetterPair(pairY, pair[0], pair[1]);
        addStar(pairY - 148, 10 + Math.random() * (W - 20));
        front -= 370;
        platforms.push({ x: 10 + Math.random() * (W - PLAT_W - 20), y: front, w: PLAT_W, kind: 'normal', broken: false });
        addStar(front - 34, 10 + Math.random() * (W - 20)); // نجمة فوق منصّة النجاح: يملأ الفراغ البصري بعد القفزة السحرية
      } else {
        front -= STEP;
        if (spawnCount < 6) {
          // بداية مضمونة: حواجز أولى قرب منتصف الشاشة ليبدأ التسلق فورًا بسلاسة
          addPlatform(front, 'normal', undefined, undefined, W / 2 - PLAT_W / 2 + (spawnCount % 3 - 1) * 65);
        } else {
          addPlatform(front, 'normal');
        }
        spawnCount++;
        if (Math.random() < 0.35) addStar(front - 28);
      }
    };

    const reset = () => {
      platforms = []; starsArr = [];
      px = W / 2; py = H - 120; vy = 0; camY = 0; phase = 0; maxClimb = 0;
      bodyColor = '#6c5ce7';
      rescuing = false; rescueT = 0; rescues = 0; stage = 0; solved = 0;
      pal = STAGES[0];
      bgRef.current = STAGES[0].bg; // أثناء اللعب: خلفية المرحلة، لا خلفية المتجر
      addPlatform(H - 20, 'normal', undefined, undefined, (W - PLAT_W) / 2);
      front = H - 20;
      spawnCount = 0;
      for (let i = 0; i < 22; i++) spawnNext();
    };

    const nearestLetterPlat = (): Platform | null => {
      const candidates = platforms.filter((p) => p.kind === 'letter' && p.isTarget && !p.broken);
      if (!candidates.length) return null;
      let ahead: Platform | null = null;
      for (const c of candidates) {
        if (c.y <= py + 60 && (!ahead || c.y < ahead.y)) ahead = c;
      }
      if (ahead) return ahead;
      let best: Platform | null = null;
      for (const c of candidates) {
        if (!best || Math.abs(c.y - py) < Math.abs(best.y - py)) best = c;
      }
      return best;
    };

    const nearestTarget = (): string | null => nearestLetterPlat()?.letter ?? null;

    /* سهم متمايل فوق الحرف المطلوب (حثّ بصري) */
    const drawHint = (p: Platform) => {
      const sy = p.y - camY;
      if (sy < 34 || sy > H + 10) return;
      const cx = p.x + p.w / 2;
      const bob = Math.sin(frameCount / 9) * 4;
      const hy = sy - p.w / 2 - 32 + bob;
      ctx.fillStyle = '#ffd93d';
      ctx.strokeStyle = '#6c5ce7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 8, hy + 10); ctx.lineTo(cx + 8, hy + 10); ctx.lineTo(cx, hy); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.font = "900 16px 'Cairo', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = pal.edge;
      ctx.fillText(p.letter || '', cx, hy - 3);
      ctx.textAlign = 'left';
    };

    const startGame = () => {
      sfxRef.current?.unlock();
      reset();
      scoreRef.current = 0;
      sessionStars.current = 0;
      setTarget(nearestTarget() ?? '');
      setHud({ score: 0, stage: 1, stageName: STAGES[0].name, solved: 0, rescues: 0 });
      statusRef.current = 'playing';
      setStatus('playing');
    };

    const bestRef = { value: Number(localStorage.getItem('mg_harfoosh_best') || 0) };
    apiRef.current = { start: startGame };

    /* إكمال مرحلة: خلفية + مظهر حواجز جديدين */
    const advanceStage = () => {
      stage = (stage + 1) % STAGES.length;
      solved = 0;
      pal = STAGES[stage];
      bgRef.current = STAGES[stage].bg;
      if (sfx && soundRef.current) sfx.stageUp();
      confetti({ particleCount: 90, spread: 100, origin: { y: 0.35 } });
    };

    /* النجاح في الاختيار: الهبوط على الحرف الأخضر → يتحوَّل الزوج لغُيمة ويُحسب الحرف
     * (النجاح لحظة الاختيار الصحيح مباشرة، لا عند «منصة النجاح» التي تُحجب بغيمة فوقها) */
    const onGateSuccess = (pairY: number) => {
      for (const pf of platforms) {
        if (pf.kind === 'letter' && pf.y === pairY) {
          pf.kind = 'normal'; pf.isTarget = false; pf.letter = undefined; pf.w = PLAT_W;
        }
      }
      solved++;
      scoreRef.current += 50;
      sessionStars.current += 1;
      addStars(1);
      if (sfx && soundRef.current) sfx.coin();
      confetti({ particleCount: 30, spread: 55, origin: { x: px / W, y: Math.max(0, pairY - camY) / H } });
      if (solved >= SOLVED_PER_STAGE) advanceStage();
    };

    /* النُّفّاخة: إنقاذ بدل الخسارة */
    const startRescue = () => {
      rescuing = true; rescueT = 0; vy = 0;
      balloon.x = px;
      balloon.y = H + 40;
      const pair = pickRound();
      balloon.letter = pair[Math.random() < 0.5 ? 0 : 1];
      rescues++;
      if (sfx && soundRef.current) sfx.rescue();
    };

    const finishRescue = () => {
      // منصة قريبة من موضع السقوط (لا نعيده للقاع البعيد) ليعاود المحاولة على الحرف نفسه
      let best: Platform | null = null;
      let bestD = Infinity;
      const home = H * 0.62;
      for (const p of platforms) {
        const sy = p.y - camY;
        if (sy < H - 20 && sy > H * 0.12) {
          const d = Math.abs(sy - home);
          if (d < bestD) { bestD = d; best = p; }
        }
      }
      if (!best) {
        bestD = Infinity;
        for (const p of platforms) {
          const sy = p.y - camY;
          if (sy < H - 20) {
            const d = Math.abs(sy - home);
            if (d < bestD) { bestD = d; best = p; }
          }
        }
      }
      if (best) {
        py = best.y - PR;
        camY = py - anchor;
        px = Math.max(PR + 2, Math.min(W - PR - 2, best.x + best.w / 2));
        vy = 0;
      }
      rescuing = false;
    };

    /* ── رسم منصة ── */
    const drawPlatform = (p: Platform) => {
      const sy = p.y - camY;
      if (sy < -80 || sy > H + 80 || p.broken) return;
      const x = p.x, w = p.w;
      if (p.kind === 'normal') {
        ctx.lineWidth = 2.5; ctx.strokeStyle = pal.edge;
        ctx.fillStyle = pal.plat;
        ctx.beginPath();
        ctx.moveTo(x, sy);
        ctx.quadraticCurveTo(x, sy - 12, x + w / 2, sy - 5);
        ctx.quadraticCurveTo(x + w, sy - 12, x + w, sy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = pal.line;
        ctx.beginPath(); ctx.moveTo(x + 7, sy + 3); ctx.lineTo(x + w - 7, sy + 3); ctx.stroke();
      } else {
        const cx = x + w / 2;
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#2b2a33';
        ctx.fillStyle = p.isTarget ? '#2ecc71' : '#ff6b6b';
        ctx.beginPath(); ctx.arc(cx, sy, w / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2b2a33';
        ctx.font = "900 21px 'Cairo', sans-serif";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.letter || '؟', cx, sy + 1);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
    };

    /* ── رسم نجمة ── */
    const drawStar = (s: StarObj) => {
      const sy = s.y - camY;
      if (sy < -20 || sy > H + 20 || s.taken) return;
      ctx.fillStyle = s.c;
      traceStar(ctx, s.x, sy, 9, 5); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(s.x, sy - 3, 1.4, 0, Math.PI * 2); ctx.fill();
    };

    /* ── رسم النُّفّاخة (شاشة مباشرة) ── */
    const drawBalloon = () => {
      const sway = Math.sin(rescueT / 6) * 6;
      const bx = balloon.x + sway, by = balloon.y;
      // الخيط إلى أسفل
      ctx.strokeStyle = '#2b2a33'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by + 18);
      ctx.quadraticCurveTo(bx + 8, by + 30, bx + 2, by + 46);
      ctx.quadraticCurveTo(bx - 6, by + 60, bx, by + 74);
      ctx.stroke();
      // جسم البالون
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath(); ctx.ellipse(bx, by, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1f9d55'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(bx, by, 22, 28, 0, 0, Math.PI * 2); ctx.stroke();
      // لمعة
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(bx - 8, by - 10, 6, 9, 0.4, 0, Math.PI * 2); ctx.fill();
      // الحرف بداخلها
      ctx.fillStyle = '#fff';
      ctx.font = "900 22px 'Cairo', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(balloon.letter, bx, by + 2);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      // مواساة صغيرة
      drawHarfoosh(ctx, bx, by + 60, bodyColor, hatRef.current, 0.4);
      ctx.fillStyle = pal.edge;
      ctx.font = "bold 13px 'Cairo', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('لا بأس! نفس عميق وشوف الحرف 🎈', W / 2, 70);
      ctx.textAlign = 'left';
    };

    const frame = () => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (statusRef.current !== 'playing') return;
      frameCount++;

      if (rescuing) {
        rescueT++;
        balloon.y = H + 40 - (H + 90) * Math.min(1, rescueT / 60);
        if (rescueT <= 70) {
          drawBackground(ctx, bgRef.current, camY);
          ctx.save(); ctx.translate(0, -camY);
          starsArr.forEach(drawStar);
          platforms.forEach(drawPlatform);
          ctx.restore();
          drawBalloon();
          return;
        }
        finishRescue();
      }

      // الحركة الجانبية
      if (keys.current.left) px -= MOVE_SPEED;
      if (keys.current.right) px += MOVE_SPEED;
      if (px < -PR) px = W + PR;
      if (px > W + PR) px = -PR;

      // الفيزياء (نزول أبطأ: حد أقصى لسرعة السقوط)
      vy += GRAVITY;
      if (vy > MAX_FALL_VY) vy = MAX_FALL_VY;
      py += vy;

      // الهبوط على منصة (الأقرب أسفل أولًا)
      if (vy > 0) {
        let hit: Platform | null = null;
        for (const p of platforms) {
          if (p.broken) continue;
          const bottom = py + PR, prevBottom = py - vy + PR;
          if (bottom >= p.y && prevBottom <= p.y && px + PR > p.x && px - PR < p.x + p.w) {
            if (!hit || p.y < hit.y) hit = p;
          }
        }
        if (hit) {
          if (hit.kind === 'letter') {
            if (hit.isTarget) {
              // الحرف الصحيح = نجاح فوري: يتحوَّل الزوج لغُيمة، يُحسب الحرف، وتنطلق القفزة السحرية
              vy = MEGA_VY;
              onGateSuccess(hit.y);
              bodyColor = letterColor(hit.letter || '');
              if (sfx && soundRef.current) sfx.correct();
              confetti({ particleCount: 25, spread: 45, origin: { x: px / W, y: Math.max(0, hit.y - camY) / H } });
            } else {
              vy = JUMP_VY;
              if (sfx && soundRef.current) sfx.retry();
            }
          } else {
            vy = JUMP_VY;
            if (sfx && soundRef.current) sfx.jump();
          }
        }
      }

      // الصعود: إبقاء اللاعب عند مرساة الشاشة وتحرّك الكاميرا للأعلى
      if (py - camY < anchor) {
        camY = py - anchor;
        maxClimb = Math.max(maxClimb, -camY);
      }

      // توليد منصات من الأعلى: أبقِ 160+ بكسل من السلم فوق الشاشة دائمًا
      while (front - camY > -160) spawnNext();

      // شبكة الأمان: إن غاب سلم قابل للوصول فوق حرفوش، تُولد منصة طوارئ فورًا → لا فراغ أبدًا
      if (statusRef.current === 'playing') {
        let ok = vy < JUMP_VY; // أثناء القفزة السحرية لا نملأ فجوة البوابة (إنها آلية الاختيار)
        if (!ok) {
          for (const p of platforms) {
            if (p.broken) continue;
            if (p.y <= py - 3 && p.y >= py - 193) {
              if (p.x < px + PR && p.x + p.w > px - PR || p.kind === 'letter') { ok = true; break; }
            }
          }
        }
        if (!ok) {
          const ey = py - 150;
          const ex = Math.max(10, Math.min(W - PLAT_W - 10, px + (Math.random() * 120 - 60)));
          platforms.push({ x: ex, y: ey, w: PLAT_W, kind: 'normal', broken: false });
          front = Math.min(front, ey);
        }
      }

      // جمع النجوم
      for (const st of starsArr) {
        if (!st.taken && Math.abs(st.y - py) < 28 && Math.abs(st.x - px) < 28) {
          st.taken = true;
          sessionStars.current += 1;
          addStars(1);
          if (sfx && soundRef.current) sfx.coin();
        }
      }

      // رسم
      drawBackground(ctx, bgRef.current, camY);
      ctx.save();
      ctx.translate(0, -camY);
      starsArr.forEach(drawStar);
      platforms.forEach(drawPlatform);
      const hint = nearestLetterPlat();
      if (hint) drawHint(hint);
      drawHarfoosh(ctx, px, py, bodyColor, hatRef.current, performance.now() / 300);
      ctx.restore();

      // حدّث العداد والأرقام (مخفّف: كل 12 إطار)
      scoreRef.current = Math.max(scoreRef.current, Math.floor(maxClimb / 10));
      if (frameCount % 12 === 0) {
        if (scoreRef.current > bestRef.value) {
          bestRef.value = scoreRef.current;
          setBest(scoreRef.current);
          try { localStorage.setItem('mg_harfoosh_best', String(Math.floor(scoreRef.current))); } catch { /* noop */ }
        }
        setHud({ score: Math.floor(scoreRef.current), stage: stage + 1, stageName: STAGES[stage].name, solved, rescues });
        const nt = nearestTarget();
        if (nt) setTarget(nt);
      }

      // تنظيف دوري: حذف ما انخفض عن الشاشة فقط — الموجود فوق يُبقى ليبقى «السلم» متصلًا
      if (frameCount % 90 === 0) {
        platforms = platforms.filter((p) => p.y - camY < H + 160);
        starsArr = starsArr.filter((st) => !st.taken && st.y - camY < H + 160);
      }

      // لا خسارة قاطعة: السقوط تحت الشاشة = النُّفّاخة تنقذ حرفوش
      if (py - camY > H + 40) startRescue();
    };

    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      {/* الشريط العلوي */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="font-bold px-4 py-2 bg-white text-[#6c5ce7] rounded-[30px_8px_30px_8px] border-[3px] border-[#6c5ce7]/40 hover:bg-[#6c5ce7]/10 transition"
        >↩️ رجوع للألعاب</button>
        <h2 className="font-bold text-xl text-[#6c5ce7]">🐲 قفز حرفوش</h2>
      </div>

      {/* شريط المعلومات */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-[18px_5px_18px_5px] border-[3px] border-dashed border-[#d4b8a0] px-4 py-2">
        <div className="font-black text-[#6c5ce7]">⭐ {stars} نجمة</div>
        {status === 'playing' && <div className="font-bold text-[#2d3436]">النقاط: {hud.score}</div>}
        {status === 'playing' && (
          <div className="font-bold text-[#00b894]">🌍 مرحلة {hud.stage}: {hud.stageName} · حروف {hud.solved}/{SOLVED_PER_STAGE}</div>
        )}
        {status === 'playing' && <div className="font-bold text-[#a78bfa]">🎈 نجاة: {hud.rescues}</div>}
        <div className="font-bold text-[#a78bfa]">الأفضل: {best}</div>
        <button onClick={() => setSoundOn((v) => !v)} className="text-xl px-2 hover:scale-110 transition" title={soundOn ? 'كتم الصوت' : 'تشغيل الصوت'}>{soundOn ? '🔊' : '🔇'}</button>
      </div>

      {/* لوحة اللعب */}
      <div className="relative w-full overflow-hidden rounded-[24px_8px_24px_8px] border-[4px] border-dashed border-[#6c5ce7] shadow-[6px_6px_0_rgba(0,0,0,0.07)] bg-[#fffdf7]" style={{ maxWidth: 380, margin: '0 auto' }}>
        <canvas
          ref={canvasRef}
          width={W} height={H}
          className="w-full h-auto block touch-none select-none"
          style={{ aspectRatio: `${W}/${H}` }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mid = rect.width / 2;
            if (e.clientX - rect.left < mid) { keys.current.left = true; keys.current.right = false; } else { keys.current.right = true; keys.current.left = false; }
          }}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse' && e.buttons === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const mid = rect.width / 2;
            if (e.clientX - rect.left < mid) { keys.current.left = true; keys.current.right = false; } else { keys.current.right = true; keys.current.left = false; }
          }}
          onPointerUp={() => { keys.current.left = false; keys.current.right = false; }}
          onPointerLeave={() => { keys.current.left = false; keys.current.right = false; }}
        />

        {/* الحرف المطلوب أثناء اللعب */}
        {status === 'playing' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/85 rounded-full px-4 py-1 border-2 border-dashed border-[#6c5ce7] shadow">
            <span className="text-sm font-bold text-[#636e72]">قف على حرف:</span>
            <span className="text-2xl font-black" style={{ color: '#00b894' }}>{target}</span>
          </div>
        )}

        {/* طبقة البداية */}
        {status !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#6c5ce7]/15 p-6 text-center">
            <div className="text-6xl">🐲</div>
            <div className="font-black text-2xl text-[#2d3436]">قفز حرفوش</div>
            <p className="text-sm text-[#636e72] max-w-xs">
              حرّك حرفوش يمينًا ويسارًا، قف على الغيوم واجمع النجوم. اختر الحرف الصحيح ليطير عاليًا!
              كلّما أتممت 5 اختيارات تتغيّر المرحلة والخلفية. وإن سقط حرفوش ترفعه النُّفّاخة 🎈 — لا خسارة!
            </p>
            <button
              onClick={() => apiRef.current?.start()}
              className="px-8 py-3 font-black text-xl bg-[#6c5ce7] text-white rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#4a3f8a] hover:scale-105 transition"
            >
              ▶️ ابدأ اللعب
            </button>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6c5ce7] font-bold">
              <div className="bg-white/80 rounded-lg p-1">🤚 يسار/يمين للتحرك</div>
              <div className="bg-white/80 rounded-lg p-1">🟢 الحرف الصحيح يطيّرك عاليًا</div>
              <div className="bg-white/80 rounded-lg p-1">⭐ اجمع النجوم</div>
              <div className="bg-white/80 rounded-lg p-1">🎈 إن سقطت، النُّفّاخة تنقذك</div>
            </div>
          </div>
        )}
      </div>

      {/* المتجر */}
      <div className="bg-white rounded-[18px_5px_18px_5px] border-[3px] border-dashed border-[#d4b8a0] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 className="font-bold text-lg text-[#2d3436]">🛍️ متجر حرفوش</h3>
          <span className="text-sm font-bold text-[#6c5ce7]">رصيدك: ⭐ {stars}</span>
        </div>
        <div className="text-sm font-bold text-[#a78bfa] mb-2">🧢 القبعات</div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => equip('none', 'hat')} className={`px-3 py-2 rounded-[12px_4px_12px_4px] border-2 font-bold text-sm transition ${shop.equippedHat === 'none' ? 'bg-[#6c5ce7] text-white border-[#6c5ce7]' : 'bg-[#f8f4f0] border-[#d4b8a0] hover:border-[#6c5ce7]'}`}>بدون</button>
          {SHOP_ITEMS.filter((i) => i.type === 'hat').map((item) => {
            const owned = shop.owned.includes(item.id);
            const eq = shop.equippedHat === item.id;
            return (
              <button key={item.id} onClick={() => (owned ? equip(item.id, 'hat') : buy(item))}
                className={`flex flex-col items-center px-3 py-2 rounded-[12px_4px_12px_4px] border-2 font-bold text-sm transition ${eq ? 'bg-[#6c5ce7] text-white border-[#6c5ce7]' : 'bg-[#f8f4f0] border-[#d4b8a0] hover:border-[#6c5ce7]'}`}>
                <span className={`text-2xl ${owned ? '' : 'grayscale opacity-50'}`}>{item.emoji}</span>
                <span>{owned ? (eq ? '✓ مرتدي' : 'ارتدِ') : `⭐${item.cost}`}</span>
              </button>
            );
          })}
        </div>
        <div className="text-sm font-bold text-[#2ecc71] mb-2">🏞️ الخلفيات</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => equip('sky', 'bg')} className={`px-3 py-2 rounded-[12px_4px_12px_4px] border-2 font-bold text-sm transition ${shop.equippedBg === 'sky' ? 'bg-[#6c5ce7] text-white border-[#6c5ce7]' : 'bg-[#f8f4f0] border-[#d4b8a0] hover:border-[#6c5ce7]'}`}>☁️ سماء</button>
          {SHOP_ITEMS.filter((i) => i.type === 'bg').map((item) => {
            const owned = shop.owned.includes(item.id);
            const eq = shop.equippedBg === item.id;
            return (
              <button key={item.id} onClick={() => (owned ? equip(item.id, 'bg') : buy(item))}
                className={`flex flex-col items-center px-3 py-2 rounded-[12px_4px_12px_4px] border-2 font-bold text-sm transition ${eq ? 'bg-[#6c5ce7] text-white border-[#6c5ce7]' : 'bg-[#f8f4f0] border-[#d4b8a0] hover:border-[#6c5ce7]'}`}>
                <span className={`text-2xl ${owned ? '' : 'grayscale opacity-50'}`}>{item.emoji}</span>
                <span>{owned ? (eq ? '✓ فعّالة' : 'تفعيل') : `⭐${item.cost}`}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JumpTab;