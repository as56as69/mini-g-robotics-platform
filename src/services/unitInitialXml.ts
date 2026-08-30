import type { RobotModelType } from '../types/robot';

/**
 * Safe default Blockly workspace for a brand-new curriculum unit.
 * Each model starts from a minimal, valid single-block program that already
 * exercises one of its core actions (light / face / drive).
 */
export function defaultUnitXml(model: RobotModelType): string {
  switch (model) {
    case 'mini_gf':
      return '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="gf_set_color"><field name="COLOR">#22c55e</field></block></xml>';
    case 'mini_g':
      return '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="g_drive"><field name="MOTION_SPEED">60,60</field></block></xml>';
    case 'mini_gm':
    default:
      return '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="gm_set_expression"><field name="EXPRESSION">0</field></block></xml>';
  }
}

export function difficultyXp(difficulty: 'مبتدئ' | 'متوسط' | 'بطل'): number {
  return difficulty === 'مبتدئ' ? 150 : difficulty === 'متوسط' ? 300 : 600;
}