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

  // 3. Blink LED (GF_BLINK_LED 0x12)
  Blockly.Blocks['gf_blink'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('✨ أومض ليد الروبوت')
        .appendField(
          new Blockly.FieldDropdown([
            ['ومضة واحدة', '1'],
            ['وميض ×3', '3'],
            ['وميض ×5', '5'],
          ]),
          'COUNT'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#F97316');
      this.setTooltip('وميض متكرر لليد RGB في ميدالية Mini G-F (أمر 0x12)');
    },
  };

  // 4. Wait (fixed durations)
  Blockly.Blocks['gf_wait'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('⏳ انتظر')
        .appendField(
          new Blockly.FieldDropdown([
            ['نصف ثانية', '500'],
            ['ثانية واحدة', '1000'],
            ['ثانيتين', '2000'],
          ]),
          'MS'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#818CF8');
      this.setTooltip('توقف البرنامج لهذه المدة قبل تنفيذ الخطوة التالية');
    },
  };

  // 5. Pre-built behavior pattern (celebrate / alarm / heartbeat / rainbow / sos)
  Blockly.Blocks['gf_pattern'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🎯 نفّذ')
        .appendField(
          new Blockly.FieldDropdown([
            ['🎉 سلوك الاحتفال', 'celebrate'],
            ['🚨 سلوك الإنذار', 'alarm'],
            ['💓 نبض القلب', 'heartbeat'],
            ['🌈 سلوك قوس قزح', 'rainbow'],
            ['🆘 سلوك استغاثة', 'sos'],
          ]),
          'PATTERN'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#F97316');
      this.setTooltip('سلوك جاهز مركب من الليد والهزاز والوقت — يُنفَّذ خطوة بخطوة');
    },
  };

  // 5. Touch Event Trigger
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
