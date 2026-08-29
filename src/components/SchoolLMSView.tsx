import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Classroom, LessonChallenge } from '../types/lms';
import { 
  Users, BookOpen, CheckCircle, Clock, Plus, BarChart3, Award, Sparkles, 
  PlusCircle, Trash2, Edit3, PlayCircle, Printer, QrCode, Layers, FileText, 
  Shield, Cpu, Activity, Radio, Database, Server, Terminal, ShieldAlert, CheckCircle2, ChevronRight
} from 'lucide-react';
import { CertificateGeneratorModal } from './CertificateGeneratorModal';
import { WiringDiagramModal } from './WiringDiagramModal';
import { StudentBadgeCardsModal } from './StudentBadgeCardsModal';
import { PrintableFlashcardsModal } from './PrintableFlashcardsModal';
import { PrintableActivitiesModal } from './PrintableActivitiesModal';
import { SafetyGuardModal } from './SafetyGuardModal';
import confetti from 'canvas-confetti';

interface Props {
  activeModel: RobotModelType;
}

const INITIAL_CLASSES: Classroom[] = [
  { id: '1', name: 'شعبة الروبوتكس المتقدم (المستوى 1)', code: 'ROBO-101', grade: 'المرحلة الابتدائية العليا', studentsCount: 18, activeLesson: 'الخوارزميات وحساسات المسافة', completionRate: 88 },
  { id: '2', name: 'مختبر الذكاء الاصطناعي والأتمتة (الشعبة ب)', code: 'AI-204', grade: 'المرحلة المتوسطة', studentsCount: 22, activeLesson: 'التحكم بالمفاصل وشبكات الأعصاب', completionRate: 72 },
  { id: '3', name: 'فريق الابتكار والمسابقات الوطنية', code: 'PRO-301', grade: 'فريق النخبة التنافسي', studentsCount: 12, activeLesson: 'تتبع المسار والملاحة الذاتية', completionRate: 95 },
];

const INITIAL_LESSONS: LessonChallenge[] = [
  {
    id: 'l1',
    titleAr: 'الوحدة الأولى: البنية المعمارية للروبوت والمستشعرات',
    descriptionAr: 'برمجة ردود الفعل اللحظية واستجابة ليدات الـ RGB لمحفزات مستشعر اللمس الكهروسكوني.',
    model: 'mini_gf',
    difficulty: 'مبتدئ',
    xpReward: 150,
    starsCount: 3,
    targetCriteria: {
      descriptionAr: 'معالجة إشارة الدخل GPIO وتوليد نبضة PWM مع الهابتيك',
      targetEvent: 'TOUCH_OR_COLOR',
    },
  },
  {
    id: 'l2',
    titleAr: 'الوحدة الثانية: التوأم الرقمي والتحكم بمحركات السيرفو',
    descriptionAr: 'حساب زوايا التوجيه الحركي للرأس (Kinematics) ورسم تعبيرات البكسل على شاشة الـ OLED.',
    model: 'mini_gm',
    difficulty: 'متوسط',
    xpReward: 300,
    starsCount: 3,
    targetCriteria: {
      descriptionAr: 'معايرة زاوية الرأس بدقة 45° ومزامنة الحالة مع المحاكي',
      targetEvent: 'SERVO_MOTION',
    },
  },
  {
    id: 'l3',
    titleAr: 'الوحدة الثالثة: الملاحة الذاتية وتكامل الذكاء الاصطناعي',
    descriptionAr: 'خوارزميات القيادة التفاضلية بعجلات الروبوت وربط النماذج التوليدية لتوليد نبرة صوت الخوارزمي.',
    model: 'mini_g',
    difficulty: 'بطل',
    xpReward: 600,
    starsCount: 3,
    targetCriteria: {
      descriptionAr: 'تكامل واجهات GenAI API مع تحريك المفاصل المزدوجة',
      targetEvent: 'AI_PERSONA_SPEAK',
    },
  },
];

