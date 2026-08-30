import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import store from './store.mjs';

const PORT = process.env.PORT || 3300;
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

await store.init();

const wrap = (fn) => (req, res) => {
  Promise.resolve()
    .then(() => fn(req, res))
    .catch((err) => {
      console.error('[school-api]', err.message);
      res.status(400).json({ error: err.message || 'خطأ داخلي' });
    });
};

// ---- Classes ----
app.get('/api/classes', wrap(async (_req, res) => {
  res.json(store.getClasses());
}));

app.post('/api/classes', wrap(async (req, res) => {
  const { name, grade } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'اسم الشعبة مطلوب' });
  }
  const cls = await store.addClass({ name, grade });
  res.status(201).json(cls);
}));

app.patch('/api/classes/:id', wrap(async (req, res) => {
  const updated = await store.updateClass(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'الشعبة غير موجودة' });
  res.json(updated);
}));

app.delete('/api/classes/:id', wrap(async (req, res) => {
  const ok = await store.deleteClass(req.params.id);
  if (!ok) return res.status(404).json({ error: 'الشعبة غير موجودة' });
  res.json({ ok: true });
}));

// ---- Students ----
app.get('/api/students', wrap(async (req, res) => {
  res.json(store.getStudents(req.query.classId || undefined));
}));

app.get('/api/students/:id', wrap(async (req, res) => {
  const student = store.getStudents().find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'الطالب غير موجود' });
  res.json(student);
}));

app.get('/api/classes/:id/students', wrap(async (req, res) => {
  res.json(store.getStudents(req.params.id));
}));

app.post('/api/students', wrap(async (req, res) => {
  const { classId, name, robot } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'اسم الطالب مطلوب' });
  }
  const student = await store.addStudent({ classId, name, robot });
  res.status(201).json(student);
}));

app.patch('/api/students/:id', wrap(async (req, res) => {
  const updated = await store.updateStudent(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'الطالب غير موجود' });
  res.json(updated);
}));

// ---- Issue a certificate to a student (registers in shared profile) ----
app.post('/api/students/:id/certificates', wrap(async (req, res) => {
  const { courseName, coachName, level, unitId } = req.body || {};
  const students = store.getStudents();
  const student = students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'الطالب غير موجود' });
  const certs = Array.isArray(student.certificates) ? student.certificates : [];
  const cert = {
    id: crypto.randomUUID(),
    certNumber: `CERT-${String(Math.floor(1000 + Math.random() * 9000))}`,
    unitId: unitId || undefined,
    courseName: String(courseName || '').trim() || 'مسار هندسة الروبوتات والبرمجة الخوارزمية (منظومة Mini G)',
    coachName: coachName ? String(coachName).trim() : undefined,
    level: String(level || 'مشاركة'),
    issuedAt: new Date().toISOString(),
  };
  const updated = await store.updateStudent(student.id, { certificates: [...certs, cert] });
  res.status(201).json(updated);
}));

app.delete('/api/students/:id', wrap(async (req, res) => {
  const ok = await store.deleteStudent(req.params.id);
  if (!ok) return res.status(404).json({ error: 'الطالب غير موجود' });
  res.json({ ok: true });
}));

// ---- Quick student login (section join code + MG login code) ----
app.post('/api/login', wrap(async (req, res) => {
  const { joinCode, loginCode } = req.body || {};
  const found = store.findByJoin(joinCode, loginCode);
  if (!found) return res.status(404).json({ error: 'الكود غير مطابق — تحقق من رقم الشعبة ورمز الدخول من بطاقتك' });
  res.json({ student: found.student, className: found.className });
}));

// ---- Curriculum units ----
app.get('/api/units', wrap(async (_req, res) => {
  res.json(store.getUnits());
}));

app.post('/api/units', wrap(async (req, res) => {
  const unit = await store.addUnit(req.body || {});
  res.status(201).json(unit);
}));

app.patch('/api/units/:id', wrap(async (req, res) => {
  const updated = await store.updateUnit(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'الوحدة غير موجودة' });
  res.json(updated);
}));

app.delete('/api/units/:id', wrap(async (req, res) => {
  const ok = await store.deleteUnit(req.params.id);
  if (!ok) return res.status(404).json({ error: 'الوحدة غير موجودة' });
  res.json({ ok: true });
}));

// ---- Worksheet generation (template-based; AI optional via OPENAI_API_KEY) ----
app.post('/api/worksheets/generate', wrap(async (req, res) => {
  const { unitId, count } = req.body || {};
  const unit = store.getUnits().find(u => u.id === unitId);
  if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });
  const n = Math.max(1, Math.min(7, Number(count) || 3));
  const questions = templateWorksheet(unit, n);
  res.json({ questions, source: 'template' });
}));

