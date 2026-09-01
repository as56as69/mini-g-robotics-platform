import { useMemo } from 'react';
import { INK, ACCENT, PAPER } from '../design/tokens';
import { seededRandom } from '../design/primitives';

/* ============================================================
 * كود ماجيك — مولّد خربشات مستر شخبوط
 * فئات جاهزة (قرار التصميم): حيوانات، مركبات، فضاء، طبيعة، مشاعر.
 * كل رسمة = مسارات خربشة ببذرة عشوائية → لا رسمة تشبه أخرى،
 * وترسم خطًا بخطًا (ظهور القلم) بأسلوب الهوية نفسه.
 * ============================================================
 */

export type ScribbleCategoryId = 'animals' | 'vehicles' | 'space' | 'nature' | 'feelings';

export interface ScribbleItem {
  id: string;
  labelAr: string;
  icon: string;
  /** مسارات الخربشة الأساسية (تُولَّد حولها الشخبطة) */
  strokes: string[];
  accent: keyof typeof ACCENT;
}

export interface ScribbleCategory {
  id: ScribbleCategoryId;
  labelAr: string;
  icon: string;
  accent?: keyof typeof ACCENT;
  items: ScribbleItem[];
}

/** توليد شخبطة حول نقطة — خطوط متعرجة عشوائية بالبذرة */
function scribbleAround(seed: number, cx: number, cy: number, r: number, count: number): string[] {
  const rnd = seededRandom(seed);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const a0 = rnd() * Math.PI * 2;
    const r0 = r * (0.35 + rnd() * 0.55);
    let x = cx + Math.cos(a0) * r0;
    let y = cy + Math.sin(a0) * r0;
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    const segs = 4 + Math.floor(rnd() * 4);
    for (let s = 0; s < segs; s++) {
      const a = a0 + s * 1.9 + (rnd() - 0.5) * 1.4;
      const rr = r * (0.25 + rnd() * 0.65);
      x = cx + Math.cos(a) * rr;
      y = cy + Math.sin(a) * rr;
      d += ` Q${(cx + Math.cos(a + 0.6) * rr * 1.15).toFixed(1)} ${(cy + Math.sin(a + 0.6) * rr * 1.15).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    out.push(d);
  }
  return out;
}

/** توليد رسمة كاملة لغرض — خربشة حول مساراته الأساسية */
export function buildScribble(item: ScribbleItem, seed: number): { base: string[]; halo: string[] } {
  const rnd = seededRandom(seed);
  const halo: string[] = [];
  // خربشات هالей حول كل مسار أساسي
  item.strokes.forEach((_, idx) => {
    const n = 2 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) halo.push(...scribbleAround(seed + i * 31 + idx * 7, 100 + (rnd() - 0.5) * 40, 100 + (rnd() - 0.5) * 40, 55 + rnd() * 25, 1));
  });
  return { base: item.strokes, halo };
}

/* ================= الفئات الجاهزة ================= */

const CATEGORIES: ScribbleCategory[] = [
  {
    id: 'animals',
    icon: '🐸',
    labelAr: 'حيوانات',
    accent: 'green',
    items: [
      {
        id: 'cat',
        labelAr: 'قطة',
        icon: '🐱',
        accent: 'green',
        strokes: [
          'M60 120 Q50 70 85 55 Q100 30 120 50 Q150 35 160 60 Q185 75 170 115 Q160 150 110 150 Q70 150 60 120 Z',
          'M85 55 L78 30 L100 48 M135 50 L145 28 L155 52',
          'M100 90 q6 -8 12 0 M140 88 q6 -8 12 0 M115 110 q10 12 22 0',
        ],
      },
      {
        id: 'fish',
        labelAr: 'سمكة',
        icon: '🐟',
        accent: 'blue',
        strokes: [
          'M50 110 Q90 60 150 100 Q170 108 180 100 Q175 115 180 128 Q165 122 150 130 Q95 160 50 120 Q42 115 50 110 Z',
          'M150 100 l30 -22 M152 122 l28 20 M158 112 q8 -4 14 0',
          'M75 105 q6 -6 12 0 M95 118 q6 -6 12 0',
        ],
      },
      {
        id: 'bird',
        labelAr: 'طائر',
        icon: '🐦',
        accent: 'yellow',
        strokes: [
          'M70 120 Q80 70 120 65 Q160 60 165 100 Q168 135 130 140 Q92 145 70 120 Z',
          'M120 66 q10 -26 30 -20 q-8 14 -4 22 M95 75 l-22 -14 M148 80 l20 -12',
          'M110 95 q6 -7 12 0 M138 93 q6 -7 12 0 M118 112 q10 10 20 0',
        ],
      },
    ],
  },
  {
    id: 'vehicles',
    icon: '🚗',
    labelAr: 'مركبات',
    accent: 'blue',
    items: [
      {
        id: 'car',
        labelAr: 'سيارة',
        icon: '🚗',
        accent: 'blue',
        strokes: [
          'M40 130 L48 96 Q90 78 140 82 Q180 86 186 108 L190 130 Q150 142 110 140 Q70 142 40 130 Z',
          'M78 98 q18 -18 48 -14 q4 14 -2 20 q-24 4 -46 -6 Z',
          'circle:70,138,14 circle:150,138,14',
        ],
      },
      {
        id: 'rocket',
        labelAr: 'صاروخ',
        icon: '🚀',
        accent: 'red',
        strokes: [
          'M100 30 Q130 55 132 100 Q134 140 118 158 L82 158 Q66 138 68 98 Q72 56 100 30 Z',
          'M100 70 q10 10 0 26 q-10 -12 0 -26 M82 158 l-14 26 l20 -12 M118 158 l14 26 l-20 -12',
          'circle:100,85,10',
        ],
      },
    ],
  },
  {
    id: 'space',
    icon: '🌙',
    labelAr: 'فضاء',
    accent: 'blue',
    items: [
      {
        id: 'moon',
        labelAr: 'قمر',
        icon: '🌙',
        accent: 'yellow',
        strokes: [
          'M120 35 a68 68 0 1 0 2 130 a52 52 0 0 1 -2 -130 Z',
          'circle:95,85,9 circle:75,120,7 circle:110,120,5',
        ],
      },
      {
        id: 'star',
        labelAr: 'نجمة',
        icon: '⭐',
        accent: 'orange',
        strokes: [
          'M100 30 L114 78 L165 78 L124 108 L140 158 L100 126 L60 158 L76 108 L35 78 L86 78 Z',
          'M92 70 q8 -8 16 0 M112 100 q6 8 -2 14',
        ],
      },
    ],
  },
  {
    id: 'nature',
    icon: '🌳',
    labelAr: 'طبيعة',
    accent: 'green',
    items: [
      {
        id: 'tree',
        labelAr: 'شجرة',
        icon: '🌳',
        accent: 'green',
        strokes: [
          'M100 60 q-46 -6 -40 36 q-30 40 24 44 q30 26 62 2 q44 2 34 -44 q-4 -40 -80 -38 Z',
          'M96 140 l4 40 M96 160 q-16 -4 -22 -16 M100 158 q14 -2 20 -12',
        ],
      },
      {
        id: 'sun',
        labelAr: 'شمس',
        icon: '☀️',
        accent: 'yellow',
        strokes: [
          'circle:100,100,42',
          'M100 34 v-16 M100 166 v-16 M34 100 h-16 M182 100 h-16 M52 52 l-12 -12 M148 52 l12 -12 M52 148 l-12 12 M148 148 l12 12',
        ],
      },
    ],
  },
  {
    id: 'feelings',
    icon: '💖',
    labelAr: 'مشاعر',
    accent: 'pink',
    items: [
      {
        id: 'heart',
        labelAr: 'قلب',
        icon: '💖',
        accent: 'pink',
        strokes: [
          'M100 150 Q40 110 48 72 Q54 44 84 48 Q100 52 100 68 Q100 52 116 48 Q146 44 152 72 Q160 110 100 150 Z',
          'M78 78 q-8 8 -4 18 M120 76 q8 8 4 18',
        ],
      },
      {
        id: 'smile',
        labelAr: 'ابتسامة',
        icon: '😊',
        accent: 'orange',
        strokes: [
          'circle:100,100,52',
          'circle:84,88,5 circle:120,88,5 M78 112 q22 22 44 0',
        ],
      },
    ],
  },
];

export const SCRIBBLE_CATEGORIES = CATEGORIES;

/** اختيار ورقة عشوائية للجلسة (قرار التصميم: ورقة مختلفة لكل جلسة) */
export const SESSION_PAPERS = [
  { id: 'dotted', bg: PAPER.white, label: 'ورقة منقّطة' },
  { id: 'lined', bg: PAPER.cream, label: 'ورقة مخططة' },
  { id: 'kraft', bg: PAPER.kraft, label: 'ورق أسمر' },
  { id: 'warm', bg: PAPER.warm, label: 'ورق دافئ' },
] as const;

export function pickRandomPaper(): (typeof SESSION_PAPERS)[number] {
  return SESSION_PAPERS[Math.floor(Math.random() * SESSION_PAPERS.length)];
}

/** مكوّن الرسمة — يعرض مسارات الخربشة مع ظهور تدريجي (قلم يرسم) */
export const ScribbleDrawing: React.FC<{
  item: ScribbleItem;
  seed: number;
  live?: boolean;
  className?: string;
}> = ({ item, seed, live = false, className = '' }) => {
  const { base, halo } = useMemo(() => buildScribble(item, seed), [item, seed]);
  const accent = ACCENT[item.accent];
  let order = 0; // تأخير متدرّج لكل مسار — القلم يرسم بالترتيب
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label={item.labelAr}>
      <g style={{ filter: 'url(#mcWiggle)' }}>
        {halo.map((d, i) => {
          const delay = (order++) * 0.12;
          return (
            <path
              key={`h${i}`}
              d={d}
              fill="none"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity={live ? 0.28 : 0}
              className={live ? 'scribble-live' : ''}
              style={{ animationDelay: `${delay}s`, '--slen': 900 } as React.CSSProperties}
            />
          );
        })}
        {base.map((d, i) => {
          if (d.startsWith('circle:')) {
            const parts = d.split(' ');
            return (
              <>
                {parts.map((seg, j) => {
                  const [cx, cy, r] = seg.slice(7).split(',').map(Number);
                  const delay = (order++) * 0.12;
                  return (
                    <circle
                      key={`c${i}-${j}`}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={INK}
                      strokeWidth="2.6"
                      className={live ? 'scribble-live' : ''}
                      style={{ animationDelay: `${delay}s`, '--slen': 300 } as React.CSSProperties}
                    />
                  );
                })}
              </>
            );
          }
          const delay = (order++) * 0.12;
          return (
            <path
              key={`b${i}`}
              d={d}
              fill={i === 0 ? `${accent}22` : 'none'}
              stroke={INK}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={live ? 'scribble-live' : ''}
              style={{ animationDelay: `${delay + 0.6}s`, '--slen': 1400 } as React.CSSProperties}
            />
          );
        })}
      </g>
    </svg>
  );
};
