import { BLEProtocol, CMD_CODES } from './Protocol';
import { ROBOT_MODELS } from '../types/robot';

export function runSimulatorSelfTests(): { passed: boolean; details: string[] } {
  const details: string[] = [];
  let allPassed = true;

  // Test 1: Model Definitions
  if (ROBOT_MODELS.mini_gf && ROBOT_MODELS.mini_gm && ROBOT_MODELS.mini_g) {
    details.push('✅ Models Verification: Mini G-F, Mini G-M, Mini G properly defined.');
  } else {
    details.push('❌ Models Verification: Missing robot models in dictionary.');
    allPassed = false;
  }

  // Test 2: BLE Packet Encoder Mini G-F
  const packetGF = BLEProtocol.buildPacket('mini_gf', CMD_CODES.GF_SET_LED_RGB, [255, 0, 0]);
  if (packetGF[0] === 0xAA && packetGF[1] === 0x01 && packetGF[2] === 0x10 && packetGF[3] === 3) {
    details.push('✅ BLE Packet Encoder (Mini G-F): 0xAA 0x01 0x10 verified successfully.');
  } else {
    details.push('❌ BLE Packet Encoder (Mini G-F): Binary header mismatch.');
    allPassed = false;
  }

  // Test 3: BLE Packet Encoder Mini G-M
  const packetGM = BLEProtocol.buildPacket('mini_gm', CMD_CODES.GM_ROTATE_HEAD, [45]);
  if (packetGM[0] === 0xAA && packetGM[1] === 0x02 && packetGM[2] === 0x21) {
    details.push('✅ BLE Packet Encoder (Mini G-M): Servo rotate packet verified.');
  } else {
    details.push('❌ BLE Packet Encoder (Mini G-M): Packet construction error.');
    allPassed = false;
  }

  // Test 4: BLE Packet Encoder Mini G
  const packetG = BLEProtocol.buildPacket('mini_g', CMD_CODES.G_DRIVE_MOTORS, [80, 80]);
  if (packetG[0] === 0xAA && packetG[1] === 0x03 && packetG[2] === 0x30) {
    details.push('✅ BLE Packet Encoder (Mini G): Motor drive packet verified.');
  } else {
    details.push('❌ BLE Packet Encoder (Mini G): Motor packet error.');
    allPassed = false;
  }

  // Test 5: Hex to RGB Color Converter
  const [r, g, b] = BLEProtocol.hexToRgb('#ff0000');
  if (r === 255 && g === 0 && b === 0) {
    details.push('✅ Color Protocol: Hex to RGB parsing accurate.');
  } else {
    details.push('❌ Color Protocol: Hex parser failed.');
    allPassed = false;
  }

  return { passed: allPassed, details };
}
