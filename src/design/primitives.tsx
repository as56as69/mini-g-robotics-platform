import React, { useMemo } from 'react';
import { INK, PAPER, ACCENT, WIGGLE } from './tokens';

/* ============================================================
 * كود ماجيك — مجسمات الهوية الورقية المشتركة (Paper Primitives)
 * أجزاء SVG قابلة لإعادة الاستخدام بين: لعبة ورقي 🦘،
 * مستر شخبوط 🌀، ومغامرات ورقي 📖. كلها بحبر INK وبفلتر
 * الاهتزاز المستقل الجديد (لا يلمس الفلاتر القديمة).
 * ============================================================ */

/** فلتر الاهتزاز المستقل للميزات الجديدة (معرّف فريد لكل مضيف) */
export const WiggleSVG: React.FC<{ id?: string }> = ({ id = 'mcWiggle' }) => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
    <filter id={id}>
      <feTurbulence
        type="fractalNoise"
        baseFrequency={WIGGLE.baseFrequency}
        numOctaves={WIGGLE.numOctaves}
        seed="23"
        result="noise"
      />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale={WIGGLE.scale} />
    </filter>
  </svg>
);

/** مرجع الفلتر المشترك (يُمرَّر في style) */
export const wiggleFilter = (id = 'mcWiggle'): string => `url(#${id})`;

/** مولّد أرقام شبه عشوائي ببذرة — نفس البذرة = نفس الخربشة */
export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ------------------------------------------------------------
 * ورقي — البطل (Jumper): جسم ورق ممزق + تاج + عينان تتبعان
 * viewBox: 0 0 90 130 — نفس نسب مغامرات ورقي
 * ----------------------------------------------------------- */
export const PaperSprite: React.FC<{
  /** إزاحة البؤبؤ [-1..1] أفقيًا/عموديًا */
  lookX?: number;
  lookY?: number;
  /** وضع الحركة: سكون / قفز / سقوط */
  pose?: 'idle' | 'jump' | 'fall';
  className?: string;
}> = ({ lookX = 0, lookY = 0, pose = 'idle', className = '' }) => {
  const squash = pose === 'jump' ? 'scale(0.86,1.12)' : pose === 'fall' ? 'scale(1.08,0.9)' : '';
  return (
    <svg
      viewBox="0 0 90 130"
      className={`w-full h-auto ${className}`}
      style={{ filter: wiggleFilter(), transform: squash, transition: 'transform 0.15s ease-out' }}
      aria-label="ورقي"
    >
      {/* جسم الورق الممزق */}
      <path
        d="M18 34 L14 96 L22 116 L44 122 L68 114 L74 92 L72 36 Q56 26 44 30 Q30 26 18 34 Z"
        fill={PAPER.white}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* أطراف ممزقة */}
      <path d="M18 34 l6 5 M74 36 l-5 6 M14 96 l7 -2 M68 114 l3 -7" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* تاج الورق */}
      <path d="M32 30 L36 12 L44 26 L50 8 L56 26 L64 14 L60 32 Z" fill={ACCENT.yellow} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {/* عينان */}
      <circle cx="34" cy="52" r="9" fill="#fff" stroke={INK} strokeWidth="2.6" />
      <circle cx="58" cy="52" r="9" fill="#fff" stroke={INK} strokeWidth="2.6" />
      <g style={{ transform: `translate(${lookX * 2.6}px, ${lookY * 2}px)` }} className="waraki-pupil">
        <circle cx="34" cy="52" r="3.6" fill={INK} />
        <circle cx="58" cy="52" r="3.6" fill={INK} />
      </g>
      {/* وجنتان + فم */}
      <circle cx="26" cy="66" r="4" fill={ACCENT.pink} opacity="0.55" />
      <circle cx="66" cy="66" r="4" fill={ACCENT.pink} opacity="0.55" />
      <path d="M36 72 Q45 80 56 71" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      {/* أقدام */}
      <path d="M32 122 l-4 8 M58 122 l4 8" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

/* ------------------------------------------------------------
 * منصة ورقية — قطعة كرتون متعرجة (لعبة القفز)
 * ----------------------------------------------------------- */
