import { RobotModelType } from '../types/robot';

export interface PinoutMap {
  pinLed: string;
  pinHaptic: string;
  pinTouch: string;
  pinServo: string;
  pinBuzzer: string;
  pinMotorL: string;
  pinMotorR: string;
  pinArmL: string;
  pinArmR: string;
}

/**
 * Per-model defaults — only the fields each model actually owns are filled;
 * unrelated fields are empty so conflicts and exports never leak stale values.
 * Values mirror src/firmware/*.ino #defines.
 */
const DEFAULTS: Record<RobotModelType, PinoutMap> = {
  mini_gf: {
    pinLed: '8', pinHaptic: '4', pinTouch: '2',
    pinServo: '', pinBuzzer: '',
    pinMotorL: '', pinMotorR: '', pinArmL: '', pinArmR: '',
  },
  mini_gm: {
    pinLed: '', pinHaptic: '', pinTouch: '',
    pinServo: '18', pinBuzzer: '19',
    pinMotorL: '', pinMotorR: '', pinArmL: '', pinArmR: '',
  },
  mini_g: {
    pinLed: '', pinHaptic: '', pinTouch: '',
    pinServo: '', pinBuzzer: '',
    pinMotorL: '14', pinMotorR: '27', pinArmL: '25', pinArmR: '26',
  },
};

/** Pin fields each model actually exposes in the UI (for validation/conflicts) */
/** Which side of the chip each component's wire routes to (for the schematic) */
export interface SchematicPin {
  field: keyof PinoutMap;
  side: 'left' | 'right';
}

export const MODEL_PIN_FIELDS: Record<RobotModelType, (keyof PinoutMap)[]> = {
  mini_gf: ['pinLed', 'pinHaptic', 'pinTouch'],
  mini_gm: ['pinServo', 'pinBuzzer'],
  mini_g: ['pinMotorL', 'pinMotorR', 'pinArmL', 'pinArmR'],
};

/** Side routing for the interactive schematic (chip in the middle) */
export const MODEL_PIN_SIDES: Record<RobotModelType, SchematicPin[]> = {
  mini_gf: [
    { field: 'pinLed', side: 'right' },
    { field: 'pinHaptic', side: 'left' },
    { field: 'pinTouch', side: 'right' },
  ],
  mini_gm: [
    { field: 'pinServo', side: 'left' },
    { field: 'pinBuzzer', side: 'right' },
  ],
  mini_g: [
    { field: 'pinMotorL', side: 'left' },
    { field: 'pinMotorR', side: 'left' },
    { field: 'pinArmL', side: 'right' },
    { field: 'pinArmR', side: 'right' },
  ],
};

const storageKey = (model: RobotModelType) => `mini_g_pinout_v1_${model}`;

export const pinoutManager = {
  get(model: RobotModelType): PinoutMap {
    try {
      const raw = localStorage.getItem(storageKey(model));
      if (raw) return { ...DEFAULTS[model], ...JSON.parse(raw) };
    } catch {
      // corrupted storage -> fall back to defaults
    }
    return { ...DEFAULTS[model] };
  },
  set(model: RobotModelType, pins: PinoutMap) {
    try {
      localStorage.setItem(storageKey(model), JSON.stringify(pins));
    } catch {
      // storage unavailable -> keep defaults in memory only
    }
  },
  /** Restore factory defaults for a model */
  reset(model: RobotModelType) {
    try {
      localStorage.removeItem(storageKey(model));
    } catch { /* noop */ }
    return { ...DEFAULTS[model] };
  },
};
