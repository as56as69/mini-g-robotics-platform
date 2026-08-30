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

const DEFAULTS: Record<RobotModelType, PinoutMap> = {
  mini_gf: {
    pinLed: '8', pinHaptic: '4', pinTouch: '2',
    pinServo: '18', pinBuzzer: '19',
    pinMotorL: '14', pinMotorR: '27', pinArmL: '25', pinArmR: '26',
  },
  mini_gm: {
    pinLed: '8', pinHaptic: '4', pinTouch: '2',
    pinServo: '18', pinBuzzer: '19',
    pinMotorL: '14', pinMotorR: '27', pinArmL: '25', pinArmR: '26',
  },
  mini_g: {
    pinLed: '8', pinHaptic: '4', pinTouch: '2',
    pinServo: '18', pinBuzzer: '19',
    pinMotorL: '14', pinMotorR: '27', pinArmL: '25', pinArmR: '26',
  },
};

const storageKey = (model: RobotModelType) => `mini_g_pinout_v1_${model}`;

export const pinoutManager = {
  get(model: RobotModelType): PinoutMap {
    try {
      const raw = localStorage.getItem(storageKey(model));
      if (raw) return { ...DEFAULTS[model], ...JSON.parse(raw) };
    } catch (e) {
      // corrupted storage -> fall back to defaults
    }
    return { ...DEFAULTS[model] };
  },
  set(model: RobotModelType, pins: PinoutMap) {
    try {
      localStorage.setItem(storageKey(model), JSON.stringify(pins));
    } catch (e) {
      // storage unavailable -> keep defaults in memory only
    }
  },
};