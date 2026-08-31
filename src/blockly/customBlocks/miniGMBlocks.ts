import * as Blockly from 'blockly';
import { loadFaceLibrary, getCurrentFace } from '../../services/pixelFaceStore';

/** Dropdown options: current studio face + every face in the saved library */
function buildFaceOptions(): [string, string][] {
  const options: [string, string][] = [['الوجه الحالي في الاستوديو', '__current__']];
  try {
    const lib = loadFaceLibrary();
    for (const name of Object.keys(lib)) {
      options.push([`📁 ${name}`, name]);
    }
  } catch { /* storage unavailable */ }
  return options;
}

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

  // 3. Play Melodic Sound (each option is a short melody, not a flat beep)
  Blockly.Blocks['gm_play_sound'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🎵 تشغيل لحن')
        .appendField(
          new Blockly.FieldDropdown([
            ['🎉 لحن الفوز: دو-مي-سول صاعد', 'victory'],
            ['👋 لحن الترحيب المرح', 'greeting'],
            ['🔔 جرس المذاكرة (جرستان)', 'bell'],
            ['❗ تنبيه حذر: نغمتان حادتان', 'alert'],
            ['🎹 هادئ نغمة صاعدة', 'calm'],
            ['🤔 فكرة: دو-سول منخفض', 'thinking'],
          ]),
          'MELODY'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#F59E0B');
      this.setTooltip('تشغيل لحن من نغمات متتالية عبر مكبر الصوت (كل نغمة لها تردد ومدة خاصة)');
    },
  };

  // 5. Nod Head (GM_NOD_HEAD 0x23)
  Blockly.Blocks['gm_nod_head'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🤖 إيماءة الرأس عمودياً')
        .appendField(
          new Blockly.FieldDropdown([
            ['إيماءة واحدة', '1'],
            ['إيماءتا موافقة', '2'],
            ['موافقة قوية ×3', '3'],
          ]),
          'COUNT'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#A78BFA');
      this.setTooltip('إيماءة رأس عمودية (موافقة) عبر السيرفو — أمر 0x23');
    },
  };

  // 6. Pre-built behavior pattern (greet / study / bedtime / celebrate / surprise)
  Blockly.Blocks['gm_pattern'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🎯 نفّذ')
        .appendField(
          new Blockly.FieldDropdown([
            ['👋 تحية الترحيب', 'greet'],
            ['🔔 وقت المذاكرة', 'study'],
            ['😴 وقت النوم', 'bedtime'],
            ['🎉 احتفال بالنجاح', 'celebrate'],
            ['❗ تنبيه مفاجأة', 'surprise'],
          ]),
          'PATTERN'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#22D3EE');
      this.setTooltip('سلوك جاهز مركب من التعبير والرأس والنغمة — يُنفَّذ خطوة بخطوة');
    },
  };

  // 7. Send a hand-drawn pixel face (current or from the saved library)
  Blockly.Blocks['gm_send_pixel_face'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('📺 أرسل الوجه المرسوم')
        .appendField(new Blockly.FieldDropdown(() => buildFaceOptions()), 'FACE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#22D3EE');
      this.setTooltip('أرسل وجهاً مرسوماً من استوديو البكسل (8x8) إلى شاشة الروبوت — يعرضه المحاكي فوراً');
    },
  };

  // 8. Custom 8x8 Matrix Emotion Block
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
