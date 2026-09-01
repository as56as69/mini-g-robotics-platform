import React, { useState, useRef, useEffect } from 'react';
import { Scissors, Sparkles } from 'lucide-react';
import { SoundFXManager } from '../ble/SoundFX';
import { BlocklyWorkspace } from '../blockly/BlocklyWorkspace';
import { listenWaraki, WarakiEvent } from '../services/warakiBus';
import { WarakiAdventuresView } from '../adventures/WarakiAdventuresView';

interface Props {}

/* ============================================================
 * كود ماجيك — دفتر الكود السحري (Doodle Code Magic)
 * المرحلة 2: بلوكات Blockly حقيقية بثيم «دفتر الورق» + وحش يتحرك.
 * الهوية: ورق دفتر مربعات + وحش ورقي لطيف + ثيم Blockly بقلم
 * بحدود متذبذبة (SVG filter) + خط Cairo Play اليدوي + أصوات ورق.
 * ============================================================ */

type PaperStyle = 'dotted' | 'lined' | 'grid' | 'kraft' | 'plain' | 'notebook' | 'darkkraft';

const PAPER_OPTIONS: { id: PaperStyle; icon: string; label: string }[] = [
  { id: 'dotted', icon: '🔵', label: 'منقط' },
  { id: 'lined', icon: '📏', label: 'مخطط' },
  { id: 'grid', icon: '📐', label: 'مربعات' },
  { id: 'kraft', icon: '📦', label: 'ورق أسمر' },
  { id: 'plain', icon: '📄', label: 'سادة' },
  { id: 'notebook', icon: '📝', label: 'كراسة مسطرة' },
  { id: 'darkkraft', icon: '📜', label: 'خشن داكن' },
];

const PAPER_STORAGE_KEY = 'mg_doodle_paper';

const BLOCK_PIECES = [
  { icon: '🚗', label: 'تحرك', bg: '#ffd93d', tilt: -1.6 },
  { icon: '🎨', label: 'لوّن', bg: '#ff6b9d', tilt: 1.2 },
  { icon: '📳', label: 'هزّ', bg: '#6bcb77', tilt: -0.8 },
  { icon: '⏳', label: 'انتظر', bg: '#a5b4fc', tilt: 1.1 },
  { icon: '🔄', label: 'كرر', bg: '#4d96ff', tilt: -0.9 },
];

/** Waraki the paper monster — v3: layered paper-cut body with stitch lines,
 *  glossy crown + idea lamp, curious anime eyes with blink + mouse tracking,
 *  recycled-fiber texture, and mood reactions driven by the mg-waraki bus. */
type WarakiMood = 'idle' | 'drag' | 'shake' | 'confused' | 'celebrate' | 'color';

/**
 * Waraki's identity: a child's drawing that **melds with its medium**.
 * He was first drawn on torn paper (hence «ورقي»), so when the notebook
 * sheet changes, his drawing medium changes with it — crayon at home,
 * pencil on geometric sheets, ink on kraft.
 */
type WarakiMedium = {
  id: string;        // medium id (data-paper attribute)
  body: string;      // default body fill (color block returns to this)
  ink: string;       // outline + features
  layer: string;     // offset back-sheet colour
  feet: string;      // feet fill
  pupil: string;     // pupil fill
  eyeFill: string;   // eye-white fill
  eyeSparkle: string; // sparkle dot colour
  cheek: string;     // cheek blush
  smileFill: string; // open-smouth fill
  filterClass: string; // optional CSS treatment on the svg
};

const W_WAX: WarakiMedium = {
  id: 'wax', body: '#b8f0d8', ink: '#2b2a33', layer: '#9ad9c2',
  feet: '#6bcb77', pupil: '#2b2a33', eyeFill: '#fff', eyeSparkle: '#fff',
  cheek: '#ff6b9d', smileFill: '#fff', filterClass: '',
};
const W_PENCIL: WarakiMedium = {
  id: 'pencil', body: '#eceae4', ink: '#4a4a4a', layer: '#d8d5cd',
  feet: '#b8b5ac', pupil: '#4a4a4a', eyeFill: '#fff', eyeSparkle: '#fff',
  cheek: '#c9a6a0', smileFill: '#fff', filterClass: 'waraki-pencil',
};
const W_INK: WarakiMedium = {
  id: 'ink', body: '#e0cfa8', ink: '#2b1b0d', layer: '#c4ab80',
  feet: '#a8865d', pupil: '#2b1b0d', eyeFill: '#fdf6e3', eyeSparkle: '#fff',
  cheek: '#b0655a', smileFill: '#f7efe0', filterClass: '',
};