export const PaperPlatform: React.FC<{
  /** عرض القطعة بوحدات viewBox */
  w?: number;
  moving?: boolean;
  className?: string;
}> = ({ w = 90, moving = false, className = '' }) => {
  const h = 18;
  return (
    <svg
      viewBox={`0 0 ${w} ${h + 6}`}
      className={className}
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      <g style={{ filter: wiggleFilter() }}>
        <path
          d={`M4 6 L${w - 6} 4 L${w - 2} ${h - 2} L8 ${h} Z`}
          fill={PAPER.kraft}
          stroke={INK}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path d={`M10 14 l${w * 0.25} -2 M14 24 l${w * 0.18} -1`} stroke={INK} strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
        {moving && <path d={`M${w * 0.35} 12 q6 -8 12 0 q6 8 12 0`} fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.7" />}
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------
 * عائق ورقي — مكعب مرسوم يدويًا (فصل 3) كعائق لعبة
 * ----------------------------------------------------------- */
export const PaperObstacle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 60 56" className={className} style={{ overflow: 'visible' }} aria-hidden>
    <g style={{ filter: wiggleFilter() }}>
      <path d="M10 20 L18 6 L50 8 L44 24 Z" fill={ACCENT.blue} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M18 8 L18 34 L44 36 L44 8" fill={PAPER.white} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M18 34 L10 22 L10 46 L18 52 L44 54 L44 36" fill={ACCENT.red} opacity="0.85" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    </g>
  </svg>
);

/* ------------------------------------------------------------
 * جسد مستر شخبوط — خربشة خطوط متداخلة ببذرة + عينان
 * ----------------------------------------------------------- */
export const ScribbleBlob: React.FC<{
  /** بذرة الشكل — تتغير = شكل جديد */
  seed: number;
  /** نصف قطر الجسد بوحدات viewBox */
  r?: number;
  /** حالات الحركة */
  mood?: 'idle' | 'think' | 'draw' | 'cheer';
  /** إزاحة البؤبؤ (تتبع المؤشر) [-1..1] */
  lookX?: number;
  lookY?: number;
  className?: string;
}> = ({ seed, r = 60, mood = 'idle', lookX = 0, lookY = 0, className = '' }) => {
  const paths = useMemo(() => {
    const rnd = seededRandom(seed);
    const out: string[] = [];
    for (let k = 0; k < 7; k++) {
      const pts: string[] = [];
      let a = rnd() * Math.PI * 2;
      let rad = r * (0.4 + rnd() * 0.5);
      for (let i = 0; i < 8; i++) {
        a += (rnd() - 0.5) * 2.4;
        rad = Math.max(r * 0.2, Math.min(r, rad + (rnd() - 0.45) * 26));
        pts.push(`${(Math.cos(a) * rad).toFixed(1)} ${(Math.sin(a) * rad).toFixed(1)}`);
      }
      out.push(`M${pts[0]} Q${pts[1]} ${pts[2]} Q${pts[3]} ${pts[4]} Q${pts[5]} ${pts[6]} Q${pts[7]} ${pts[0]}`);
    }
    return out;
  }, [seed, r]);

  const spin = mood === 'think' ? 'shkhoobot-spin 5s linear infinite' : undefined;

  return (
    <svg viewBox="-80 -80 160 160" className={className} style={{ overflow: 'visible' }} aria-label="مستر شخبوط">
      <g style={{ filter: wiggleFilter(), animation: spin }}>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={i === 0 ? PAPER.kraft : INK}
            strokeWidth={i === 0 ? 4 : 2.4}
            strokeLinecap="round"
            opacity={i === 0 ? 0.9 : 0.75}
          />
        ))}
        {/* عينان تتبعان — تُحرَّك عبر CSS var من اللوحة */}
        <circle cx="-16" cy="-8" r="12" fill="#fff" stroke={INK} strokeWidth="2.6" />
        <circle cx="18" cy="-10" r="11" fill="#fff" stroke={INK} strokeWidth="2.6" />
        <g className="shkhoobot-pupil shkhoobot-track" style={{ transform: `translate(${lookX * 4}px, ${lookY * 3}px)` }}>
          <circle cx="-16" cy="-8" r="4.4" fill={INK} />
          <circle cx="18" cy="-10" r="4.4" fill={INK} />
        </g>
        {/* ابتسامة خربشة */}
        <path d="M-14 22 Q0 34 16 20 M-8 28 Q2 36 10 27" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------
 * خلفية العالم الخربشاتي — شمس + غيوم + أرض (المسرح المشترك)
 * ----------------------------------------------------------- */
export const ScribbleWorldBackdrop: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMid slice" className={`absolute inset-0 w-full h-full ${className}`} aria-hidden>
    <g style={{ filter: wiggleFilter() }} stroke={INK} fill="none" strokeLinecap="round">
      {/* الشمس */}
      <g transform="translate(70,64)">
        <circle r="26" fill={ACCENT.yellow} stroke={INK} strokeWidth="3" />
        <path d="M0 -40 L0 -50 M38 -10 l9 3 M28 -28 l8 -7 M-30 -14 l-9 -7 M32 12 l10 3 M-32 10 l-10 2 M-20 30 l-8 4 M20 -32 l6 -8" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* غيوم */}
      <path d="M120 70 q10 -22 34 -16 q8 -18 30 -10 q20 -8 26 10 q20 2 12 18 q-40 8 -100 4 q-8 -6 0 -8 Z" fill="#fff" stroke={INK} strokeWidth="2.6" opacity="0.9" />
      <path d="M420 44 q8 -16 26 -12 q10 -14 26 -4 q16 -4 18 12 q14 4 6 14 q-28 6 -52 2 q-10 -4 -4 -10 q-8 -2 0 -6 Z" fill="#fff" stroke={INK} strokeWidth="2.4" />
    </g>
  </svg>
);
