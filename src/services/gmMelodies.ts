/**
 * Named melodies for the Mini G-M speaker. Each melody is a short sequence of
 * [frequencyHz, durationMs] notes. The generator unrolls the melody into
 * successive GM_PLAY_TONE commands (freq ÷10, duration blocks of 100ms) with
 * tiny gaps, so the robot's piezo plays an actual tune instead of one flat
 * note that sounds identical for every option.
 */

export interface ToneNote {
  /** Frequency in Hz (real scale, divided by 10 before transmission) */
  freq: number;
  /** Duration in milliseconds */
  ms: number;
}

export interface GMMelody {
  id: string;
  labelAr: string;
  icon: string;
  notes: ToneNote[];
}

export const GM_MELODIES: Record<string, GMMelody> = {
  victory: {
    id: 'victory',
    labelAr: 'لحن الفوز: دو-مي-سول صاعد',
    icon: '🎉',
    notes: [
      { freq: 523, ms: 150 }, // C5
      { freq: 659, ms: 150 }, // E5
      { freq: 784, ms: 300 }, // G5 (held)
    ],
  },
  greeting: {
    id: 'greeting',
    labelAr: 'لحن الترحيب المرح',
    icon: '👋',
    notes: [
      { freq: 587, ms: 120 }, // D5
      { freq: 784, ms: 120 }, // G5
      { freq: 659, ms: 150 }, // E5
      { freq: 880, ms: 200 }, // A5
    ],
  },
  bell: {
    id: 'bell',
    labelAr: 'جرس المذاكرة (جرستان)',
    icon: '🔔',
    notes: [
      { freq: 880, ms: 180 },
      { freq: 0, ms: 120 }, // silence gap so two strikes are distinct
      { freq: 880, ms: 350 },
    ],
  },
  alert: {
    id: 'alert',
    labelAr: 'تنبيه حذر: نغمتان حادتان',
    icon: '❗',
    notes: [
      { freq: 660, ms: 110 },
      { freq: 0, ms: 90 }, // brief silence between beeps
      { freq: 330, ms: 220 },
    ],
  },
  calm: {
    id: 'calm',
    labelAr: 'هادئ نغمة صاعدة',
    icon: '🎹',
    notes: [
      { freq: 392, ms: 200 }, // G4
      { freq: 440, ms: 220 }, // A4
      { freq: 494, ms: 220 }, // B4
      { freq: 523, ms: 300 }, // C5
    ],
  },
  thinking: {
    id: 'thinking',
    labelAr: 'فكرة: دو-سول منخفض',
    icon: '🤔',
    notes: [
      { freq: 262, ms: 180 }, // C4
      { freq: 392, ms: 300 }, // G4
    ],
  },
};

export const GM_MELODY_LIST: GMMelody[] = Object.values(GM_MELODIES);