const MEDIUM_MAP: Record<PaperStyle, WarakiMedium> = {
  dotted: W_WAX,
  plain: W_WAX,
  lined: W_PENCIL,
  grid: W_PENCIL,
  notebook: W_PENCIL,
  kraft: W_INK,
  darkkraft: W_INK,
};

const PaperMonster: React.FC<{
  bodyColor: string;
  medium: WarakiMedium;
  mood: WarakiMood;
  pupil1Ref: React.RefObject<SVGGElement | null>;
  pupil2Ref: React.RefObject<SVGGElement | null>;
  crownRef: React.RefObject<SVGGElement | null>;
  lampOn: boolean;
}> = ({ bodyColor, medium, mood, pupil1Ref, pupil2Ref, crownRef, lampOn }) => (
  <svg
    viewBox="0 0 200 150"
    className={`w-40 sm:w-52 h-auto waraki-svg ${medium.filterClass || ''}`}
    data-mood={mood}
    data-paper={medium.id}
    aria-label="ورقي — وحش الورق اللطيف"
  >
    <defs>
      {/* recycled-paper fiber texture (subtle ink flecks over the mint fill) */}
      <pattern id="warakiFiber" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2.6" r="0.55" fill="rgba(43,42,51,0.055)" />
        <circle cx="6.5" cy="6.4" r="0.42" fill="rgba(43,42,51,0.045)" />
        <path d="M0.4 6.6 Q2 5.8 1.2 8" stroke="rgba(43,42,51,0.05)" strokeWidth="0.5" fill="none" />
      </pattern>
      {/* glossy highlight for the cardboard crown */}
      <linearGradient id="warakiCrown" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0%" stopColor="#ffe985" />
        <stop offset="45%" stopColor="#ffd93d" />
        <stop offset="100%" stopColor="#f0b429" />
      </linearGradient>
      {/* cut-paper shadow only — the torn edges themselves are hand-drawn
          L segments in the body path (deterministic, no noise distortion) */}
      <filter id="warakiShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="3" dy="5" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
      </filter>
    </defs>

    {/* ===== Hand-torn paper body group — zigzag L-segment edges drawn
         manually like scissors/nail tears; face & crown stay outside.
         All inks flow from the current medium (paper type). ===== */}
    <g filter="url(#warakiShadow)">
      {/* layered paper base — darker offset sheet behind the body (peeking edges) */}
      <path
        d="M100 25 L112 22 L123 26 L136 22 L146 28 L149 37 L149 47 L159 51 L165 62 L159 72 L166 82 L156 92 L162 104 L154 113 L119 122 C 108 128, 80 124, 72 108 C 54 122, 36 108, 70 90 C 42 106, 32 86, 60 68 L62 58 L72 52 L86 50 L100 21 L113 25 Z"
        fill={medium.layer}
        opacity="0.85"
        transform="translate(2.5, 3)"
        stroke={medium.ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* hand-torn body — sharp L segments like a sheet ripped by hand,
          following our existing blob silhouette (bumps + side tufts) */}
      <path
        d="M100 21
           L 116 19 L 130 22 L 128 30 L 141 26
           L 152 30 L 149 36 L 160 34 L 166 44
           L 154 40 L 158 50 L 166 48 L 170 52
           L 163 50 L 172 62 L 165 56 L 168 68
           L 156 62 L 160 70 L 168 74 L 162 78
           L 174 76 L 170 82 L 160 82 L 166 90
           L 152 84 L 158 92 L 170 96 L 160 96
           L 162 96 L 150 100 L 160 100 L 150 102
           L 138 96 L 152 102 L 128 108
           L 146 116 L 128 122 L 118 112
           L 106 124 L 78 122 L 70 106
           L 52 120 L 34 106 L 68 88
           L 40 104 L 30 84 L 58 66
           L 42 60 L 54 22 L 86 18 Z"
        fill={bodyColor}
        stroke={medium.ink}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="waraki-transition"
      />
      {/* fiber texture overlay on the body only */}
      <path
        d="M100 21 L 116 19 L 128 22 L 141 26 L 152 40 L 154 62 L 166 82 L 152 80 L 138 102 L 118 112 L 70 106 L 58 66 L 54 22 Z"
        fill="url(#warakiFiber)"
        stroke="none"
        pointerEvents="none"
      />
    </g>
    {/* paper crown — hand-torn zigzag base (like torn cardboard strip), with
        idea lamp + brass pin; tilts when confused */}
    <g ref={crownRef} className={mood === 'confused' ? 'waraki-crown-tilt' : undefined}>
      <path
        d="M85 30 L89 14 L94 18 L98 8 L106 9 L110 14 L112 10 L114 26 L100 32 Z"
        fill="url(#warakiCrown)"
        stroke={medium.ink}
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="waraki-transition"
      />
      {/* glossy streak highlight */}
      <path d="M92 12 L96 7" stroke="#fffbe8" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
      {/* brass pin */}
      <circle cx="100" cy="22" r="2.6" fill={medium.ink} opacity="0.85" />
      <circle cx="99.2" cy="21.2" r="0.8" fill="#fff" opacity="0.9" />
      {/* idea lamp — glows while the program runs */}
      <g className={lampOn ? 'waraki-lamp waraki-lamp-on' : 'waraki-lamp'}>
        <circle cx="100" cy="2.5" r="3.4" fill={lampOn ? '#fff7cc' : '#fff'} stroke={medium.ink} strokeWidth="1.6" />
        {lampOn && <circle cx="100" cy="2.5" r="6.5" fill="#fff3a3" opacity="0.55" className="waraki-lamp-glow" />}
      </g>
    </g>
    {/* feet — colour follows the medium too */}
    <ellipse cx="78" cy="134" rx="14" ry="7" fill={medium.feet} stroke={medium.ink} strokeWidth="2.5" className="waraki-transition" />
    <ellipse cx="122" cy="134" rx="14" ry="7" fill={medium.feet} stroke={medium.ink} strokeWidth="2.5" className="waraki-transition" />
    {/* curious anime eyes — bigger pupils, sparkle, playful side glance.
        Each pupil group gets its own tracking ref (left/right offset). */}
    <g className="waraki-eye">
      <circle cx="82" cy="64" r="12" fill={medium.eyeFill} stroke={medium.ink} strokeWidth="3" className="waraki-transition" />
      <g ref={pupil1Ref} className="waraki-pupil">
        <circle cx="85" cy="66" r="6.5" fill={medium.pupil} />
        <circle cx="82.5" cy="62.5" r="2.1" fill={medium.eyeSparkle} />
      </g>
    </g>
    <g className="waraki-eye" style={{ animationDelay: '0.06s' }}>
      <circle cx="120" cy="60" r="12" fill={medium.eyeFill} stroke={medium.ink} strokeWidth="3" className="waraki-transition" />
      <g ref={pupil2Ref} className="waraki-pupil">
        <circle cx="124" cy="62" r="6.5" fill={medium.pupil} />
        <circle cx="120.5" cy="58.5" r="2.1" fill={medium.eyeSparkle} />
      </g>
    </g>
    {/* confused: paper question mark floats above the head */}
    {mood === 'confused' && (
      <text x="142" y="18" className="waraki-qmark" fontSize="22" fontWeight="bold" fill="#ff6b6b" stroke={medium.ink} strokeWidth="0.8">؟</text>
    )}
    {/* celebration stars — fly around the head when a program succeeds */}
    {mood === 'celebrate' && (
      <g className="waraki-stars">
        <path className="waraki-star waraki-star-1" d="M150 28 l3 6 6 1 -4.5 4.5 1 6.5 -5.5 -3.5 -5.5 3.5 1 -6.5 -4.5 -4.5 6 -1 Z" fill="#ffd93d" stroke={medium.ink} strokeWidth="1.6" />
        <path className="waraki-star waraki-star-2" d="M42 24 l2.6 5 5 0.8 -3.6 3.6 0.8 5 -5 -3 -5 3 1 -5 -3.6 -4.4 5 -0.8 Z" fill="#ff6b9d" />
        <path className="waraki-star waraki-star-3" d="M118 14 l2.4 4.8 4.8 0.8 -3.6 3.6 0.8 4.8 -4 -2.4 -4 2.4 0.8 -4 -3.2 -3.6 4 -0.8 Z" fill="#4d96ff" />
      </g>
    )}
    {/* wide friendly open smile */}
    <path
      d="M85 82 Q100 98 116 80"
      fill={medium.smileFill}
      stroke={medium.ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
      className="waraki-transition"
    />
    <path d="M89 84 Q100 92 111 82" fill="none" stroke={medium.ink} strokeWidth="1.4" opacity="0.5" strokeLinecap="round" />
    {/* cheeks */}
    <circle cx="72" cy="78" r="6.5" fill={medium.cheek} opacity="0.45" />
    <circle cx="127" cy="80" r="6" fill={medium.cheek} opacity="0.45" />
  </svg>
);

/** Cut-paper block piece (torn edges + tape + wiggly filter) */
const CutBlock: React.FC<{ icon: string; label: string; bg: string; tilt: number; delay: number }> = ({
  icon,
  label,
  bg,
  tilt,
  delay,
}) => (
  <div
    className="relative doodle-wiggly bg-white border-[2.5px] border-[#2b2a33] px-4 sm:px-5 py-3 flex items-center gap-2.5 shrink-0 cursor-grab"
    style={{
      borderRadius: '14px 22px 12px 20px / 18px 12px 22px 14px',
      boxShadow: '3px 4px 0 rgba(43,42,51,0.22)',
      background: bg,
      transform: `rotate(${tilt}deg)`,
      animation: `doodleSwing ${3 + (tilt > 0 ? 0.4 : 0)}s ease-in-out infinite`,
    }}
  >
    {/* tape strip */}
    <span
      className="doodle-tape"
      style={{ top: -10, left: '50%', transform: `translateX(-50%) rotate(${tilt * -1.6}deg)` }}
    />
    <span className="text-2xl sm:text-3xl leading-none select-none">{icon}</span>
    <span className="doodle-title text-[#2b2a33] text-sm sm:text-base font-bold">{label}</span>
  </div>
);

/** Torn paper edge along the bottom of the notebook page */
const TornEdge: React.FC = () => (
  <svg viewBox="0 0 1200 40" className="w-full h-8 mt-auto" preserveAspectRatio="none" aria-hidden>
    <path
      d="M0 26 L40 18 L80 30 L120 16 L160 30 L200 14 L240 30 L280 22 L320 30 L360 16 L400 28 L440 20 L480 30 L520 16 L560 28 L560 44 L0 44 Z"
      fill="#fffdf6"
      stroke="#2b2a33"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * كود ماجيك — دفتر الكود السحري (المرحلة 3: ورقي حي يتفاعل مع البلوكات)
 * صفحه دفتر ورقية + وحش ورقي يتابع السحب بالعيون + يتلوّن + يهتز + يحتفل.
 */
export const DoodleModeView: React.FC<Props> = () => {
  const [magicOn, setMagicOn] = useState(false);
  const [monsterExcited, setMonsterExcited] = useState(false);
  const [mood, setMood] = useState<WarakiMood>('idle');
  const [bodyColor, setBodyColor] = useState('#b8f0d8');
  const [lampOn, setLampOn] = useState(false);
  const [shakeOn, setShakeOn] = useState(false);
  const [showAdventures, setShowAdventures] = useState(false);
  const pupil1Ref = useRef<SVGGElement>(null);
  const pupil2Ref = useRef<SVGGElement>(null);
  const crownRef = useRef<SVGGElement>(null);

  const [paper, setPaper] = useState<PaperStyle>(() => {
    const saved = localStorage.getItem(PAPER_STORAGE_KEY);
    return PAPER_OPTIONS.some((p) => p.id === saved) ? (saved as PaperStyle) : 'dotted';
  });

  const handlePaperChange = (style: PaperStyle) => {
    SoundFXManager.playPaperRustle();
    setPaper(style);
    localStorage.setItem(PAPER_STORAGE_KEY, style);
    // Waraki melds with his medium — body returns to the new paper's colour
    setBodyColor(MEDIUM_MAP[style].body);
  };

  const handleMagic = () => {
    SoundFXManager.playPaperRustle();
    SoundFXManager.playPaperTorn();
    setMagicOn(true);
    window.setTimeout(() => setMagicOn(false), 1600);
  };

  const handleCodeRun = () => {
    // Paper monster "dances" while the generated code executes.
    setMonsterExcited(true);
    window.setTimeout(() => setMonsterExcited(false), 1400);
  };

  // ===== Waraki moods — driven by the mg-waraki Blockly event bus =====
  useEffect(() => {
    const off = listenWaraki((e: WarakiEvent) => {
      switch (e.type) {
        case 'drag':
          setMood('drag');
          break;
        case 'color':
          setMood('color');
          setBodyColor(e.color);
          window.setTimeout(() => {
            // Return to the current paper's medium colour (not fixed mint)
            setBodyColor(MEDIUM_MAP[paper].body);
            setMood('idle');
          }, 2000);
          break;
        case 'vibrate':
          setMood('shake');
          setShakeOn(true);
          window.setTimeout(() => setShakeOn(false), 700);
          window.setTimeout(() => setMood('idle'), 700);
          break;
        case 'success':
          setMood('celebrate');
          window.setTimeout(() => setMood('idle'), 1800);
          break;
        case 'error':
          setMood('confused');
          window.setTimeout(() => setMood('idle'), 2200);
          break;
        case 'run-start':
          setLampOn(true);
          window.setTimeout(() => setLampOn(false), 1200);
          break;
      }
    });
    return off;
  }, []);

  // Eye-tracking: pupils (and crown) follow the cursor while dragging.
  useEffect(() => {
    if (mood !== 'drag') return;
    const handleMove = (e: MouseEvent) => {
      for (const ref of [pupil1Ref, pupil2Ref]) {
        const el = ref.current;
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const range = 3.2;
        el.style.transform = `translate(${(dx / dist) * range}px, ${(dy / dist) * range}px)`;
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mood]);

  const blocks = [
    { icon: '🚗', label: 'تحرك', bg: '#ffd93d', tilt: -1.8 },
    { icon: '🎨', label: 'لوّن', bg: '#ff9ff3', tilt: 1.2 },
    { icon: '📢', label: 'هزّ', bg: '#7bed9f', tilt: -0.8 },
    { icon: '⏳', label: 'انتظر', bg: '#70a1ff', tilt: -0.9 },
    { icon: '🔄', label: 'كرر', bg: '#ff9f43', tilt: 1.8 },
  ];

  return (
    <div className="flex-1 relative overflow-hidden" dir="rtl">
      {/* ===== Adventures full page (opened from Magic Code) ===== */}
      {showAdventures && (
        <WarakiAdventuresView onBack={() => setShowAdventures(false)} />
      )}

      {!showAdventures && (
      <>
      {/* ===== Shared SVG wiggly filter (defined once) ===== */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="doodleWiggle">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" />
        </filter>
      </svg>

      <div className={`doodle-notebook doodle-paper-${paper} flex-1 flex flex-col gap-4 px-4 sm:px-12 py-4 relative overflow-y-auto transition-colors duration-300`}>
        {/* ===== Torn top edge + tape ===== */}
        <span className="doodle-tape" style={{ top: -10, right: '18%' }} />
        <span className="doodle-tape" style={{ top: 6, left: '12%', transform: 'rotate(5deg)' }} />

        {/* ===== Paper type selector (change the notebook sheet) ===== */}
        <div className="paper-selector relative z-20">
          <span className="doodle-title text-[#2b2a33]/80 text-sm font-bold">📜 اختر نوع الورق:</span>
          {PAPER_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePaperChange(p.id)}
              className={`paper-btn ${paper === p.id ? 'active' : ''}`}
              title={`ورق ${p.label}`}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {/* ===== Title (Cairo Play crayon) ===== */}
        <div className="text-center select-none">
          <h1 className="doodle-title text-2xl sm:text-4xl font-bold text-[#2b2a33] doodle-wiggly inline-block">
            <span className="text-[#ff6b6b]">كود</span>{' '}
            <span className="text-[#4d96ff]">مـ</span>
            <span className="text-[#6bcb77]">ا</span>
            <span className="text-[#ffd93d]">جـ</span>
            <span className="text-[#ff6b9d]">يك</span>{' '}
            <span className="text-2xl">🪄</span>
          </h1>
          <p className="doodle-title text-[#2b2a33]/70 text-xs sm:text-sm mt-1">
            دفتر الرسم السحري — ارسم ببلوكات الورق وشاهد وحشك يتحرك!
          </p>
        </div>

        {/* ===== Paper monster stage ===== */}
        <div className="relative mx-auto w-fit">
          <span className="doodle-tape" style={{ top: -12, right: '22%' }} />
          <span className="doodle-tape" style={{ top: -8, left: '16%', transform: 'rotate(6deg)' }} />
          <div
            className={`doodle-monster bg-[#fffef7] border-2 border-[#2b2a33]/70 rounded-[22px_30px_24px_36px] px-10 py-3 shadow-[4px_5px_0_rgba(43,42,51,0.15)] transition-all duration-300 ${monsterExcited || mood === 'celebrate' ? 'doodle-monster-excited' : ''} ${shakeOn ? 'waraki-shake' : ''}`}
          >
            <PaperMonster
              bodyColor={bodyColor}
              medium={MEDIUM_MAP[paper]}
              mood={mood}
              pupil1Ref={pupil1Ref}
              pupil2Ref={pupil2Ref}
              crownRef={crownRef}
              lampOn={lampOn}
            />
            <p className="doodle-title text-[#2b2a33]/70 text-xs sm:text-sm text-center mt-1">
              {mood === 'celebrate'
                ? 'يا سحر! الرسمة عاشت! 🎉'
                : mood === 'confused'
                  ? 'هممم… شيء ما ليس صحيحاً 🤔'
                  : mood === 'drag'
                    ? 'أتابع يدك بعيوني! 👀'
                    : mood === 'color'
                      ? 'واااو! لون جديد! 🎨'
                      : mood === 'shake'
                        ? 'ورق يا ورق… تهتز معي! 📳'
                        : 'هلا! أنا «ورقي» — سلّمني البلوكات وأنا أتحرك!'}
            </p>
          </div>
        </div>

        {/* ===== Paper block legend (visual match) ===== */}
        <div className="flex flex-col items-center gap-2 mt-1">
          <span className="doodle-title text-[#2b2a33]/80 text-sm font-bold flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-[#ff6b6b]" />
            قطع الورق السحرية (جرّب السحب من اللوحة العامة):
          </span>
          <div className="flex items-center gap-3 flex-wrap justify-center px-2 py-3 bg-[#fffef8]/70 rounded-2xl border-2 border-dashed border-[#2b2a33]/25">
            {BLOCK_PIECES.map((b, i) => (
              <div key={b.label} className="doodle-wobble" style={{ animationDelay: `${i * 0.3}s` }}>
                <CutBlock icon={b.icon} label={b.label} bg={b.bg} tilt={b.tilt} delay={i * 1.2} />
              </div>
            ))}
          </div>
        </div>

        {/* ===== Real Blockly workspace on paper ===== */}
        <div className="relative w-full">
          <p className="doodle-program-caption text-xs sm:text-sm font-bold text-center mb-1.5">
            ✏️ برنامجك يا مبرمج — اسحب القطع هنا ورتّبها
          </p>
          <div className="doodle-blockly-frame bg-[#fffef7] border-2 border-[#2b2a33]/35 rounded-3xl p-2 shadow-[4px_5px_0_rgba(43,42,51,0.12)]">
            <BlocklyWorkspace model="mini_gf" doodle onCodeRun={handleCodeRun} />
          </div>
          <p className="text-[10px] text-[#2b2a33]/45 doodle-title mt-1.5 text-center">
            لوحتك السحرية — اسحب البلوكات من لوحة الفئات (يسار) وشغّل السحر ✨
          </p>
        </div>

        {/* ===== Magic run button ===== */}
        <div className="text-center mt-2">
          <button
            onClick={handleMagic}
            className={`doodle-title text-lg sm:text-xl font-bold px-9 py-3 bg-[#ff6b6b] text-white border-[3px] border-[#2b2a33] rounded-2xl transition active:scale-95 ${magicOn ? 'scale-95 brightness-110' : 'hover:brightness-110'}`}
            style={{ boxShadow: '4px 6px 0 rgba(43,42,51,0.28)' }}
          >
            <Sparkles className="inline w-5 h-5 mb-0.5 ml-1" />
            شغّل السحر ✨
          </button>
          <p className="text-[10px] text-[#2b2a33]/45 doodle-title mt-1.5">
            شغّل السحر يشغّل أصوات الورق؛ شغّل «▶ تشغيل» داخل اللوحة يشغّل حركة ورقي
          </p>
        </div>

        {/* ===== Adventures entrance — open Waraki's own story page ===== */}
        <div className="text-center mt-1">
          <button
            onClick={() => {
              SoundFXManager.playPaperRustle();
              setShowAdventures(true);
            }}
            className="doodle-title text-lg sm:text-2xl font-bold px-10 py-4 bg-gradient-to-l from-[#4d96ff] to-[#6bcb77] text-white border-[3px] border-[#2b2a33] rounded-2xl transition active:scale-95 hover:brightness-110"
            style={{ boxShadow: '5px 7px 0 rgba(43,42,51,0.28)' }}
          >
            ⚡ مغامرات ورقي 📖
          </button>
          <p className="text-[10px] text-[#2b2a33]/45 doodle-title mt-1.5">
            افتح دفتر المغامرة — برمج ورقي ليمشي ويقفز ويقاتل الأشرار!
          </p>
        </div>

        {/* Torn bottom edge of the page */}
        <TornEdge />
      </div>
      </>
      )}
    </div>
  );
};
