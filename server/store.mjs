import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'school.json');

const EMOJI_POOL = ['🦁', '🐬', '🤖', '🚀', '⭐', '🎨', '⚡', '🏆', '💡', '🎮', '💎', '🦄'];
const ROBOT_OPTIONS = ['Mini G-F (الميدالية)', 'Mini G-M (رفيق المكتب)', 'Mini G (الروبوت الكامل)'];

/** Generate a unique certificate number CERT-#### using existing numbers as the collision set. */
function genCertNumber(existingCerts = []) {
  const used = new Set(existingCerts.map(c => c.certNumber));
  let code;
  do {
    code = `CERT-${String(Math.floor(1000 + Math.random() * 9000))}`;
  } while (used.has(code));
  return code;
}

const SEED_CLASSES = [
  { id: 'c1', name: 'شعبة الروبوتكس المتقدم (المستوى 1)', code: 'ROBO-101', grade: 'المرحلة الابتدائية العليا', joinCode: '2048', activeLesson: 'الخوارزميات وحساسات المسافة', activeLessonId: 'u1' },
  { id: 'c2', name: 'مختبر الذكاء الاصطناعي والأتمتة (الشعبة ب)', code: 'AI-204', grade: 'المرحلة المتوسطة', joinCode: '7193', activeLesson: 'التحكم بالمفاصل وشبكات الأعصاب', activeLessonId: 'u2' },
  { id: 'c3', name: 'فريق الابتكار والمسابقات الوطنية', code: 'PRO-301', grade: 'فريق النخبة التنافسي', joinCode: '8856', activeLesson: 'تتبع المسار والملاحة الذاتية', activeLessonId: 'u3' },
];

const XML_GF = `<xml xmlns="http://www.w3.org/1999/xhtml"><block type="gf_set_color"><field name="COLOR">#22c55e</field></block></xml>`;
const XML_GM = `<xml xmlns="http://www.w3.org/1999/xhtml"><block type="gm_set_expression"><field name="EXPRESSION">0</field></block></xml>`;
const XML_G = `<xml xmlns="http://www.w3.org/1999/xhtml"><block type="g_drive"><field name="MOTION_SPEED">60,60</field></block></xml>`;

const SEED_UNITS = [
  {
    id: 'u1',
    titleAr: 'الوحدة الأولى: البنية المعمارية للروبوت والمستشعرات',
    descriptionAr: 'برمجة ردود الفعل اللحظية واستجابة ليدات الـ RGB لمحفزات مستشعر اللمس الكهروسكوني.',
    model: 'mini_gf',
    difficulty: 'مبتدئ',
    xpReward: 150,
    starsCount: 3,
    targetCriteria: { descriptionAr: 'معالجة إشارة الدخل GPIO وتوليد نبضة PWM مع الهابتيك', targetEvent: 'TOUCH_OR_COLOR' },
    initialXml: XML_GF,
    hardwarePins: 'WS2812B Data: Pin 8 | Haptic: Pin 4 | Touch: Pin 2',
    blocksHint: ['[🎨 لوّن الروبوت بلون: أخضر]', '[📳 هزاز الروبوت: نبضة قصيرة]'],
    protocolCode: 'LAB-PROTOCOL-01',
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
  },
  {
    id: 'u2',
    titleAr: 'الوحدة الثانية: التوأم الرقمي والتحكم بمحركات السيرفو',
    descriptionAr: 'حساب زوايا التوجيه الحركي للرأس (Kinematics) ورسم تعبيرات البكسل على شاشة الـ OLED.',
    model: 'mini_gm',
    difficulty: 'متوسط',
    xpReward: 300,
    starsCount: 3,
    targetCriteria: { descriptionAr: 'معايرة زاوية الرأس بدقة 45° ومزامنة الحالة مع المحاكي', targetEvent: 'SERVO_MOTION' },
    initialXml: XML_GM,
    hardwarePins: 'Servo PWM: Pin 18 | OLED SDA: 21 / SCL: 22 | Buzzer: 19',
    blocksHint: ['[👀 عيون الروبوت: سعيد]', '[🤖 حرّك الرأس: 45 يمين]', '[🎵 تشغيل نغمة: الفوز]'],
    protocolCode: 'LAB-PROTOCOL-02',
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
  },
  {
    id: 'u3',
    titleAr: 'الوحدة الثالثة: الملاحة الذاتية وتكامل الذكاء الاصطناعي',
    descriptionAr: 'خوارزميات القيادة التفاضلية بعجلات الروبوت وربط النماذج التوليدية لتوليد نبرة صوت الخوارزمي.',
    model: 'mini_g',
    difficulty: 'بطل',
    xpReward: 600,
    starsCount: 3,
    targetCriteria: { descriptionAr: 'تكامل واجهات GenAI API مع تحريك المفاصل المزدوجة', targetEvent: 'AI_PERSONA_SPEAK' },
    initialXml: XML_G,
    hardwarePins: 'Motors L/R: Pin 14/27 | Servos: 25/26 | Audio DAC: 22',
    blocksHint: ['[🚗 تحرك بالعجلات: للأمام]', '[🦾 حركة الأذرع: رفع اليدين]', '[🎭 شخصية الذكاء: الخوارزمي]'],
    protocolCode: 'LAB-PROTOCOL-03',
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
  },
];

