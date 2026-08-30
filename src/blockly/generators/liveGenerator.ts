import { javascriptGenerator, Order } from 'blockly/javascript';
import { defineMiniGFBlocks } from '../customBlocks/miniGFBlocks';
import { defineMiniGMBlocks } from '../customBlocks/miniGMBlocks';
import { defineMiniGBlocks } from '../customBlocks/miniGBlocks';
import { CMD_CODES } from '../../ble/Protocol';

let initialized = false;

export function initCustomBlockly() {
  if (initialized) return;

  defineMiniGFBlocks();
  defineMiniGMBlocks();
  defineMiniGBlocks();

  /* ============================================================
   * MINI G-F GENERATORS
   ============================================================ */
  javascriptGenerator.forBlock['gf_set_color'] = function (block: any) {
    const color = block.getFieldValue('COLOR');
    return `await window.__BLE_DISPATCH__(${CMD_CODES.GF_SET_LED_RGB}, ${JSON.stringify(color)});\n`;
  };

  javascriptGenerator.forBlock['gf_vibrate'] = function (block: any) {
    const duration = block.getFieldValue('DURATION');
    return `await window.__BLE_DISPATCH__(${CMD_CODES.GF_TRIGGER_HAPTIC}, [${duration}]);\n`;
  };

  javascriptGenerator.forBlock['gf_on_touch'] = function (block: any) {
    const branch = javascriptGenerator.statementToCode(block, 'DO');
    return `// On Touch Event\n${branch}\n`;
  };

  // Generator for Mini G-M
  javascriptGenerator.forBlock['gm_set_expression'] = function (block: any) {
    const expr = block.getFieldValue('EXPRESSION');
    return `await window.__BLE_DISPATCH__(${CMD_CODES.GM_SET_EXPRESSION}, [${expr}]);\n`;
  };

  javascriptGenerator.forBlock['gm_rotate_head'] = function (block: any) {
    const angle = parseInt(block.getFieldValue('ANGLE'), 10);
    const unsignedByte = (angle < 0 ? 256 + angle : angle) & 0xFF;
    return `await window.__BLE_DISPATCH__(${CMD_CODES.GM_ROTATE_HEAD}, [${unsignedByte}]);\n`;
  };

  javascriptGenerator.forBlock['gm_play_sound'] = function (block: any) {
    const params = block.getFieldValue('SOUND_PARAMS').split(',').map(Number);
    // Firmware expects frequency ÷10 (mini_gm_esp32.ino multiplies ×10)
    const freq = Math.max(1, Math.round((params[0] || 0) / 10));
    return `await window.__BLE_DISPATCH__(${CMD_CODES.GM_PLAY_TONE}, [${freq}, ${params[1]}]);\n`;
  };

  javascriptGenerator.forBlock['gm_set_custom_face'] = function (block: any) {
    const preset = block.getFieldValue('PIXEL_PRESET');
    const presetMap: Record<string, number> = { heart: 2, star: 1, cool: 4, bot: 0 };
    const exprId = presetMap[preset] || 0;
    return `await window.__BLE_DISPATCH__(${CMD_CODES.GM_SET_EXPRESSION}, [${exprId}]);\n`;
  };

  // Generator for Mini G
  javascriptGenerator.forBlock['g_drive'] = function (block: any) {
    const speeds = block.getFieldValue('MOTION_SPEED').split(',').map(Number);
    const uL = (speeds[0] < 0 ? 256 + speeds[0] : speeds[0]) & 0xFF;
    const uR = (speeds[1] < 0 ? 256 + speeds[1] : speeds[1]) & 0xFF;
    return `await window.__BLE_DISPATCH__(${CMD_CODES.G_DRIVE_MOTORS}, [${uL}, ${uR}]);\n`;
  };

  javascriptGenerator.forBlock['g_move_arms'] = function (block: any) {
    const [arm, angle] = block.getFieldValue('ARM_ACTION').split(',');
    if (arm === 'right') {
      return `await window.__BLE_DISPATCH__(${CMD_CODES.G_SET_ARM_RIGHT}, [${angle}]);\n`;
    } else if (arm === 'left') {
      return `await window.__BLE_DISPATCH__(${CMD_CODES.G_SET_ARM_LEFT}, [${angle}]);\n`;
    } else {
      return `await window.__BLE_DISPATCH__(${CMD_CODES.G_SET_ARM_LEFT}, [${angle}]);\nawait window.__BLE_DISPATCH__(${CMD_CODES.G_SET_ARM_RIGHT}, [${angle}]);\n`;
    }
  };

  javascriptGenerator.forBlock['g_set_ai_persona'] = function (block: any) {
    const persona = block.getFieldValue('PERSONA');
    return `await window.__BLE_DISPATCH__(${CMD_CODES.G_SET_PERSONA}, [${persona}]);\n`;
  };

  javascriptGenerator.forBlock['g_ai_speak'] = function (block: any) {
    const text = block.getFieldValue('SPEECH_TEXT');
    return `await window.__BLE_DISPATCH__(${CMD_CODES.G_SPEAK_PHRASE}, ${JSON.stringify(text)});\n`;
  };

  initialized = true;
}
