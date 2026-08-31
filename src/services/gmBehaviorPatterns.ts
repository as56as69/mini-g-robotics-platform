import { CMD_CODES } from '../ble/Protocol';

/**
 * Pre-built behavior sequences for the Mini G-M desktop companion.
 * Each pattern is unrolled client-side from commands that already exist in
 * the firmware (0x20 expression, 0x21 head, 0x22 tone, 0x23 nod) with waits
 * between steps — both the real robot and the simulator react identically
 * with zero firmware changes.
 */

export interface PatternStep {
  /** Wait before this step, in milliseconds */
  wait?: number;
  cmd?: number;
  data?: number[] | string;
}

export interface GMPattern {
  id: string;
  labelAr: string;
  icon: string;
  /** Short description shown as a tooltip / subtitle */
  descAr: string;
  steps: PatternStep[];
}

export const GM_PATTERNS: Record<string, GMPattern> = {
  greet: {
    id: 'greet',
    labelAr: 'تحية الترحيب',
    icon: '👋',
    descAr: 'يغمز → نغمة ترحيب → رأس يمين/يسار',
    steps: [
      { cmd: CMD_CODES.GM_SET_EXPRESSION, data: [5] }, // wink
      { wait: 250 },
      { cmd: CMD_CODES.GM_PLAY_TONE, data: [65, 2] }, // 659Hz greeting (÷10)
      { wait: 500 },
      { cmd: CMD_CODES.GM_ROTATE_HEAD, data: [45] },
      { wait: 350 },
      { cmd: CMD_CODES.GM_ROTATE_HEAD, data: [256 - 45] }, // -45 → unsigned
      { wait: 350 },
      { cmd: CMD_CODES.GM_ROTATE_HEAD, data: [0] },
      { cmd: CMD_CODES.GM_SET_EXPRESSION, data: [0] }, // happy
    ],
  },
  study: {
    id: 'study',
    labelAr: 'وقت المذاكرة',
    icon: '🔔',
    descAr: 'نظارة البطل → جرس مذاكرة → إيماءة موافقة',
    steps: [
      { cmd: CMD_CODES.GM_SET_EXPRESSION, data: [4] }, // cool
      { wait: 300 },
      { cmd: CMD_CODES.GM_PLAY_TONE, data: [88, 4] }, // 880Hz study bell
      { wait: 500 },
      { cmd: CMD_CODES.GM_NOD_HEAD, data: [2] },
    ],
  },
  bedtime: {
    id: 'bedtime',
    labelAr: 'وقت النوم',
    icon: '😴',
    descAr: 'نائم وهادئ مع لحن مريح',
    steps: [
      { cmd: CMD_CODES.GM_SET_EXPRESSION, data: [3] }, // sleepy
      { wait: 250 },
      { cmd: CMD_CODES.GM_PLAY_TONE, data: [44, 3] }, // 440Hz calm
    ],
  },
  celebrate: {
    id: 'celebrate',
    labelAr: 'احتفال بالنجاح',
    icon: '🎉',
    descAr: 'قلوب → نغمة فوز → رأس يمين ويسار',
    steps: [
      { cmd: CMD_CODES.GM_SET_EXPRESSION, data: [2] }, // love
      { wait: 200 },
      { cmd: CMD_CODES.GM_PLAY_TONE, data: [52, 3] }, // 523Hz victory
      { wait: 400 },
      { cmd: CMD_CODES.GM_ROTATE_HEAD, data: [45] },
      { wait: 300 },
      { cmd: CMD_CODES.GM_ROTATE_HEAD, data: [256 - 45] },
      { wait: 300 },
      { cmd: CMD_CODES.GM_SET_EXPRESSION, data: [0] }, // back to happy
    ],
  },
  surprise: {
    id: 'surprise',
    labelAr: 'تنبيه مفاجأة',
    icon: '❗',
    descAr: 'مندهش → نغمة تنبيه → رأس للوسط',
    steps: [
      { cmd: CMD_CODES.GM_SET_EXPRESSION, data: [1] }, // surprised
      { cmd: CMD_CODES.GM_PLAY_TONE, data: [33, 2] }, // 330Hz alert
      { wait: 600 },
      { cmd: CMD_CODES.GM_ROTATE_HEAD, data: [0] },
    ],
  },
};

export const GM_PATTERN_LIST: GMPattern[] = Object.values(GM_PATTERNS);

/** Async sleep helper */
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Executes a pattern's steps sequentially against the given dispatch function
 * (usually bleService.sendCommand). Waits are honored between steps.
 */
export async function runGMPatternSteps(
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