const UNIT_DEFAULTS = {
  mini_gf: { initialXml: XML_GF, event: 'CUSTOM_EVENT' },
  mini_gm: { initialXml: XML_GM, event: 'CUSTOM_EVENT' },
  mini_g: { initialXml: XML_G, event: 'CUSTOM_EVENT' },
};

const DIFF_XP = { مبتدئ: 150, متوسط: 300, بطل: 600 };

let data = { classes: [], students: [], units: [] };

function genId() {
  return crypto.randomUUID();
}

function genUniqueCode(prefix, existingCodes, start = 1000, end = 9999) {
  let code;
  do {
    code = `${prefix}-${Math.floor(start + Math.random() * (end - start + 1))}`;
  } while (existingCodes.has(code));
  return code;
}

function genJoinCode(existingCodes) {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (existingCodes.has(code));
  return code;
}

function pickEmojis() {
  const shuffled = [...EMOJI_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

function genStationId(studentCount) {
  return `Station-${(studentCount + 1).toString().padStart(2, '0')}`;
}

async function ensureLoaded() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    data = JSON.parse(raw);
    if (data == null || typeof data !== 'object') throw new Error('bad data');
    if (!Array.isArray(data.classes)) data.classes = [];
    if (!Array.isArray(data.students)) data.students = [];
    if (!Array.isArray(data.units)) {
      data.units = SEED_UNITS;
      await save();
    } else {
      // Backfill new card fields onto legacy seeded units (idempotent migration)
      let migrated = false;
      const byId = Object.fromEntries(data.units.map(u => [u.id, u]));
      for (const seed of SEED_UNITS) {
        const u = byId[seed.id];
        if (u && (u.protocolCode == null || u.hardwarePins == null || u.blocksHint == null)) {
          if (u.protocolCode == null) u.protocolCode = seed.protocolCode;
          if (u.hardwarePins == null) u.hardwarePins = seed.hardwarePins;
          if (u.blocksHint == null) u.blocksHint = seed.blocksHint;
          migrated = true;
        }
      }
      // Ensure every unit has the new fields present (even if empty)
      for (const u of data.units) {
        if (u.protocolCode == null) { u.protocolCode = ''; migrated = true; }
        if (u.hardwarePins == null) { u.hardwarePins = ''; migrated = true; }
        if (!Array.isArray(u.blocksHint)) { u.blocksHint = []; migrated = true; }
        if (!Array.isArray(u.worksheetQuestions)) { u.worksheetQuestions = []; migrated = true; }
      }
      if (migrated) await save();
    }
  } catch {
    data = { classes: [], students: [], units: SEED_UNITS };
    if (!data.classes.length) {
      // First boot: seed sample classes (no fake students — roster is real)
      data.classes = SEED_CLASSES.map(c => ({ ...c, studentsCount: 0 }));
    }
    await save();
  }
}

// Serialize writes so concurrent requests can't loose updates
let writeQueue = Promise.resolve();
function save() {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, DATA_FILE);
  });
  return writeQueue;
}

