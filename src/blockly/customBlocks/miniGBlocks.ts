import * as Blockly from 'blockly';

export function defineMiniGBlocks() {
  // 1. Wheel Motion
  Blockly.Blocks['g_drive'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🚗 تحرك بالعجلات')
        .appendField(
          new Blockly.FieldDropdown([
            ['⬆️ للأمام بسرعة عادية', '60,60'],
            ['🚀 للأمام بسرعة فائقة', '100,100'],
            ['⬇️ للخلف بحذر', '-60,-60'],
            ['🔄 دوران لليمين', '60,-60'],
            ['🔄 دوران لليسار', '-60,60'],
            ['⏹️ توقف تام', '0,0'],
          ]),
          'MOTION_SPEED'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#60A5FA');
      this.setTooltip('قيادة محركات العجلات في قاعدة الروبوت');
    },
  };

  // 2. Arm Articulation
  Blockly.Blocks['g_move_arms'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🦾 حركة الأذرع والمفاصل')
        .appendField(
          new Blockly.FieldDropdown([
            ['👋 تلويح باليد اليمنى ترحيباً', 'right,90'],
            ['🙌 رفع اليدين معاً للاحتفال', 'both,90'],
            ['👇 إنزال اليدين للوضع الطبيعي', 'both,0'],
            ['👈 إشارة باليد اليسرى', 'left,90'],
          ]),
          'ARM_ACTION'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#A78BFA');
      this.setTooltip('تحريك مفاصل أذرع الروبوت');
    },
  };

  // 3. AI Persona Selection
  Blockly.Blocks['g_set_ai_persona'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🎭 غيّر شخصية الذكاء الاصطناعي إلى')
        .appendField(
          new Blockly.FieldDropdown([
            ['📜 العالم الخوارزمي', '0'],
            ['🚀 رائد الفضاء الكرتوني', '1'],
            ['💡 العالم ألبرت أينشتاين', '2'],
            ['🤖 الروبوت الصديق المرح', '3'],
          ]),
          'PERSONA'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#EC4899');
      this.setTooltip('تغيير ملامح الوجه ونبرة صوت الذكاء الاصطناعي التوليدي للروبوت');
    },
  };

  // 4. AI Voice & Speech
  Blockly.Blocks['g_ai_speak'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🗣️ تحدث بصوت الشخصية مع حركة الفم')
        .appendField(new Blockly.FieldTextInput('مرحباً بكم يا أبطال البرمجة!'), 'SPEECH_TEXT');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#10B981');
      this.setTooltip('يجعل الروبوت ينطق الجملة بصوت الشخصية مع تحريك ملامح الشفاه');
    },
  };
}