export const SchoolLMSView: React.FC<Props> = ({ activeModel }) => {
  const [classes, setClasses] = useState<Classroom[]>(INITIAL_CLASSES);
  const [lessons, setLessons] = useState<LessonChallenge[]>(INITIAL_LESSONS);
  const [selectedClass, setSelectedClass] = useState<Classroom>(INITIAL_CLASSES[0]);
  const [activeTab, setActiveTab] = useState<'classes' | 'curriculum' | 'creator' | 'badges' | 'flashcards' | 'worksheets' | 'safety' | 'certificates' | 'wiring' | 'analytics'>('classes');

  // New Lesson Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newModel, setNewModel] = useState<RobotModelType>('mini_gm');
  const [newDiff, setNewDiff] = useState<'مبتدئ' | 'متوسط' | 'بطل'>('مبتدئ');
  const [newCriteria, setNewCriteria] = useState('');

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newLesson: LessonChallenge = {
      id: `custom_${Date.now()}`,
      titleAr: newTitle.trim(),
      descriptionAr: newDesc.trim() || 'وحدة تعليمية وتحدي هندسي معتمد من المدرب',
      model: newModel,
      difficulty: newDiff,
      xpReward: newDiff === 'مبتدئ' ? 150 : newDiff === 'متوسط' ? 300 : 600,
      starsCount: 3,
      targetCriteria: {
        descriptionAr: newCriteria.trim() || 'استيفاء الشروط البرمجية واختبار سلامة التنفيذ',
        targetEvent: 'CUSTOM_EVENT'
      }
    };

    setLessons(prev => [newLesson, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setNewCriteria('');
    setActiveTab('curriculum');
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const handleDeleteLesson = (id: string) => {
    setLessons(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col p-3 md:p-6 gap-4 sm:gap-6 overflow-y-auto bg-slate-950 text-slate-100">
      {/* Heavy Academic Mission Control Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-925 to-slate-900 border border-slate-750 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
        {/* Subtle Tech Watermark Background */}
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
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                SYSTEM ONLINE 🟢
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة الفصول، معايير المناهج الهندسية، الرقابة الأمنية، ومتابعة مؤشرات التفكير المنطقي للطلاب
            </p>
          </div>
        </div>

        {/* Global Live Statistics Strip */}
        <div className="flex items-center gap-3 text-xs font-mono z-10 flex-wrap">
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">الفصول النشطة:</span>
            <span className="font-bold text-white">{classes.length}</span>
          </div>
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">عقد BLE المتصلة:</span>
            <span className="font-bold text-emerald-400">18 وحدة</span>
          </div>
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

      {/* Tab 1: Classes & Live Student Grid */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Class Selection Column */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-400" />
                <span>سجل الشعب والفصول</span>
              </span>
              <button
                onClick={() => {
                  const name = prompt('أدخل اسم الشعبة / الفصل الجديد:');
                  if (name) {
                    const newC: Classroom = {
                      id: `${Date.now()}`,
                      name,
                      code: `ROBO-${Math.floor(100 + Math.random() * 900)}`,
                      grade: 'المرحلة الابتدائية العليا',
                      studentsCount: 16,
                      activeLesson: 'أساسيات التحكم المنطقي',
                      completionRate: 60
                    };
                    setClasses(prev => [...prev, newC]);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-school-primaryDeep to-school-primary text-white hover:brightness-110 text-xs flex items-center gap-1 font-bold transition border border-white/10 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة شعبة</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-2 ${
                    selectedClass.id === cls.id
                      ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/50'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <ChevronRight className={`w-3.5 h-3.5 text-blue-400 transition-transform ${selectedClass.id === cls.id ? 'rotate-90' : ''}`} />
                      <span>{cls.name}</span>
                    </h4>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded font-mono text-blue-400 border border-slate-800">
                      {cls.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{cls.grade}</span>
                    <span className="font-mono text-slate-300 font-bold">{cls.studentsCount} طالب</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-school-primary to-school-primaryDeep h-full rounded-full" style={{ width: `${cls.completionRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Students Live Grid */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>{selectedClass.name}</span>
                  <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    كود الصف: {selectedClass.code}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">الوحدة الحالية: {selectedClass.activeLesson}</p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>16 محطة روبوت نشطة الآن</span>
              </span>
            </div>

            {/* Students Mock Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'زينب حيدر', progress: 'أكملت خوارزمية السيرفو', status: 'done', robot: 'Mini G-M', ping: '12ms' },
                { name: 'أحمد علي', progress: 'يبرمج مصفوفة الـ OLED', status: 'active', robot: 'Mini G-M', ping: '18ms' },
                { name: 'مصطفى حسين', progress: 'تحليل شرط حساس اللمس', status: 'help', robot: 'Mini G-F', ping: '24ms' },
                { name: 'نور الهدى', progress: 'أكملت حوار الذكاء الاصطناعي', status: 'done', robot: 'Mini G', ping: '10ms' },
                { name: 'يوسف عمر', progress: 'معايرة سرعة المحرك التفاضلي', status: 'active', robot: 'Mini G-M', ping: '15ms' },
                { name: 'مريم فراس', progress: 'أكملت تجربة نبضات الهابتيك', status: 'done', robot: 'Mini G-F', ping: '14ms' },
              ].map((st, i) => (
                <div key={i} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between gap-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-100">{st.name}</span>
                    <span className="text-[10px] text-blue-400 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {st.robot}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    {st.status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                    {st.status === 'active' && <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin flex-shrink-0" />}
                    {st.status === 'help' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
                    <span className="truncate">{st.progress}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-[10px]">
                    <span className="text-slate-500 font-mono">BLE: {st.ping}</span>
                    <button className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-0.5">
                      <span>عرض الكود</span>
                      <Terminal className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Curriculum & Standardized Modules */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between gap-3 shadow-xl relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {lesson.difficulty} • {lesson.model.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-amber-400 font-bold">+{lesson.xpReward} XP ⭐</span>
                    {lesson.id.startsWith('custom_') && (
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 transition"
                        title="حذف الوحدة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-sm text-white leading-snug">{lesson.titleAr}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{lesson.descriptionAr}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                  المعيار: {lesson.targetCriteria.descriptionAr}
                </span>
                <button className="px-3 py-1.5 bg-gradient-to-r from-school-primaryDeep to-school-primary text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow border border-white/10">
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>تفعيل</span>
                </button>
              </div>
            </div>
          ))}
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
      {activeTab === 'badges' && <StudentBadgeCardsModal />}
      {activeTab === 'flashcards' && <PrintableFlashcardsModal />}
      {activeTab === 'worksheets' && <PrintableActivitiesModal />}
      {activeTab === 'safety' && <SafetyGuardModal />}
      {activeTab === 'certificates' && <CertificateGeneratorModal />}
      {activeTab === 'wiring' && <WiringDiagramModal model={activeModel} />}

      {/* Tab: Analytics View */}
      {activeTab === 'analytics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col gap-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>مؤشرات الأداء الأكاديمي والتفكير المنطقي (STEM Analytics Dashboard)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">التقرير الدوري الشامل</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-blue-400 font-mono">680+</div>
              <div className="text-xs text-slate-300 font-bold mt-1">خوارزمية وكتلة برمجية منفذة</div>
              <p className="text-[10px] text-slate-500 mt-0.5">خلال الحصص والمختبرات الحالية</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-emerald-400 font-mono">94.2%</div>
              <div className="text-xs text-slate-300 font-bold mt-1">معدل النجاح في تصحيح الأخطاء (Debug)</div>
              <p className="text-[10px] text-slate-500 mt-0.5">يعكس قدرة حل المشكلات الذاتية لدى الأطفال</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-amber-400 font-mono">24</div>
              <div className="text-xs text-slate-300 font-bold mt-1">شهادة اعتماد معتمدة جاهزة للطباعة</div>
              <p className="text-[10px] text-slate-500 mt-0.5">مكتملة المتطلبات والمشاريع التطبيقية</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
