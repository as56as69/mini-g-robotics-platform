import React, { useState, useEffect, useRef } from 'react';
import { RobotModelType } from '../types/robot';
import { StudentProfile, Classroom, StudentStatus, SchoolUnit } from '../types/lms';
import { defaultUnitXml, difficultyXp } from '../services/unitInitialXml';
import {
  Users, BookOpen, CheckCircle, Clock, Plus, BarChart3, Award,
  PlusCircle, Trash2, Edit3, PlayCircle, QrCode, Layers, FileText,
  Shield, Cpu, Radio, Database, Terminal, ShieldAlert, ChevronRight, X,
  Download, Upload, Copy, UserPlus, KeyRound, Wifi, WifiOff, Loader2, Hammer
} from 'lucide-react';
import { CertificateGeneratorModal } from './CertificateGeneratorModal';
import { WiringDiagramModal } from './WiringDiagramModal';
import { StudentBadgeCardsModal } from './StudentBadgeCardsModal';
import { PrintableFlashcardsModal } from './PrintableFlashcardsModal';
import { PrintableActivitiesModal } from './PrintableActivitiesModal';
import { SafetyGuardModal } from './SafetyGuardModal';
import { SoundFXManager } from '../ble/SoundFX';
import { useSchoolData, ServerStatus } from '../services/useSchoolData';
import confetti from 'canvas-confetti';

interface Props {
  activeModel: RobotModelType;
}

const ROBOT_CHOICES = [
  'Mini G-F (الميدالية)',
  'Mini G-M (رفيق المكتب)',
  'Mini G (الروبوت الكامل)',
];

