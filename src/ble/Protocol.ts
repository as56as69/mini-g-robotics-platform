import { RobotModelType } from '../types/robot';

// Protocol Constants
export const BLE_CONFIG = {
  SERVICE_UUID: '0000fff0-0000-1000-8000-00805f9b34fb',
  CHARACTERISTIC_UUID: '0000fff1-0000-1000-8000-00805f9b34fb',
  HEADER_BYTE: 0xAA,
  FOOTER_BYTE: 0x55,
};

export const ROBOT_TYPE_BYTE: Record<RobotModelType, number> = {
  mini_gf: 0x01,
  mini_gm: 0x02,
  mini_g: 0x03,
};

// Command Codes
export const CMD_CODES = {
  // Mini G-F Commands (0x10 - 0x1F)
  GF_SET_LED_RGB: 0x10,
  GF_TRIGGER_HAPTIC: 0x11,
  GF_BLINK_LED: 0x12,

  // Mini G-M Commands (0x20 - 0x2F)
  GM_SET_EXPRESSION: 0x20,
  GM_ROTATE_HEAD: 0x21,
  GM_PLAY_TONE: 0x22,
  GM_NOD_HEAD: 0x23,

  // Mini G Commands (0x30 - 0x3F)
  G_DRIVE_MOTORS: 0x30,
  G_SET_ARM_LEFT: 0x31,
  G_SET_ARM_RIGHT: 0x32,
  G_SET_PERSONA: 0x33,
  G_SPEAK_PHRASE: 0x34,
  G_STOP_ALL: 0x35,
};

export class BLEProtocol {
  /**
   * Builds a packed binary packet:
   * [HEADER: 0xAA] [ROBOT_TYPE: 1B] [CMD: 1B] [LEN: 1B] [DATA: N Bytes] [CHECKSUM: 1B] [FOOTER: 0x55]
   */
  static buildPacket(robotType: RobotModelType, cmd: number, data: number[] = []): Uint8Array {
    const typeByte = ROBOT_TYPE_BYTE[robotType];
    const len = data.length;
    
    // Calculate simple XOR checksum
    let checksum = BLE_CONFIG.HEADER_BYTE ^ typeByte ^ cmd ^ len;
    for (const b of data) {
      checksum ^= b;
    }

    const packet = new Uint8Array(5 + len);
    packet[0] = BLE_CONFIG.HEADER_BYTE;
    packet[1] = typeByte;
    packet[2] = cmd;
    packet[3] = len;
    for (let i = 0; i < len; i++) {
      packet[4 + i] = data[i] & 0xFF;
    }
    packet[4 + len] = checksum;
    return packet;
  }

  // Helper converters
  static hexToRgb(hex: string): [number, number, number] {
    let cleanHex = String(hex ?? '').trim();
    if (cleanHex.startsWith('#')) {
      cleanHex = cleanHex.slice(1);
    }
    // Expand 3-digit (#f00) and 4-digit rgba shorthand (#ef44) to full 6
    if (cleanHex.length === 3 || cleanHex.length === 4) {
      cleanHex = cleanHex.split('').map(c => c + c).join('').slice(0, 6);
    }
    if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
      console.warn(`[BLEProtocol] hexToRgb رفض لوناً غير صالح: "${hex}"`);
      return [0, 0, 0];
    }
    const num = parseInt(cleanHex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
}
