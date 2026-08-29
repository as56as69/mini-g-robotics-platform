import * as Blockly from 'blockly';

export function defineMiniGMBlocks() {
  // 1. Set Expression on Screen
  Blockly.Blocks['gm_set_expression'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('👀 عيون الروبوت بالشاشة')
        .appendField(
          new Blockly.FieldDropdown([
            ['😄 سعيد وفرحان', '0'],
            ['😲 مندهش ومستغرب', '1'],
            ['😍 عيون قلوب', '2'],
            ['😴 نائم وهادئ', '3'],
            ['😎 نظارة البطل', '4'],
            ['😉 يغمز بمرح', '5'],
          ]),
          'EXPRESSION'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#22D3EE');
      this.setTooltip('تغيير شكل ونظرة العيون على شاشة Mini G-M');
    },
  };

  // 2. Rotate Head (Servo)
  Blockly.Blocks['gm_rotate_head'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🤖 حرّك الرأس إلى')
        .appendField(
          new Blockly.FieldDropdown([
            ['⬅️ أقصى اليسار', '-45'],
            ['👈 يسار خفيف', '-20'],
            ['⏺️ في المنتصف للأمام', '0'],
            ['👉 يمين خفيف', '20'],
            ['➡️ أقصى اليمين', '45'],
          ]),
          'ANGLE'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#A78BFA');
      this.setTooltip('تدوير رأس الروبوت عبر محرك العنق السيرفو');
    },
  };

  // 3. Play Melodic Sound
  Blockly.Blocks['gm_play_sound'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🎵 تشغيل نغمة صوتية')
        .appendField(
          new Blockly.FieldDropdown([
            ['🎉 نغمة الفوز والاحتفال', '523,3'],
            ['👋 نغمة التحية والترحيب', '659,2'],
            ['🔔 جرس المذاكرة والتركيز', '880,4'],
            ['❗ صوت التنبيه والحذر', '330,2'],
            ['🎹 لحن موسيقي هادئ', '440,3'],
          ]),
          'SOUND_PARAMS'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#F59E0B');
      this.setTooltip('إصدار أصوات ونغمات موسيقية عبر مكبر الصوت المدمج');
    },
  };

  // 4. Custom 8x8 Matrix Emotion Block
  Blockly.Blocks['gm_set_custom_face'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🎨 رسم وجه بكسل')
        .appendField(
          new Blockly.FieldDropdown([
            ['💖 قلب محب', 'heart'],
            ['⭐ نجمة مضيئة', 'star'],
            ['😎 نظارة البطل', 'cool'],
            ['🤖 روبوت ذكي', 'bot'],
          ]),
          'PIXEL_PRESET'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#22D3EE');
      this.setTooltip('إظهار رسم بكسل مخصص على شاشة الـ ESP32');
    },
  };
}
