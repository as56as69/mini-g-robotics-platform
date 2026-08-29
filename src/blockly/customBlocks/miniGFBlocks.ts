import * as Blockly from 'blockly';

export function defineMiniGFBlocks() {
  // 1. Set LED Color
  Blockly.Blocks['gf_set_color'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🎨 لوّن الروبوت بلون')
        .appendField(
          new Blockly.FieldDropdown([
            ['🔴 أحمر', '#ef4444'],
            ['🟢 أخضر', '#22c55e'],
            ['🔵 أزرق', '#3b82f6'],
            ['🟡 أصفر', '#eab308'],
            ['🟣 بنفسجي', '#a855f7'],
            ['⚪ أبيض', '#ffffff'],
            ['⚫ إطفاء', '#000000'],
          ]),
          'COLOR'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#F97316');
      this.setTooltip('تغيير لون ليدات الـ RGB في ميدالية Mini G-F');
    },
  };

  // 2. Trigger Haptic Vibration
  Blockly.Blocks['gf_vibrate'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('📳 هزاز الروبوت')
        .appendField(
          new Blockly.FieldDropdown([
            ['نبضة قصيرة ⚡', '200'],
            ['نبضة متوسطة ⏳', '500'],
            ['نبضتان متتاليتان 💓', '800'],
          ]),
          'DURATION'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#EC4899');
      this.setTooltip('تشغيل ماطور الهزاز الصغير');
    },
  };

  // 3. Touch Event Trigger
  Blockly.Blocks['gf_on_touch'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('👆 عند لمس رأس الروبوت');
      this.appendStatementInput('DO')
        .appendField('نفّذ:');
      this.setColour('#10B981');
      this.setTooltip('ينفذ الأوامر عندما يلمس الطفل الميدالية');
    },
  };
}
