import type { SchoolUnit } from '../types/lms';
import type { RobotModelType } from '../types/robot';

export interface WorksheetQuestion {
  q: string;
  options: string[];
  correctIndex: number;
}

/** Per-model feature dictionaries used to craft plausible distractors. */
const MODEL_FEATURES: Record<RobotModelType, { parts: string[]; actions: string[]; sensors: string[] }> = {
  mini_gf: {
    parts: ['ليدات RGB', 'محرك هزاز (Haptic)', 'مستشعر لمس كهروسكوني', 'بطارية ليثيوم صغيرة', 'شريحة BLE'],
    actions: ['تضيء باللون الأخضر', 'تهتز بنبضة قصيرة', 'تستجيب للّمس', 'تومض بالأحمر للإنذار'],
    sensors: ['مستشعر اللمس السعوي', 'مستشعر الألوان', 'حساس الحرارة', 'مستشعر المسافة'],
  },
  mini_gm: {
    parts: ['شاشة OLED', 'محرك سيرفو للرأس', ' buzzer (منفذ صوت)', 'أزرار لمسية', 'ميكروفون'],
    actions: ['تُغيّر تعبير العيون', 'تُحرّك الرأس بزاوية', 'تشغيل نغمة', 'تغمز عند التحية'],
    sensors: ['مستشعر الصوت', 'مستشعر اللمس', 'حساس الضوء', 'مستشعر الميل'],
  },
  mini_g: {
    parts: ['محركات قيادة تفاضلية', 'ذراعان بسيرفو', 'مكبر صوت DAC', 'كاميرا اختيارية', 'شاشة OLED'],
    actions: ['تتحرك بالعجلات للأمام', 'ترفع الذراعين', 'تنطق بشخصية الخوارزمي', 'تتفادى العوائق'],
    sensors: ['مستشعر المسافة ToF', 'كاميرا رؤية', 'حساس الخط', 'مستشعر اللمس'],
  },
};

const DIFFICULTY_LABEL: Record<string, string> = {
  مبتدئ: 'مبتدئ',
  متوسط: 'متوسط',
  بطل: 'بطل',
};

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

/** Build `count` multiple-choice questions from a unit's fields + model dictionary. */
export function generateFromUnit(unit: SchoolUnit, count: number): WorksheetQuestion[] {
  const feats = MODEL_FEATURES[unit.model] ?? MODEL_FEATURES.mini_gm;
  const correctModelName = unit.model === 'mini_gf' ? 'ميني جي إف (الميدالية)' : unit.model === 'mini_gm' ? 'ميني جي إم (رفيق المكتب)' : 'ميني جي (الروبوت الكامل)';
  const otherModels = ['ميني جي إف (الميدالية)', 'ميني جي إم (رفيق المكتب)', 'ميني جي (الروبوت الكامل)'].filter(m => m !== correctModelName);

  // Candidate question builders — each draws from the unit's own fields
  const builders: (() => WorksheetQuestion)[] = [
    // 1) What is the main objective of this unit?
    () => {
      const correct = unit.descriptionAr.slice(0, 70);
      const distractors = pick(feats.actions.filter(a => !correct.includes(a)), 3).map(a => a.slice(0, 70));
      return { q: `ما هو الهدف الهندسي الرئيسي للوحدة «${unit.titleAr}»؟`, options: [correct, ...distractors], correctIndex: 0 };
    },
    // 2) Which robot model is targeted?
    () => {
      const opts = [correctModelName, ...pick(otherModels, 3)];
      const correctIndex = 0;
      return { q: 'أي روبوت هو المستهدف في هذه الوحدة؟', options: opts, correctIndex };
    },
    // 3) What is the verification criterion?
    () => {
      const correct = unit.targetCriteria?.descriptionAr || 'استيفاء الشروط البرمجية واختبار سلامة التنفيذ';
      const distractors = pick(feats.actions.filter(a => !correct.includes(a)), 3);
      return { q: 'ما معيار التحقق الذي يثبت إنجاز المهمة؟', options: [correct, ...distractors], correctIndex: 0 };
    },
    // 4) Which hardware part is relevant? (uses hardwarePins if present)
    () => {
      const pins = unit.hardwarePins || '';
      const correctPart = feats.parts[0];
      if (pins) {
        return {
          q: 'أي قطعة هاردوير تُستخدم في هذه المهمة؟',
          options: [pins.split('|')[0].trim(), ...pick(feats.parts.filter(p => !pins.includes(p)), 3)],
          correctIndex: 0,
        };
      }
      return { q: 'أي قطعة هاردوير مرتبطة بهذا الروبوت؟', options: [correctPart, ...pick(feats.parts.filter(p => p !== correctPart), 3)], correctIndex: 0 };
    },
    // 5) Which Blockly block hint belongs to this unit?
    () => {
      const hints = unit.blocksHint || [];
      if (hints.length) {
        const correct = hints[0];
        const pool = [
          '[🎨 لوّن الروبوت: أزرق]',
          '[🚗 تحرك: للخلف]',
          '[🎵 نغمة: حزينة]',
          '[🦾 حركة الذراع: إنزال]',
          '[👀 عيون: غاضبة]',
        ].filter(h => !hints.includes(h));
        return { q: 'أي كتلة Blockly مرتبطة بمهمة هذه الوحدة؟', options: [correct, ...pick(pool, 3)], correctIndex: 0 };
      }
      const correct = feats.actions[0];
      return { q: 'ما الإجراء الأساسي الذي تقوم به هذه الوحدة؟', options: [correct, ...pick(feats.actions.filter(a => a !== correct), 3)], correctIndex: 0 };
    },
    // 6) Difficulty recognition
    () => {
      const correct = DIFFICULTY_LABEL[unit.difficulty] || 'متوسط';
      const others = Object.values(DIFFICULTY_LABEL).filter(d => d !== correct);
      return { q: 'ما مستوى صعوبة هذه الوحدة؟', options: [correct, ...others], correctIndex: 0 };
    },
    // 7) Which sensor is most relevant?
    () => {
      const correct = feats.sensors[0];
      return { q: 'أي مستشعر أكثر ارتباطاً بهذه المهمة؟', options: [correct, ...pick(feats.sensors.filter(s => s !== correct), 3)], correctIndex: 0 };
    },
  ];

  const shuffled = [...builders].sort(() => 0.5 - Math.random());
  const out: WorksheetQuestion[] = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    out.push(shuffled[i]());
  }
  // Shuffle options within each question while tracking correctIndex
  return out.map(q => {
    const correct = q.options[q.correctIndex];
    const opts = [...q.options].sort(() => 0.5 - Math.random());
    return { q: q.q, options: opts, correctIndex: opts.indexOf(correct) };
  });
}