// Simple in-server template generator (mirrors client worksheetGenerator.ts)
function templateWorksheet(unit, count) {
  const FEATS = {
    mini_gf: { parts: ['ليدات RGB', 'محرك هزاز (Haptic)', 'مستشعر لمس كهروسكوني', 'بطارية ليثيوم صغيرة'], actions: ['تضيء باللون الأخضر', 'تهتز بنبضة قصيرة', 'تستجيب للّمس', 'تومض بالأحمر للإنذار'], sensors: ['مستشعر اللمس السعوي', 'مستشعر الألوان', 'حساس الحرارة', 'مستشعر المسافة'] },
    mini_gm: { parts: ['شاشة OLED', 'محرك سيرفو للرأس', ' buzzer', 'أزرار لمسية'], actions: ['تُغيّر تعبير العيون', 'تُحرّك الرأس بزاوية', 'تشغيل نغمة', 'تغمز عند التحية'], sensors: ['مستشعر الصوت', 'مستشعر اللمس', 'حساس الضوء', 'مستشعر الميل'] },
    mini_g:  { parts: ['محركات قيادة تفاضلية', 'ذراعان بسيرفو', 'مكبر صوت DAC', 'كاميرا اختيارية'], actions: ['تتحرك بالعجلات للأمام', 'ترفع الذراعين', 'تنطق بشخصية الخوارزمي', 'تتفادى العوائق'], sensors: ['مستشعر المسافة ToF', 'كاميرا رؤية', 'حساس الخط', 'مستشعر اللمس'] },
  };
  const feats = FEATS[unit.model] || FEATS.mini_gm;
  const modelName = unit.model === 'mini_gf' ? 'ميني جي إف (الميدالية)' : unit.model === 'mini_gm' ? 'ميني جي إم (رفيق المكتب)' : 'ميني جي (الروبوت الكامل)';
  const otherModels = ['ميني جي إف (الميدالية)', 'ميني جي إم (رفيق المكتب)', 'ميني جي (الروبوت الكامل)'].filter(m => m !== modelName);
  const pick = (arr, n) => { const c = [...arr]; const o = []; while (o.length < n && c.length) { const i = Math.floor(Math.random() * c.length); o.push(c.splice(i,1)[0]); } return o; };

  const builders = [
    () => ({ q: `ما هو الهدف الهندسي الرئيسي للوحدة «${unit.titleAr}»؟`, options: [unit.descriptionAr.slice(0,70), ...pick(feats.actions.filter(a=>!unit.descriptionAr.includes(a)),3)], correctIndex: 0 }),
    () => ({ q: 'أي روبوت هو المستهدف في هذه الوحدة؟', options: [modelName, ...pick(otherModels,3)], correctIndex: 0 }),
    () => ({ q: 'ما معيار التحقق الذي يثبت إنجاز المهمة؟', options: [unit.targetCriteria?.descriptionAr || 'استيفاء الشروط', ...pick(feats.actions,3)], correctIndex: 0 }),
    () => { const pins = unit.hardwarePins || ''; return pins ? { q: 'أي قطعة هاردوير تُستخدم في هذه المهمة؟', options: [pins.split('|')[0].trim(), ...pick(feats.parts.filter(p=>!pins.includes(p)),3)], correctIndex: 0 } : { q: 'أي قطعة هاردوير مرتبطة بهذا الروبوت؟', options: [feats.parts[0], ...pick(feats.parts.slice(1),3)], correctIndex: 0 }; },
    () => { const hints = unit.blocksHint || []; if (hints.length) { const pool = ['[🎨 لوّن الروبوت: أزرق]','[🚗 تحرك: للخلف]','[🎵 نغمة: حزينة]','[🦾 حركة الذراع: إنزال]'].filter(h=>!hints.includes(h)); return { q: 'أي كتلة Blockly مرتبطة بمهمة هذه الوحدة؟', options: [hints[0], ...pick(pool,3)], correctIndex: 0 }; } return { q: 'ما الإجراء الأساسي الذي تقوم به هذه الوحدة؟', options: [feats.actions[0], ...pick(feats.actions.slice(1),3)], correctIndex: 0 }; },
    () => { const correct = unit.difficulty || 'متوسط'; const others = ['مبتدئ','متوسط','بطل'].filter(d=>d!==correct); return { q: 'ما مستوى صعوبة هذه الوحدة؟', options: [correct, ...others], correctIndex: 0 }; },
    () => { const correct = feats.sensors[0]; return { q: 'أي مستشعر أكثر ارتباطاً بهذه المهمة؟', options: [correct, ...pick(feats.sensors.filter(s=>s!==correct),3)], correctIndex: 0 }; },
  ];
  const shuffled = builders.sort(() => 0.5 - Math.random()).slice(0, Math.min(count, builders.length));
  return shuffled.map(builder => { const q = builder(); const correct = q.options[q.correctIndex]; const opts = [...q.options].sort(() => 0.5 - Math.random()); return { q: q.q, options: opts, correctIndex: opts.indexOf(correct) }; });
}

// ---- Backup / Restore ----
app.get('/api/export', wrap(async (_req, res) => {
  res.json(store.snapshot());
}));

app.post('/api/import', wrap(async (req, res) => {
  const { classes, students, units } = req.body || {};
  await store.replaceAll({ classes, students, units });
  res.json(store.snapshot());
}));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, classes: store.getClasses().length, students: store.getStudents().length, units: store.getUnits().length });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[school-api] Mini G school server ready on http://0.0.0.0:${PORT}`);
});