function statusMeta(status: StudentStatus) {
  if (status === 'done') return { icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />, label: 'أنجز', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
  if (status === 'active') return { icon: <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />, label: 'قيد العمل', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' };
  return { icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />, label: 'يطلب مساعدة', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' };
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export const SchoolLMSView: React.FC<Props> = ({ activeModel }) => {
  const {
    classes, students, units, serverStatus, refresh,
    addClass, updateClass, deleteClass,
    addStudent, updateStudent, deleteStudent, setStudentStatus,
    addUnit, deleteUnit, activateUnit,
    exportJson, importJson,
  } = useSchoolData();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(() => localStorage.getItem('mg_school_selected_class'));
  const [activeTab, setActiveTab] = useState<'classes' | 'curriculum' | 'creator' | 'badges' | 'flashcards' | 'worksheets' | 'safety' | 'certificates' | 'wiring' | 'analytics'>('classes');
  const [toast, setToast] = useState<string | null>(null);
  const [analyticsDev, setAnalyticsDev] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const notifyAnalytics = (msg: string) => {
    setAnalyticsDev(msg);
    window.clearTimeout((notifyAnalytics as any)._t);
    (notifyAnalytics as any)._t = window.setTimeout(() => setAnalyticsDev(null), 2600);
  };

  // ------------------------------------------------
  // New class form
  const [showClassForm, setShowClassForm] = useState(false);
  const [classFormMode, setClassFormMode] = useState<'add' | 'edit'>('add');
  const [classFormName, setClassFormName] = useState('');
  const [classFormGrade, setClassFormGrade] = useState('');
  const [classFormId, setClassFormId] = useState<string | null>(null);

  // New student form
  const [studentName, setStudentName] = useState('');
  const [studentRobot, setStudentRobot] = useState(ROBOT_CHOICES[1]);
  const [studentSubmitting, setStudentSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep class selection valid as data loads / changes
  const currentClass = classes.find(c => c.id === selectedClassId) ?? classes[0] ?? null;
  useEffect(() => {
    if (!classes.length) return;
    if (!classes.find(c => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // remember the last section the teacher worked on (so new students stay visible after a reload)
  useEffect(() => {
    if (selectedClassId) localStorage.setItem('mg_school_selected_class', selectedClassId);
  }, [selectedClassId]);

  const roster = currentClass ? students.filter(s => s.classId === currentClass.id) : [];
  const activeCount = students.filter(s => s.status === 'active').length;

  const openAddClass = () => {
    setClassFormMode('add');
    setClassFormId(null);
    setClassFormName('');
    setClassFormGrade('');
    setShowClassForm(true);
  };

  const openEditClass = (cls: Classroom) => {
    setClassFormMode('edit');
    setClassFormId(cls.id);
    setClassFormName(cls.name);
    setClassFormGrade(cls.grade);
    setShowClassForm(true);
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormName.trim()) return;
    if (classFormMode === 'edit' && classFormId) {
      await updateClass(classFormId, { name: classFormName.trim(), grade: classFormGrade.trim() || undefined });
      notify('تم تحديث بيانات الشعبة ✅');
    } else {
      const added = await addClass({ name: classFormName.trim(), grade: classFormGrade.trim() });
      setSelectedClassId(added.id);
      notify(`أُنشئت الشعبة ${added.name} — كود الانضمام: ${added.joinCode} 🤝`);
      confetti({ particleCount: 40, spread: 55, origin: { y: 0.6 } });
    }
    setShowClassForm(false);
    setClassFormName('');
    setClassFormGrade('');
  };

  const handleDeleteClass = async (cls: Classroom) => {
    const count = students.filter(s => s.classId === cls.id).length;
    if (!window.confirm(`حذف الشعبة «${cls.name}»؟ سَيُحذف ${count} طالباً مسجلاً فيها.`)) return;
    await deleteClass(cls.id);
    notify('حُذفت الشعبة وطلابها 🗑️');
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !studentName.trim()) return;
    setStudentSubmitting(true);
    const added = await addStudent({ classId: currentClass.id, name: studentName.trim(), robot: studentRobot });
    setStudentSubmitting(false);
    setStudentName('');
    if (!added.loginCode.startsWith('MG-####')) {
      notify(`سُجّل ${added.name} — كود الدخول: ${added.loginCode} 🎫`);
      SoundFXManager.playVictory();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } else {
      notify(`${added.name} سُجّل محلياً — ينتظر اتصال الخادم للمزامنة ⏳`);
    }
  };

  const handleAddStudentInline = async (input: { name: string; robot?: string }) => {
    if (!currentClass) {
      notify('اختر شعبة أولاً من تبويب «إدارة الفصول والطلاب» 🏫');
      return;
    }
    const added = await addStudent({ classId: currentClass.id, name: input.name, robot: input.robot });
    if (!added.loginCode.startsWith('MG-####')) {
      notify(`سُجّل ${added.name} وأُصدرت بطاقته: ${added.loginCode} 🎫`);
      SoundFXManager.playVictory();
    } else {
      notify(`${added.name} سُجّل محلياً — ينتظر الخادم ⏳`);
    }
  };

  const ready = classes.length > 0;

  // ------------------------------------------------
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const hints = newBlocksHint
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    await addUnit({
      titleAr: newTitle.trim(),
      descriptionAr: newDesc.trim() || 'وحدة تعليمية وتحدي هندسي معتمد من المدرب',
      model: newModel,
      difficulty: newDiff,
      xpReward: difficultyXp(newDiff),
      starsCount: 3,
      targetCriteria: {
        descriptionAr: newCriteria.trim() || 'استيفاء الشروط البرمجية واختبار سلامة التنفيذ',
        targetEvent: 'CUSTOM_EVENT',
      },
      initialXml: defaultUnitXml(newModel),
      hardwarePins: newHardwarePins.trim(),
      blocksHint: hints,
    });

    setNewTitle('');
    setNewDesc('');
    setNewCriteria('');
    setNewHardwarePins('');
    setNewBlocksHint('');
    setActiveTab('curriculum');
    notify('نُشرت الوحدة في المنهاج المشترك ✅');
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const handleDeleteLesson = async (lesson: SchoolUnit) => {
    if (!window.confirm(`حذف الوحدة «${lesson.titleAr}» من المنهاج المشترك؟`)) return;
    await deleteUnit(lesson.id);
    notify('حُذفت الوحدة 🗑️');
  };

  // New Lesson Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newModel, setNewModel] = useState<RobotModelType>('mini_gm');
  const [newDiff, setNewDiff] = useState<'مبتدئ' | 'متوسط' | 'بطل'>('مبتدئ');
  const [newCriteria, setNewCriteria] = useState('');
  const [newHardwarePins, setNewHardwarePins] = useState('');
  const [newBlocksHint, setNewBlocksHint] = useState('');

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mini_g_school_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify('صُدّرت نسخة احتياطية كاملة 💾');
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const ok = await importJson(text);
    if (ok) {
      notify('استُوردت البيانات وتم الدمج ✅');
      void refresh();
    } else {
      notify('ملف غير صالح — تأكد أنه نسخة تصدير Mini G ❌');
    }
  };

  const handleCopyJoinCode = async (code: string) => {
    const ok = await copyTextToClipboard(code);
    notify(ok ? `نُسخ كود الانضمام: ${code} 📋` : 'تعذر النسخ — انسخ الرقم يدوياً');
  };

  const badgeStudents = currentClass ? roster : students;

  return (
    <div className="print-wrap-host flex-1 flex flex-col p-3 md:p-6 gap-4 sm:gap-6 overflow-y-auto bg-transparent text-slate-100">
      {/* Heavy Academic Mission Control Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-925 to-slate-900 border border-slate-750 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none text-9xl font-mono select-none">
          STEM
        </div>

        <div className="flex items-center gap-3.5 z-10">
          <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-2xl shadow-inner text-blue-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                مركز إدارة المختبرات والتعليم الروبوتي (Institutional Robotics Hub)
              </h2>
              {serverStatus === 'online' && (
                <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  SYSTEM ONLINE 🟢
                </span>
              )}
              {serverStatus === 'offline' && (
                <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                  وضع محلي (بلا خادم)
                </span>
              )}
              {serverStatus === 'loading' && (
                <span className="text-[10px] font-mono font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> جارِ التزامن…
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة الفصول، تسجيل الطلاب في الشعب، معايير المناهج الهندسية، والرقابة الأمنية
            </p>
          </div>
        </div>

        {/* Global Live Statistics Strip */}
        <div className="flex items-center gap-3 text-xs font-mono z-10 flex-wrap">
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">الفصول النشطة:</span>
            <span className="font-bold text-white">{classes.length}</span>
          </div>
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">محطات نشطة الآن:</span>
            <span className="font-bold text-emerald-400">{activeCount}</span>
          </div>
          <button
            onClick={() => { void refresh(); notify('جارِ التزامن مع الخادم…'); }}
            className="bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition flex items-center gap-1.5"
            title="مزامنة مع الخادم"
          >
            {serverStatus === 'offline' ? <WifiOff className="w-3.5 h-3.5 text-rose-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{serverStatus === 'online' ? 'متزامن' : 'إعادة محاولة'}</span>
          </button>
        </div>
      </div>

      {/* Professional Module Navigation Tabs */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 overflow-x-auto gap-1 text-xs shadow-md scrollbar-none">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'classes' ? 'bg-gradient-to-r from-school-primaryDeep to-school-primary text-white border border-white/10 shadow-md shadow-school-primary/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة الفصول والطلاب</span>
        </button>

        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'curriculum' ? 'bg-gradient-to-r from-school-primaryDeep to-school-primary text-white border border-white/10 shadow-md shadow-school-primary/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>المناهج والوحدات</span>
        </button>

        <button
          onClick={() => setActiveTab('creator')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'creator' ? 'bg-school-primary text-white shadow-md shadow-school-primary/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ بناء وحدة جديدة</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'badges' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>بطاقات الدخول 🏷️</span>
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'flashcards' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>بطاقات المهام 🃏</span>
        </button>

        <button
          onClick={() => setActiveTab('worksheets')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'worksheets' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>أوراق العمل 📝</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'safety' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>الأمان والرقابة 🔒</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'certificates' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>الشهادات المعتمدة 🎓</span>
        </button>

        <button
          onClick={() => setActiveTab('wiring')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'wiring' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>المخططات والدوائر</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeTab === 'analytics' ? 'bg-gradient-to-r from-school-primaryDeep to-school-primary text-white border border-white/10 shadow-md shadow-school-primary/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>التقارير التحليلية</span>
        </button>
      </div>

      {/* ----------------- TAB CONTENTS ----------------- */}

      {/* Tab 1: Classes & Student Roster */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Class Selection Column */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>سجل الشعب والفصول</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={handleExport} className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition" title="تصدير نسخة احتياطية JSON">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition" title="استيراد نسخة احتياطية">
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) void handleImportFile(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={openAddClass}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-school-primaryDeep to-school-primary text-white hover:brightness-110 text-xs flex items-center gap-1 font-bold transition border border-white/10 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة شعبة</span>
                  </button>
                </div>
              </div>

              {/* Add / Edit class form */}
              {showClassForm && (
                <form onSubmit={handleSubmitClass} className="bg-slate-950 border border-blue-500/40 rounded-xl p-3 flex flex-col gap-2 text-xs shadow-inner">
                  <span className="text-[10px] font-bold text-blue-300 flex items-center gap-1">
                    {classFormMode === 'add' ? <PlusCircle className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    {classFormMode === 'add' ? 'شعبة / فصل جديد' : 'تعديل بيانات الشعبة'}
                  </span>
                  <input
                    value={classFormName}
                    onChange={e => setClassFormName(e.target.value)}
                    placeholder="اسم الشعبة (مثال: شعبة أساسيات الروبوت — أ)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    value={classFormGrade}
                    onChange={e => setClassFormGrade(e.target.value)}
                    placeholder="المرحلة/الصف (اختياري)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button type="button" onClick={() => setShowClassForm(false)} className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 transition">إلغاء</button>
                    <button type="submit" className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition">
                      {classFormMode === 'add' ? 'إنشاء الشعبة' : 'حفظ التعديل'}
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-col gap-2">
                {classes.length === 0 && !ready && (
                  <div className="text-[11px] text-slate-500 text-center py-4">جارِ تحميل سجل الشعب…</div>
                )}
                {classes.length === 0 && ready && (
                  <div className="text-[11px] text-slate-500 text-center py-4">لا توجد شعب بعد — أنشئ شعبتك الأولى ⬆️</div>
                )}
                {classes.map((cls) => {
                  const count = students.filter(s => s.classId === cls.id).length;
                  const isSelected = currentClass?.id === cls.id;
                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-2 ${
                        isSelected ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/50' : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                          <ChevronRight className={`w-3.5 h-3.5 text-blue-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                          <span className="truncate">{cls.name}</span>
                        </h4>
                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded font-mono text-blue-400 border border-slate-800 shrink-0">
                          {cls.code}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate">{cls.grade || '—'}</span>
                        <span className="font-mono text-slate-300 font-bold shrink-0">{count} طالب</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="flex-1 font-mono text-[10px] text-slate-500 flex items-center gap-1 bg-slate-950 rounded border border-slate-800 px-1.5 py-0.5">
                          <KeyRound className="w-2.5 h-2.5 text-amber-400" />
                          <span dir="ltr">{cls.joinCode}</span>
                        </span>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); void handleCopyJoinCode(cls.joinCode); }}
                          className="p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-300 transition"
                          title="نسخ كود الانضمام"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); openEditClass(cls); }}
                          className="p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-blue-300 transition"
                          title="تعديل الشعبة"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); void handleDeleteClass(cls); }}
                          className="p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                          title="حذف الشعبة"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Students Roster for selected class */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-xl">
            {currentClass ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                      <span>{currentClass.name}</span>
                      <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        كود الشعبة: {currentClass.code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">الوحدة الحالية: {currentClass.activeLesson}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{roster.length} طالباً مسجلاً</span>
                    </span>
                    <button
                      onClick={() => void handleCopyJoinCode(`${currentClass.name} — كود الانضمام: ${currentClass.joinCode}`)}
                      className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 hover:bg-amber-500/20 transition"
                      title="نسخ كود الانضمام لتعليقه على لوحة الفصل"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span dir="ltr">{currentClass.joinCode}</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Register student form */}
                <form onSubmit={handleAddStudent} className="bg-slate-950 border border-blue-500/40 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-blue-300 flex items-center gap-1.5 shrink-0">
                    <UserPlus className="w-4 h-4" />
                    تسجيل طالب جديد:
                  </span>
                  <input
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    placeholder="الاسم الكامل للطالب…"
                    required
                    className="flex-1 min-w-[180px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={studentRobot}
                    onChange={e => setStudentRobot(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {ROBOT_CHOICES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    type="submit"
                    disabled={studentSubmitting || !studentName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow active:scale-95"
                  >
                    {studentSubmitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : '+ تسجيل'}
                  </button>
                </form>

                {/* Students Grid */}
                {roster.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <div className="text-4xl opacity-30">🧑‍🎓</div>
                    <div className="text-sm font-bold text-slate-300">لا يوجد طلاب في هذه الشعبة بعد</div>
                    <div className="text-xs text-slate-500">استخدم نموذج «تسجيل طالب جديد» أعلاه — سيحصل كل طالب تلقائياً على كود دخول، إيموجيات سرية، ومحطة عمل</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {roster.map((st) => {
                      const meta = statusMeta(st.status);
                      return (
                        <div key={st.id} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2.5 shadow-md overflow-hidden min-w-0">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="font-bold text-xs text-slate-100 truncate min-w-0">{st.name}</span>
                            <span className="text-[10px] text-blue-400 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0 whitespace-nowrap">
                              {st.assignedRobot.split(' (')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap min-w-0">
                            <span className="flex items-center gap-1 shrink-0" title="محطة العمل">
                              <Terminal className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">{st.stationId}</span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0" title="كود الدخول السري">
                              <KeyRound className="w-3 h-3 text-amber-400" />
                              <span className="font-mono" dir="ltr">{st.loginCode}</span>
                            </span>
                            <span className="flex items-center gap-0.5 text-base shrink-0" title="الإيموجيات السرية">
                              {st.secretEmojis.map((em, i) => <span key={i}>{em}</span>)}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 flex items-center gap-1.5 min-h-4 min-w-0">
                            {meta.icon}
                            <span className="truncate min-w-0">{st.progress || 'لم يبدأ بعد'}</span>
                          </div>

                          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-850 text-[10px]">
                            <div className="flex items-center gap-1 flex-wrap min-w-0">
                              {(['done', 'active', 'help'] as StudentStatus[]).map(s => {
                                const sm = statusMeta(s);
                                const active = st.status === s;
                                return (
                                  <button
                                    key={s}
                                    onClick={() => setStudentStatus(st.id, s)}
                                    title={`الحالة: ${sm.label}`}
                                    className={`px-1.5 py-1 rounded-md border font-bold transition shrink-0 ${active ? sm.cls : 'text-slate-500 border-slate-800 hover:text-slate-300'}`}
                                  >
                                    {sm.label}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => setViewingStudent(prev => (prev === st.id ? null : st.id))}
                                className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-0.5 shrink-0 mr-auto"
                                title="عرض السجل"
                              >
                                <Terminal className="w-3 h-3" />
                                <span>السجل</span>
                              </button>
                              <button
                                onClick={() => { if (window.confirm(`حذف الطالب «${st.name}» من الشعبة؟`)) void deleteStudent(st.id); }}
                                className="text-slate-500 hover:text-rose-400 transition shrink-0"
                                title="حذف الطالب"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Student Record Viewer Panel */}
                {viewingStudent && (() => {
                  const st = students.find(s => s.id === viewingStudent);
                  if (!st) return null;
                  return (
                    <div className="mt-1 bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                        <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" />
                         سجل الطالب — {st.name}
                        </span>
                        <button
                          onClick={() => setViewingStudent(null)}
                          className="text-slate-400 hover:text-slate-200 transition"
                          title="إغلاق"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mb-3">
                        <div className="bg-slate-900 rounded-lg p-2">
                          <div className="text-slate-500 text-[9px]">كود الدخول</div>
                          <div className="font-mono text-amber-300 font-bold" dir="ltr">{st.loginCode}</div>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-2">
                          <div className="text-slate-500 text-[9px]">الإيموجيات السرية</div>
                          <div className="text-base">{st.secretEmojis.join(' ')}</div>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-2">
                          <div className="text-slate-500 text-[9px]">المحطة / الروبوت</div>
                          <div className="text-slate-300 font-bold">{st.stationId} • {st.assignedRobot}</div>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-2">
                          <div className="text-slate-500 text-[9px]">الحالة</div>
                          <div className="text-slate-300 font-bold">{statusMeta(st.status).label}</div>
                        </div>
                      </div>
                      <pre className="text-[11px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
{`// كشف الطالب: ${st.name}
// الشعبة: ${currentClass?.name ?? ''} — كود الانضمام ${currentClass?.joinCode ?? '—'}
async function main() {
  await robot.setLED('#38bdf8');     // إضاءة عيون الروبوت (${st.assignedRobot})
  await robot.setExpression('happy');
  await robot.wait(500);
}
main();`}
                      </pre>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                {ready ? 'أنشئ شعبة أولاً ثم سجّل طلابها هنا' : 'جارِ تحميل البيانات…'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Curriculum & Standardized Modules */}
      {activeTab === 'curriculum' && (
        <div className="flex flex-col gap-3">
          {units.length === 0 && serverStatus === 'loading' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span>جارِ تحميل المنهاج المشترك…</span>
            </div>
          )}
          {units.length === 0 && serverStatus !== 'loading' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="text-4xl opacity-30">📚</div>
              <span className="font-bold text-slate-300">لا توجد وحدات في المنهاج بعد</span>
              <span>ابنِ وحدتك الأولى من تبويب «بناء وحدة جديدة» وستُحفظ في المخزن المشترك.</span>
            </div>
          )}
          {units.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {units.map((lesson) => {
                const isActive = currentClass?.activeLessonId === lesson.id;
                return (
                  <div key={lesson.id} className={`bg-slate-900 border rounded-2xl p-4.5 flex flex-col justify-between gap-3 shadow-xl relative overflow-hidden transition ${isActive ? 'border-emerald-500/60 shadow-emerald-900/30' : 'border-slate-800'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {lesson.difficulty} • {lesson.model.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono text-amber-400 font-bold">+{lesson.xpReward} XP ⭐</span>
                          <button
                            onClick={() => void handleDeleteLesson(lesson)}
                            className="text-rose-400 hover:text-rose-300 p-1 transition"
                            title="حذف الوحدة من المنهاج"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {isActive && (
                        <span className="absolute top-2 left-2 text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                          نشطة في هذه الشعبة ✓
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-white leading-snug">{lesson.titleAr}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{lesson.descriptionAr}</p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        المعيار: {lesson.targetCriteria.descriptionAr}
                      </span>
                      <button
                        onClick={() => {
                          SoundFXManager.playRobotChirp();
                          if (currentClass) {
                            activateUnit(currentClass.id, lesson);
                            notify(`تم تفعيل الوحدة في الشعبة: ${lesson.titleAr} 🚀`);
                          } else {
                            notify('أنشئ شعبة أولاً لتفعيل الوحدة عليها');
                          }
                          confetti({ particleCount: 26, spread: 45, origin: { y: 0.6 } });
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-school-primaryDeep to-school-primary text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow border border-white/10"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>تفعيل</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Creator View (Academic Unit Builder) */}
      {activeTab === 'creator' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-school-primary" />
            <h3 className="font-bold text-sm md:text-base text-white">
              محرر وبناء المناهج الهندسية المخصصة (STEM Curriculum Builder)
            </h3>
          </div>

          <form onSubmit={handleCreateLesson} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">عنوان الوحدة التعليمية / التحدي:</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="مثال: خوارزمية الملاحة الذاتية وتفادي العوائق"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">الروبوت المستهدف:</label>
                <select
                  value={newModel}
                  onChange={e => setNewModel(e.target.value as RobotModelType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="mini_gf">Mini G-F (الميدالية الاستكشافية)</option>
                  <option value="mini_gm">Mini G-M (رفيق المكتب والذكاء)</option>
                  <option value="mini_g">Mini G (الروبوت الكامل 50cm AI)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">مستوى التحدي:</label>
                <select
                  value={newDiff}
                  onChange={e => setNewDiff(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="مبتدئ">مبتدئ (150 XP)</option>
                  <option value="متوسط">متوسط (300 XP)</option>
                  <option value="بطل">بطل (600 XP)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">الشرح والأهداف الخوارزمية:</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="حدد المفاهيم المنطقية (حلقات التكرار، قراءة الدخل، الاستجابة الزمنية)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">معيار التحقق والاختبار (Criteria):</label>
              <input
                type="text"
                value={newCriteria}
                onChange={e => setNewCriteria(e.target.value)}
                placeholder="مثال: تدوير محرك السيرفو للزاوية 45 وإرسال إشارة صوتية"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">أقطاب الـ Hardware (تُطبع على بطاقة المهمة — اختياري):</label>
              <input
                type="text"
                value={newHardwarePins}
                onChange={e => setNewHardwarePins(e.target.value)}
                placeholder="مثال: WS2812B Data: Pin 8 | Haptic: Pin 4 | Touch: Pin 2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">تلميحات كتل Blockly (سطر لكل تلميح — اختياري):</label>
              <textarea
                rows={3}
                value={newBlocksHint}
                onChange={e => setNewBlocksHint(e.target.value)}
                placeholder={'مثال:\n[🎨 لوّن الروبوت بلون: أخضر]\n[📳 هزاز الروبوت: نبضة قصيرة]'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-school-primary to-school-primaryDeep hover:brightness-110 text-white font-bold transition shadow-lg active:scale-95"
            >
              اعتماد ونشر الوحدة التعليمية للفصول 🚀
            </button>
          </form>
        </div>
      )}

      {/* Sub-Modals Render */}
      {activeTab === 'badges' && (
        <div className="print-area flex flex-col gap-3">
          <div className="print-hide bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center gap-3 flex-wrap shadow-xl">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
              <QrCode className="w-4 h-4 text-purple-400" />
              بطاقات شعبة:
            </span>
            <select
              value={selectedClassId ?? ''}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {students.filter(s => s.classId === c.id).length} طالب
                </option>
              ))}
            </select>
            {currentClass && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="font-mono text-slate-500 shrink-0">انضمام:</span>
                <span dir="ltr" className="font-mono text-amber-300 font-bold">{currentClass.joinCode}</span>
              </span>
            )}
          </div>
          <StudentBadgeCardsModal
            students={badgeStudents}
            onAddStudent={handleAddStudentInline}
            sectionName={currentClass?.name}
            joinCode={currentClass?.joinCode}
          />
        </div>
      )}
      {activeTab === 'flashcards' && <PrintableFlashcardsModal units={units} />}
      {activeTab === 'worksheets' && <PrintableActivitiesModal units={units} sectionName={currentClass?.name} joinCode={currentClass?.joinCode} />}
      {activeTab === 'safety' && <SafetyGuardModal />}
      {activeTab === 'certificates' && <CertificateGeneratorModal students={roster} units={units} sectionName={currentClass?.name} joinCode={currentClass?.joinCode} />}
      {activeTab === 'wiring' && <WiringDiagramModal model={activeModel} />}

      {/* Tab: Analytics View (real metrics from the roster) */}
      {activeTab === 'analytics' && (
        <div onClick={() => notifyAnalytics('قسم التقارير التحليلية قيد التطوير 🚧')}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col gap-5 shadow-xl relative">
            <span className="absolute top-3 left-3 text-[10px] bg-blue-500/15 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1 z-10">
              <Hammer className="w-3 h-3" />
              <span>قيد التطوير 🚧</span>
            </span>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span>مؤشرات الأداء من سجلات الطلاب الحية (STEM Analytics Dashboard)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{serverStatus === 'online' ? 'متزامن مع الخادم 🟢' : 'بيانات محلية 📴'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 cursor-pointer hover:border-blue-500/50 transition">
                <div className="text-2xl font-black text-blue-400 font-mono">{students.length}</div>
                <div className="text-xs text-slate-300 font-bold mt-1">طالباً مسجلاً في الشعب</div>
                <p className="text-[10px] text-slate-500 mt-0.5">عبر «تسجيل طالب جديد» في تبويب إدارة الفصول</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 cursor-pointer hover:border-blue-500/50 transition">
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {students.length ? Math.round((students.filter(s => s.status === 'done').length / students.length) * 100) : 0}%
                </div>
                <div className="text-xs text-slate-300 font-bold mt-1">معدل إنجاز الوحدات (حالة «أنجز»)</div>
                <p className="text-[10px] text-slate-500 mt-0.5">يُحدَّث لحظياً من حالة الطلاب</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 cursor-pointer hover:border-blue-500/50 transition">
                <div className="text-2xl font-black text-amber-400 font-mono">{activeCount}</div>
                <div className="text-xs text-slate-300 font-bold mt-1">محطة تعمل الآن (حالة «قيد العمل»)</div>
                <p className="text-[10px] text-slate-500 mt-0.5">من الأجهزة المفتوحة في الوقت الحالي</p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 text-[11px] font-bold text-slate-300 border-b border-slate-800">إحصاء لكل شعبة:</div>
              <div className="divide-y divide-slate-800/70">
                {classes.map(cls => {
                  const clsStudents = students.filter(s => s.classId === cls.id);
                  const done = clsStudents.filter(s => s.status === 'done').length;
                  return (
                    <div key={cls.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-slate-900/50 transition">
                      <span className="font-bold text-slate-200 truncate">{cls.name}</span>
                      <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400 shrink-0">
                        <span>{clsStudents.length} طالب</span>
                        <span className="text-emerald-400">{done} أنجزوا</span>
                        <span className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <span className="block h-full bg-gradient-to-r from-school-primary to-school-primaryDeep rounded-full" style={{ width: `${clsStudents.length ? (done / clsStudents.length) * 100 : 0}%` }} />
                        </span>
                      </div>
                    </div>
                  );
                })}
                {classes.length === 0 && <div className="px-4 py-4 text-center text-slate-500 text-xs">لا توجد شعب بعد</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {analyticsDev && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] bg-slate-950/95 border border-blue-500/50 text-blue-200 text-xs font-black px-4 py-2.5 rounded-2xl shadow-2xl shadow-blue-500/20 backdrop-blur whitespace-nowrap max-w-[92vw] text-center flex items-center gap-2">
          <Hammer className="w-4 h-4 text-blue-400" />
          <span>{analyticsDev}</span>
        </div>
      )}

      {/* Global toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-4 py-2 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
};