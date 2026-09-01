import React, { useMemo } from 'react';
import { INK, PAPER, ACCENT } from './tokens';

/* ============================================================
 * كود ماجيك — مجسمات الهوية الورقية المشتركة (Paper Primitives)
 * أجزاء SVG قابلة لإعادة الاستخدام بين: لعبة ورقي 🦘،
 * مستر شخبوط 🌀، ومغامرات ورقي 📖.
 * قاعدة تقنية صارمة: لا مراجع فلاتر عبر-المستند إطلاقًا
 * (url(#id) على عناصر متحركة يُفرغ الرسم في بعض المحركات) —
 * الاهتزاز عبر كلاسات CSS في index.css بدلًا من SVG filters.
 * ============================================================ */

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
      className={`mc-wiggle ${className}`}
      style={{ transform: squash, transition: 'transform 0.15s ease-out', overflow: 'visible' }}
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
      style={{ overflow: 'visible', display: 'block', width: '100%', height: 'auto' }}
      aria-hidden
    >
      <path
        d={`M4 6 L${w - 6} 4 L${w - 2} ${h - 2} L8 ${h} Z`}
        fill={PAPER.kraft}
        stroke={INK}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d={`M10 11 l${w * 0.25} -2 M14 17 l${w * 0.18} -1`} stroke={INK} strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
      {moving && <path d={`M${w * 0.35} 12 q6 -8 12 0 q6 8 12 0`} fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.7" />}
    </svg>
  );
};

/* ------------------------------------------------------------
 * عائق ورقي — مكعب مرسوم يدويًا (فصل 3) كعائق لعبة
 * ----------------------------------------------------------- */
