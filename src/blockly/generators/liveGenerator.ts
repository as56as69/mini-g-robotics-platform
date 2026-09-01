import { javascriptGenerator, Order } from 'blockly/javascript';
import { defineMiniGFBlocks } from '../customBlocks/miniGFBlocks';
import { defineMiniGMBlocks } from '../customBlocks/miniGMBlocks';
import { defineMiniGBlocks } from '../customBlocks/miniGBlocks';
import { CMD_CODES } from '../../ble/Protocol';
import { GF_PATTERNS } from '../../services/gfBehaviorPatterns';
import { GM_PATTERNS } from '../../services/gmBehaviorPatterns';
import { GM_MELODIES } from '../../services/gmMelodies';
import { loadFaceLibrary, getCurrentFace } from '../../services/pixelFaceStore';

let initialized = false;

export function initCustomBlockly() {
  if (initialized) return;

  defineMiniGFBlocks();
  defineMiniGMBlocks();
  defineMiniGBlocks();

  /* ============================================================
   * MINI G-F GENERATORS
   * Every dispatch embeds the source block id as its last argument
   * (harmless for the BLE bridge) so the doodle runner can light up
   * the exact block being executed, step by step.
   ============================================================ */
  const dispatch = (cmd: number, arg: string, block: any) =>
    `await window.__BLE_DISPATCH__(${cmd}, ${arg}, ${JSON.stringify(block.id)});\n`;

  javascriptGenerator.forBlock['gf_set_color'] = function (block: any) {
    const color = block.getFieldValue('COLOR');
    return dispatch(CMD_CODES.GF_SET_LED_RGB, JSON.stringify(color), block);
  };

  javascriptGenerator.forBlock['gf_vibrate'] = function (block: any) {
    const duration = block.getFieldValue('DURATION');
    return dispatch(CMD_CODES.GF_TRIGGER_HAPTIC, `[${duration}]`, block);
  };

  javascriptGenerator.forBlock['gf_blink'] = function (block: any) {
    const count = block.getFieldValue('COUNT');
    return dispatch(CMD_CODES.GF_BLINK_LED, `[${count}]`, block);
  };

  javascriptGenerator.forBlock['gf_wait'] = function (block: any) {
    const ms = block.getFieldValue('WAIT_MS');
    return `await window.__BLE_STEP_WAIT__(${ms}, ${JSON.stringify(block.id)});\n`;
  };

  javascriptGenerator.forBlock['gf_pattern'] = function (block: any) {
    const patternId = block.getFieldValue('PATTERN');
    const pattern = GF_PATTERNS[patternId];
    if (!pattern) return '';
    // Unroll the pattern into its atomic dispatch + wait steps so the student
    // can see (and the engine runs) the exact same sequence as the remote buttons.
    let code = `// ${pattern.icon} ${pattern.labelAr}\n`;
    for (const step of pattern.steps) {
      if (step.wait) code += `await window.__BLE_STEP_WAIT__(${step.wait}, ${JSON.stringify(block.id)});\n`;
      if (step.cmd != null) {
        const arg = typeof step.data === 'string'
          ? JSON.stringify(step.data)
          : `[${(step.data || []).join(', ')}]`;
        code += dispatch(step.cmd, arg, block);
      }
    }
    return code;
  };

  javascriptGenerator.forBlock['gf_on_touch'] = function (block: any) {
    const branch = javascriptGenerator.statementToCode(block, 'DO');
    return `// On Touch Event\n${branch}\n`;
  };

  // Generator for Mini G-M
  javascriptGenerator.forBlock['gm_set_expression'] = function (block: any) {
    const expr = block.getFieldValue('EXPRESSION');
    return dispatch(CMD_CODES.GM_SET_EXPRESSION, `[${expr}]`, block);
  };

  javascriptGenerator.forBlock['gm_rotate_head'] = function (block: any) {
    const angle = parseInt(block.getFieldValue('ANGLE'), 10);
    const unsignedByte = (angle < 0 ? 256 + angle : angle) & 0xFF;
    return dispatch(CMD_CODES.GM_ROTATE_HEAD, `[${unsignedByte}]`, block);
  };

  javascriptGenerator.forBlock['gm_play_sound'] = function (block: any) {
    const melodyId = block.getFieldValue('MELODY');
    const melody = GM_MELODIES[melodyId];
    if (!melody) return '';
    // Unroll the melody into successive tone commands (freq ÷10, duration
    // blocks of 100ms) with tiny gaps — the robot plays an actual tune.
    let code = `// ${melody.icon} ${melody.labelAr}\n`;
    for (const note of melody.notes) {
      if (note.freq === 0) {
        // Silence gap between notes
        code += `await window.__BLE_STEP_WAIT__(${note.ms}, ${JSON.stringify(block.id)});\n`;
        continue;
      }
      const freq = Math.max(1, Math.round(note.freq / 10)); // firmware ×10 contract
      code += `await window.__BLE_STEP_WAIT__(${note.ms + 40}, ${JSON.stringify(block.id)});\n`;
      code += dispatch(CMD_CODES.GM_PLAY_TONE, `[${freq}, ${Math.max(1, Math.round(note.ms / 100))}]`, block);
    }
    return code;
  };

  javascriptGenerator.forBlock['gm_nod_head'] = function (block: any) {
    const count = block.getFieldValue('COUNT');
    return dispatch(CMD_CODES.GM_NOD_HEAD, `[${count}]`, block);
  };

  javascriptGenerator.forBlock['gm_pattern'] = function (block: any) {
    const patternId = block.getFieldValue('PATTERN');
    const pattern = GM_PATTERNS[patternId];
    if (!pattern) return '';
    let code = `// ${pattern.icon} ${pattern.labelAr}\n`;
    for (const step of pattern.steps) {
      if (step.wait) code += `await window.__BLE_STEP_WAIT__(${step.wait}, ${JSON.stringify(block.id)});\n`;
      if (step.cmd != null) {
        const arg = typeof step.data === 'string'
          ? JSON.stringify(step.data)
          : `[${(step.data || []).join(', ')}]`;
        code += dispatch(step.cmd, arg, block);
      }
    }
    return code;
  };

  javascriptGenerator.forBlock['gm_set_custom_face'] = function (block: any) {
    const preset = block.getFieldValue('PIXEL_PRESET');
    const presetMap: Record<string, number> = { heart: 2, star: 1, cool: 4, bot: 0 };
    const exprId = presetMap[preset] || 0;
    return dispatch(CMD_CODES.GM_SET_EXPRESSION, `[${exprId}]`, block);
  };

  javascriptGenerator.forBlock['gm_send_pixel_face'] = function (block: any) {
    const faceId = block.getFieldValue('FACE');
    let bytes: number[] | null = null;
    if (faceId === '__current__') {
      bytes = getCurrentFace();
    } else {
      const lib = loadFaceLibrary();
      bytes = lib[faceId] || null;
    }
    if (!bytes) return '';
    return dispatch(CMD_CODES.GM_SET_EXPRESSION, `[${bytes.join(', ')}]`, block);
  };

  // Generator for Mini G
  javascriptGenerator.forBlock['g_drive'] = function (block: any) {
    const speeds = block.getFieldValue('MOTION_SPEED').split(',').map(Number);
    const uL = (speeds[0] < 0 ? 256 + speeds[0] : speeds[0]) & 0xFF;
    const uR = (speeds[1] < 0 ? 256 + speeds[1] : speeds[1]) & 0xFF;
    return dispatch(CMD_CODES.G_DRIVE_MOTORS, `[${uL}, ${uR}]`, block);
  };

  javascriptGenerator.forBlock['g_move_arms'] = function (block: any) {
    const [arm, angle] = block.getFieldValue('ARM_ACTION').split(',');
    if (arm === 'right') {
      return dispatch(CMD_CODES.G_SET_ARM_RIGHT, `[${angle}]`, block);
    } else if (arm === 'left') {
      return dispatch(CMD_CODES.G_SET_ARM_LEFT, `[${angle}]`, block);
    } else {
      return dispatch(CMD_CODES.G_SET_ARM_LEFT, `[${angle}]`, block) + dispatch(CMD_CODES.G_SET_ARM_RIGHT, `[${angle}]`, block);
    }
  };

  javascriptGenerator.forBlock['g_set_ai_persona'] = function (block: any) {
    const persona = block.getFieldValue('PERSONA');
    return dispatch(CMD_CODES.G_SET_PERSONA, `[${persona}]`, block);
  };

  javascriptGenerator.forBlock['g_ai_speak'] = function (block: any) {
    const text = block.getFieldValue('SPEECH_TEXT');
    return dispatch(CMD_CODES.G_SPEAK_PHRASE, JSON.stringify(text), block);
  };

  initialized = true;
}
