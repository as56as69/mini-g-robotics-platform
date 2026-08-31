import { CMD_CODES } from '../ble/Protocol';

/**
 * Pre-built behavior sequences for the Mini G-F keychain robot.
 * Each pattern is unrolled client-side from commands that already exist in
 * the firmware (0x10 set color, 0x11 haptic, 0x12 blink) with waits between
 * steps — so both the real robot and the simulator react identically with
 * zero firmware changes.
 */

export interface PatternStep {
  /** Wait before this step, in milliseconds */
  wait?: number;
  cmd?: number;
  data?: number[] | string;
}

export interface GFPattern {
  id: string;
  labelAr: string;
  icon: string;
  /** Short description shown as a tooltip / subtitle */
  descAr: string;
  steps: PatternStep[];
}

/** Color palette shortcuts */
export const GF_COLORS = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  white: '#ffffff',
  off: '#000000',
} as const;

export const GF_PATTERNS: Record<string, GFPattern> = {
  celebrate: {
    id: 'celebrate',
    labelAr: 'سلوك الاحتفال',
    icon: '🎉',
    descAr: 'أخضر → وميض ×3 → نبضتان فرح',
    steps: [
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.green },
      { wait: 300 },
      { cmd: CMD_CODES.GF_BLINK_LED, data: [3] },
      { wait: 400 },
      { cmd: CMD_CODES.GF_TRIGGER_HAPTIC, data: [80] },
    ],
  },
  alarm: {
    id: 'alarm',
    labelAr: 'سلوك الإنذار',
    icon: '🚨',
    descAr: 'أحمر → وميض سريع ×5 → نبضة قوية',
    steps: [
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.red },
      { wait: 150 },
      { cmd: CMD_CODES.GF_BLINK_LED, data: [5] },
      { wait: 400 },
      { cmd: CMD_CODES.GF_TRIGGER_HAPTIC, data: [80] },
    ],
  },
  heartbeat: {
    id: 'heartbeat',
    labelAr: 'نبض القلب',
    icon: '💓',
    descAr: 'نبضتان هادئتان بالأحمر',
    steps: [
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.red },
      { wait: 100 },
      { cmd: CMD_CODES.GF_TRIGGER_HAPTIC, data: [60] },
      { wait: 500 },
      { cmd: CMD_CODES.GF_TRIGGER_HAPTIC, data: [60] },
    ],
  },
  rainbow: {
    id: 'rainbow',
    labelAr: 'سلوك قوس قزح',
    icon: '🌈',
    descAr: 'دورة على خمسة ألوان سعيدة',
    steps: [
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.red },
      { wait: 350 },
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.yellow },
      { wait: 350 },
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.green },
      { wait: 350 },
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.blue },
      { wait: 350 },
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.purple },
      { wait: 350 },
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.pink },
      { wait: 350 },
    ],
  },
  sos: {
    id: 'sos',
    labelAr: 'سلوك استغاثة',
    icon: '🆘',
    descAr: 'ثلاث ومضات قصيرة، ثلاث طويلة، ثلاث ومضات',
    steps: [
      { cmd: CMD_CODES.GF_BLINK_LED, data: [3] },
      { wait: 600 },
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.red },
      { wait: 900 },
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.off },
      { wait: 300 },
      { cmd: CMD_CODES.GF_BLINK_LED, data: [3] },
      { wait: 300 },
      { cmd: CMD_CODES.GF_SET_LED_RGB, data: GF_COLORS.off },
    ],
  },
};

export const GF_PATTERN_LIST: GFPattern[] = Object.values(GF_PATTERNS);

/** Async sleep helper */
export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Executes a pattern's steps sequentially against the given dispatch function
 * (usually window.__BLE_DISPATCH__). Skips unknown step fields gracefully.
 */
export async function runGFPatternSteps(
  steps: PatternStep[],
  dispatch: (cmd: number, data: number[] | string) => Promise<void>,
): Promise<void> {
  for (const step of steps) {
    if (step.wait) {
      await sleep(step.wait);
    }
    if (step.cmd != null) {
      await dispatch(step.cmd, step.data ?? []);
    }
  }
}