export const PaperObstacle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 60 56" className={className} style={{ overflow: 'visible' }} aria-hidden>
    <path d="M10 20 L18 6 L50 8 L44 24 Z" fill={ACCENT.blue} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M18 8 L18 34 L44 36 L44 8" fill={PAPER.white} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M18 34 L10 22 L10 46 L18 52 L44 54 L44 36" fill={ACCENT.red} opacity="0.85" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
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
  style?: React.CSSProperties;
}> = ({ seed, r = 60, mood = 'idle', lookX = 0, lookY = 0, className = '', style }) => {
  const paths = React.useMemo(() => {
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

  return (
    <svg
      viewBox="-80 -80 160 160"
      className={className}
      style={{ overflow: 'visible', display: 'block', width: '100%', height: '100%', ...style }}
      aria-label="مستر شخبوط"
      preserveAspectRatio="xMidYMid meet"
    >
      <g className={mood === 'think' ? 'mc-wiggle-anim' : undefined}>
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
        {/* عينان تتبعان */}
        <circle cx="-16" cy="-8" r="12" fill="#fff" stroke={INK} strokeWidth="2.6" />
        <circle cx="18" cy="-10" r="11" fill="#fff" stroke={INK} strokeWidth="2.6" />
        <g className="shkhoobot-pupil" style={{ transform: `translate(${lookX * 4}px, ${lookY * 3}px)` }}>
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
 * خلفية العالم الخربشاتي — شمس + غيوم (المسرح المشترك)
 * ساكنة تمامًا (بلا فلتر) — CSS wobble فقط على الشمس
 * ----------------------------------------------------------- */
/* ------------------------------------------------------------
 * كرة لونية خربشاتية — نقاط لعبة ورقي (نظام التقدم الوحيد)
 * ----------------------------------------------------------- */
export const PaperOrb: React.FC<{
  colorIdx: number;
  className?: string;
}> = ({ colorIdx = 0, className = '' }) => {
  const colors = [ACCENT.yellow, ACCENT.blue, ACCENT.green, ACCENT.pink, ACCENT.red, ACCENT.orange];
  const c = colors[colorIdx % colors.length];
  return (
    <svg viewBox="0 0 22 22" className={className} style={{ overflow: 'visible', display: 'block', width: 22, height: 22 }} aria-hidden>
      <circle cx="11" cy="11" r="8.5" fill={colors[colorIdx % colors.length]} stroke={INK} strokeWidth="2" opacity="0.92" />
      <path d="M7 8 q2 -3 5 -2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
      <circle cx="14.5" cy="8" r="1.1" fill="#fff" opacity="0.85" />
    </svg>
  );
};

/* ------------------------------------------------------------
 * بالونة إنقاذ — ورقية بحبل خربشة (تمسك ورقي من تاجه)
 * ----------------------------------------------------------- */
export const PaperBalloon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 70 120" className={className} style={{ overflow: 'visible' }} aria-label="بالونة الإنقاذ">
    {/* حبل خربشة */}
    <path d="M35 62 q-8 16 2 26 q8 10 0 34" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
    {/* البالونة */}
    <path d="M35 4 C14 4 6 20 8 34 C10 48 24 52 35 52 C46 52 62 48 62 34 C64 20 56 4 35 4 Z" fill={ACCENT.pink} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d="M22 14 q-7 8 -7 18" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    {/* عقدة + ربطة */}
    <path d="M30 52 L32 60 L40 60 L38 52 Z" fill={ACCENT.yellow} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------------
 * خلفية العالم الخربشاتي — 4 ثيمات (كل 10 كرات تتقدم واحدًا)
 * كل ثيم: لون ورق + لون الشمس وموضعها + غيوم بأماكن مختلفة
 * ----------------------------------------------------------- */
export const BACKDROP_THEMES = [
  { paper: '#fffef7', sun: ACCENT.yellow, sunX: 70, sunY: 64, clouds: [120, 420], ground: '#eef7ef' },
  { paper: '#fdfbf4', sun: ACCENT.orange, sunX: 470, sunY: 60, clouds: [90, 330], ground: '#fdf6e3' },
  { paper: '#fdf6e3', sun: ACCENT.red, sunX: 460, sunY: 84, clouds: [170, 470], ground: '#fdeee3' },
  { paper: '#eafaf0', sun: ACCENT.blue, sunX: 300, sunY: 52, clouds: [60, 260, 430], ground: '#e8f6fd' },
] as const;

export const ScribbleWorldBackdrop: React.FC<{ variant?: number; className?: string }> = ({ variant = 0, className = '' }) => {
  const t = BACKDROP_THEMES[variant % BACKDROP_THEMES.length];
  return (
    <svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMid slice" className={`absolute inset-0 w-full h-full ${className}`} aria-hidden>
      <rect x="0" y="0" width="560" height="320" fill={t.paper} />
      <g stroke={INK} fill="none" strokeLinecap="round">
        {/* الشمس — لون وموضع من الثيم */}
        <g className="mc-sun-wobble" transform={`translate(${t.sunX},${t.sunY})`}>
          <circle r="26" fill={t.sun} stroke={INK} strokeWidth="3" />
          <path d="M0 -40 L0 -50 M38 -10 l9 3 M28 -28 l8 -7 M-30 -14 l-9 -7 M32 12 l10 3 M-32 10 l-10 2 M-20 30 l-8 4 M20 -32 l6 -8" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </g>
        {/* غيوم بأماكن الثيم */}
        {t.clouds.map((cx, i) => (
          <path
            key={i}
            d={`M${cx} ${i % 2 ? 70 : 46} q10 -22 34 -16 q8 -18 30 -10 q20 -8 26 10 q20 2 12 18 q-40 8 -100 4 q-8 -6 0 -8 Z`}
            fill="#fff"
            stroke={INK}
            strokeWidth="2.5"
            opacity="0.92"
          />
        ))}
        {/* أرض خربشة أسفل الخلفية */}
        <path d={`M0 300 q70 -8 140 0 q70 8 140 0 q70 -8 140 0 q70 8 140 0 L560 320 L0 320 Z`} fill={t.ground} stroke={INK} strokeWidth="2.4" opacity="0.55" />
      </g>
    </svg>
  );
};