const store = {
  async init() {
    await ensureLoaded();
  },
  snapshot() {
    return { classes: data.classes, students: data.students, units: data.units };
  },
  getClasses() {
    return data.classes;
  },
  getUnits() {
    return data.units;
  },
  addUnit({ titleAr, descriptionAr, model, difficulty, xpReward, starsCount, targetCriteria, initialXml, hardwarePins, blocksHint, protocolCode, worksheetQuestions }) {
    const title = String(titleAr || '').trim();
    if (!title) return Promise.reject(new Error('عنوان الوحدة مطلوب'));
    if (!['mini_gf', 'mini_gm', 'mini_g'].includes(model)) {
      return Promise.reject(new Error('نموذج الروبوت غير معروف'));
    }
    const now = new Date().toISOString();
    // Auto-generate a LAB-PROTOCOL-NN code if none supplied
    const autoProtocol = protocolCode && String(protocolCode).trim()
      ? String(protocolCode).trim()
      : `LAB-PROTOCOL-${String(data.units.length + 1).padStart(2, '0')}`;
    const unit = {
      id: genId(),
      titleAr: title,
      descriptionAr: String(descriptionAr || '').trim() || 'وحدة تعليمية وتحدي هندسي معتمد من المدرب',
      model,
      difficulty: difficulty || 'مبتدئ',
      xpReward: Number(xpReward) || DIFF_XP[difficulty] || 150,
      starsCount: Number(starsCount) || 3,
      targetCriteria: {
        descriptionAr: String(targetCriteria?.descriptionAr || '').trim() || 'استيفاء الشروط البرمجية واختبار سلامة التنفيذ',
        targetEvent: targetCriteria?.targetEvent || UNIT_DEFAULTS[model].event,
      },
      initialXml: String(initialXml || '').trim() || UNIT_DEFAULTS[model].initialXml,
      hardwarePins: hardwarePins ? String(hardwarePins).trim() : '',
      blocksHint: Array.isArray(blocksHint) ? blocksHint.map(h => String(h).trim()).filter(Boolean) : [],
      protocolCode: autoProtocol,
      worksheetQuestions: Array.isArray(worksheetQuestions) ? worksheetQuestions : [],
      createdAt: now,
      updatedAt: now,
    };
    data.units = [...data.units, unit];
    return save().then(() => unit);
  },
  updateUnit(id, patch) {
    const idx = data.units.findIndex(u => u.id === id);
    if (idx === -1) return Promise.resolve(null);
    const p = patch || {};
    const unit = { ...data.units[idx] };
    if (p.titleAr != null) unit.titleAr = String(p.titleAr).trim();
    if (p.descriptionAr != null) unit.descriptionAr = String(p.descriptionAr).trim();
    if (p.model != null && ['mini_gf', 'mini_gm', 'mini_g'].includes(p.model)) unit.model = p.model;
    if (p.difficulty != null) unit.difficulty = p.difficulty;
    if (p.xpReward != null) unit.xpReward = Number(p.xpReward) || unit.xpReward;
    if (p.starsCount != null) unit.starsCount = Number(p.starsCount) || unit.starsCount;
    if (p.targetCriteria != null) {
      unit.targetCriteria = {
        descriptionAr: String(p.targetCriteria.descriptionAr || unit.targetCriteria.descriptionAr).trim(),
        targetEvent: p.targetCriteria.targetEvent || unit.targetCriteria.targetEvent,
      };
    }
    if (p.initialXml != null) unit.initialXml = String(p.initialXml).trim();
    if (p.hardwarePins != null) unit.hardwarePins = String(p.hardwarePins).trim();
    if (Array.isArray(p.blocksHint)) unit.blocksHint = p.blocksHint.map(h => String(h).trim()).filter(Boolean);
    if (p.protocolCode != null) unit.protocolCode = String(p.protocolCode).trim();
    if (Array.isArray(p.worksheetQuestions)) unit.worksheetQuestions = p.worksheetQuestions;
    unit.updatedAt = new Date().toISOString();
    data.units[idx] = unit;
    return save().then(() => unit);
  },
  deleteUnit(id) {
    const before = data.units.length;
    data.units = data.units.filter(u => u.id !== id);
    if (before === data.units.length) return Promise.resolve(false);
    return save().then(() => true);
  },
  /** Student quick login: join code + MG login code → their shared profile */
  findByJoin(joinCode, loginCode) {
    const cls = data.classes.find(c => String(c.joinCode).trim() === String(joinCode || '').trim());
    if (!cls) return null;
    const student = data.students.find(
      s => s.classId === cls.id && String(s.loginCode).trim().toUpperCase() === String(loginCode || '').trim().toUpperCase()
    );
    if (!student) return null;
    return { student, className: cls.name };
  },
  getStudents(classId) {
    return classId ? data.students.filter(s => s.classId === classId) : data.students;
  },
  addClass({ name, grade }) {
    const codes = new Set(data.classes.map(c => c.code));
    const joins = new Set(data.classes.map(c => c.joinCode));
    const cls = {
      id: genId(),
      name: String(name || '').trim(),
      code: genUniqueCode('ROBO', codes),
      grade: String(grade || '').trim() || 'المرحلة الابتدائية العليا',
      joinCode: genJoinCode(joins),
      activeLesson: 'أساسيات التحكم المنطقي',
      studentsCount: 0,
    };
    data.classes = [...data.classes, cls];
    return save().then(() => cls);
  },
  updateClass(id, patch) {
    const idx = data.classes.findIndex(c => c.id === id);
    if (idx === -1) return Promise.resolve(null);
    const { name, grade, code, joinCode, activeLesson, activeLessonId } = patch || {};
    data.classes[idx] = {
      ...data.classes[idx],
      ...(name != null ? { name: String(name).trim() } : {}),
      ...(grade != null ? { grade: String(grade).trim() } : {}),
      ...(code != null ? { code: String(code).trim() } : {}),
      ...(joinCode != null ? { joinCode: String(joinCode).trim() } : {}),
      ...(activeLesson != null ? { activeLesson: String(activeLesson).trim() } : {}),
      ...(activeLessonId != null ? { activeLessonId: String(activeLessonId).trim() } : {}),
    };
    const updated = data.classes[idx];
    return save().then(() => updated);
  },
  deleteClass(id) {
    const before = data.classes.length;
    data.classes = data.classes.filter(c => c.id !== id);
    // Deleting a class also removes its students' enrollments
    data.students = data.students.filter(s => s.classId !== id);
    if (before === data.classes.length) return Promise.resolve(false);
    return save().then(() => true);
  },
  addStudent({ classId, name, robot }) {
    const cls = data.classes.find(c => c.id === classId);
    if (!cls) return Promise.reject(new Error('الشعبة غير موجودة'));
    const codes = new Set(data.students.map(s => s.loginCode));
    const classStudents = data.students.filter(s => s.classId === classId);
    const student = {
      id: genId(),
      name: String(name || '').trim(),
      loginCode: genUniqueCode('MG', codes),
      secretEmojis: pickEmojis(),
      assignedRobot: robot || ROBOT_OPTIONS[0],
      stationId: genStationId(classStudents.length),
      classId,
      status: 'active',
      progress: 'لم يبدأ بعد',
      stars: 0,
      xp: 0,
      streakDays: 0,
      completedQuests: [],
      activeModel: 'mini_gm',
      lastActivity: null,
    };
    data.students = [...data.students, student];
    return save().then(() => student);
  },
  updateStudent(id, patch) {
    const idx = data.students.findIndex(s => s.id === id);
    if (idx === -1) return Promise.resolve(null);
    const allowed = ['name', 'assignedRobot', 'stationId', 'status', 'progress', 'stars', 'xp', 'activeModel', 'completedQuests', 'lastActivity', 'streakDays', 'certificates'];
    for (const key of allowed) {
      if (patch && patch[key] !== undefined) {
        data.students[idx][key] = patch[key];
      }
    }
    const updated = data.students[idx];
    return save().then(() => updated);
  },
  deleteStudent(id) {
    const before = data.students.length;
    data.students = data.students.filter(s => s.id !== id);
    if (before === data.students.length) return Promise.resolve(false);
    return save().then(() => true);
  },
  replaceAll({ classes, students, units }) {
    data = {
      classes: Array.isArray(classes) ? classes : data.classes,
      students: Array.isArray(students) ? students : data.students,
      units: Array.isArray(units) ? units : data.units,
    };
    return save();
  },
};

export default store;