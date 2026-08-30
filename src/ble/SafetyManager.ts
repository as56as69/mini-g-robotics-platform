export interface SafetySettings {
  bleRestricted: boolean;
  voiceSafeFilter: boolean;
  maxVolumeLimit: number;
  studentCodeExportAllowed: boolean;
}

const DEFAULTS: SafetySettings = {
  bleRestricted: false,
  voiceSafeFilter: true,
  maxVolumeLimit: 80,
  studentCodeExportAllowed: true,
};

const STORAGE_KEY = 'mini_g_safety_v1';

let settings: SafetySettings = load();

function load(): SafetySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (e) {
    // corrupted storage -> fall back to defaults
  }
  return { ...DEFAULTS };
}

const listeners: Array<(s: SafetySettings) => void> = [];

export const safetyManager = {
  get(): SafetySettings {
    return { ...settings };
  },
  update(partial: Partial<SafetySettings>) {
    settings = { ...settings, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // storage full/unavailable -> continue in-memory only
    }
    listeners.forEach(l => l(settings));
  },
  onChange(cb: (s: SafetySettings) => void) {
    listeners.push(cb);
    return () => {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    };
  },
};

// Small classroom-appropriate guard list. Phrases matching these words are
// replaced with a friendly fallback instead of being spoken by the robot.
const BLOCKED_WORDS = [
  'ناب', 'سب', 'شتم', 'ضرب', 'قتل', 'حرق', 'كره', 'حقد',
];

export function isChildSafePhrase(text: string): boolean {
  if (!text) return true;
  const norm = text
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا');
  return !BLOCKED_WORDS.some(w => norm.includes(w));
}

export const CHILD_SAFE_FALLBACK =
  'عذراً، لا يمكنني قول ذلك. دعنا نتعلم شيئاً مفيداً! 😊';