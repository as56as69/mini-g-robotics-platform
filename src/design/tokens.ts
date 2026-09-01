/**
 * ============================================================
 * كود ماجيك — رموز الهوية البصرية الموحّدة (Design Tokens)
 * المصدر الوحيد للألوان والحدود والزوايا والظلال لكل ما هو
 * «ورقي/خربشاتي»: دفتر الكود، مغامرات ورقي، لعبة ورقي،
 * ومستر شخبوط. ممنوع اختراع لون أو حد خارج هذا الملف.
 * ============================================================
 */

/** حبر القلم — كل الحدود والرسمات */
export const INK = '#2b2a33';

/** أوراق الدفتر */
export const PAPER = {
  white: '#fffef7',
  cream: '#fffef8',
  kraft: '#e8c98f',
  warm: '#f5f0e1',
  note: '#ffecc2',
  shadowBg: 'rgba(43, 42, 51, 0.15)',
} as const;

/** الألوان الزاهية الستة (بلوكات الورق + التمييز) */
export const ACCENT = {
  red: '#ff6b6b',
  yellow: '#ffd93d',
  green: '#6bcb77',
  blue: '#4d96ff',
  pink: '#ff6b9d',
  orange: '#ff9f43',
} as const;

/** إعدادات فلتر الاهتزاز اليدوي (SVG wiggle) */
export const WIGGLE = {
  baseFrequency: 0.012,
  numOctaves: 2,
  scale: 3.5,
} as const;

/** زوايا «المقصّ الورقي» المتعرجة (wobbly radii) */
export const WOBBLY_RADIUS = {
  card: '20px 28px 18px 26px / 22px 18px 28px 18px',
  block: '14px 20px 12px 18px / 16px 12px 20px 12px',
  pill: '12px 18px 12px 18px / 16px 12px 18px 12px',
} as const;

/** الظل الصلب المزاح (ورق فوق ورق) */
export const paperShadow = (strong = false): string =>
  strong ? '5px 7px 0 rgba(43,42,51,0.28)' : '3px 4px 0 rgba(43,42,51,0.18)';

/** خطوط عائلية الهوية */
export const FONT_DOODLE = "'Cairo Play', 'Cairo', cursive, sans-serif";

/** مقياس السرعة/الحركة للألعاب الورقية (ms) */
export const MOTION = {
  pop: 450,
  bounce: 620,
  wobble: 2400,
  blink: 3800,
} as const;
