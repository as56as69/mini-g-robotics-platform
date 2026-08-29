import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Classroom, LessonChallenge } from '../types/lms';
import { Users, BookOpen, CheckCircle, Clock, Plus, BarChart3, Award, Sparkles, PlusCircle, Trash2, Edit3, PlayCircle, Printer, QrCode, Layers, FileText, Shield } from 'lucide-react';
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
  { id: '1', name: 'شعبة الأبطال (الصف الثالث)', code: 'MG-301', grade: 'المرحلة الابتدائية', studentsCount: 18, activeLesson: 'أساسيات تفاعل الروبوت', completionRate: 85 },
  { id: '2', name: 'مختبر الروبوتكس المتقدم (الشعبة ب)', code: 'MG-402', grade: 'المرحلة المتوسطة', studentsCount: 22, activeLesson: 'التحكم بالذكاء الاصطناعي', completionRate: 64 },
];

const INITIAL_LESSONS: LessonChallenge[] = [
  {
    id: 'l1',
    titleAr: 'الدرس الأول: تحية الصباح والمشاعر',
    descriptionAr: 'برمج روبوت Mini G-F أو Mini G-M ليرحب بالزملاء بالضوء والصوت وإيماءة الرأس.',
    model: 'mini_gf',
    difficulty: 'مبتدئ',
    xpReward: 100,
    starsCount: 3,
    targetCriteria: {
      descriptionAr: 'استخدام بلوك اللون وتفعيل الهزاز/الصوت',
      targetEvent: 'TOUCH_OR_COLOR',
    },
  },
  {
    id: 'l2',
    titleAr: 'الدرس الثاني: التوأم الرقمي وحركة المفاصل',
    descriptionAr: 'التحكم في زوايا محركات السيرفو وتغيير تعابير العيون بالشاشة.',
    model: 'mini_gm',
    difficulty: 'متوسط',
    xpReward: 250,
    starsCount: 3,
    targetCriteria: {
      descriptionAr: 'تدوير الرأس 45 درجة وضبط العيون سعيدة',
      targetEvent: 'SERVO_MOTION',
    },
  },
  {
    id: 'l3',
    titleAr: 'الدرس الثالث: روبوت الفصل الذكي والشخصيات',
    descriptionAr: 'توجيه روبوت Mini G بعجلات القيادة وإلقاء كلمة الخوارزمي بالذكاء الاصطناعي.',
    model: 'mini_g',
    difficulty: 'بطل',
    xpReward: 500,
    starsCount: 3,
    targetCriteria: {
      descriptionAr: 'الربط مع شخصية تاريخية ونطق الجملة الترحيبية',
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
      descriptionAr: newDesc.trim() || 'تحدي برمجي مخصص للفصل من قبل المدرب',
      model: newModel,
      difficulty: newDiff,
      xpReward: newDiff === 'مبتدئ' ? 100 : newDiff === 'متوسط' ? 250 : 500,
      starsCount: 3,
      targetCriteria: {
        descriptionAr: newCriteria.trim() || 'تنفيذ كتل الكود بنجاح',
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
    <div className="flex-1 flex flex-col p-4 md:p-6 gap-5 overflow-y-auto">
      {/* School Top Nav / Stats Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-inner">
            🏫
          </div>
          <div>
            <h2 className="text-base font-black text-white">لوحة تحكم المدرب والمدرسة (School LMS)</h2>
            <p className="text-xs text-slate-400">إدارة الفصول، بناء المناهج ومتابعة تقدم الطلاب لحظياً</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'classes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>الفصول والطلاب</span>
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'curriculum' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>المناهج والدروس</span>
          </button>
          <button
            onClick={() => setActiveTab('creator')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'creator' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ درس مخصص</span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'badges' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>بطاقات الدخول 🏷️</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'flashcards' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>بطاقات المهام 🃏</span>
          </button>
          <button
            onClick={() => setActiveTab('worksheets')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'worksheets' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>أوراق العمل 📝</span>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'safety' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>الأمان والرقابة 🔒</span>
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'certificates' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>الشهادات 🎓</span>
          </button>
          <button
            onClick={() => setActiveTab('wiring')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'wiring' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>التوصيل والدوائر</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>التقارير</span>
          </button>
        </div>
      </div>

      {/* Dynamic Tab Content */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Class List Column */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-sm text-slate-200">فصول المدرسة النشطة</span>
              <button
                onClick={() => {
                  const name = prompt('أدخل اسم الفصل الجديد:');
                  if (name) {
                    const newC: Classroom = {
                      id: `${Date.now()}`,
                      name,
                      code: `MG-${Math.floor(100 + Math.random() * 900)}`,
                      grade: 'المرحلة الابتدائية',
                      studentsCount: 15,
                      activeLesson: 'مقدمة الروبوتكس',
                      completionRate: 50
                    };
                    setClasses(prev => [...prev, newC]);
                  }
                }}
                className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs flex items-center gap-1 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة فصل</span>
              </button>
            </div>

            {classes.map((cls) => (
              <div
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedClass.id === cls.id
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white">{cls.name}</h4>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded font-mono text-indigo-400">{cls.code}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{cls.grade} • {cls.studentsCount} طالب</div>
                <div className="mt-2 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${cls.completionRate}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Real-time Students Live Grid */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">{selectedClass.name} - متابعة حية</h3>
                <p className="text-[11px] text-slate-400">الدرس الحالي: {selectedClass.activeLesson}</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                16 متصل الآن 🟢
              </span>
            </div>

            {/* Students Mock Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'زينب حيدر', progress: 'أكملت التحدي 3', status: 'done', robot: 'Mini G-M' },
                { name: 'أحمد علي', progress: 'يبرمج بلوك العيون', status: 'active', robot: 'Mini G-M' },
                { name: 'مصطفى حسين', progress: 'يحتاج توجيه في الكود', status: 'help', robot: 'Mini G-F' },
                { name: 'نور الهدى', progress: 'أكملت التحدي 3', status: 'done', robot: 'Mini G' },
                { name: 'يوسف عمر', progress: 'يختبر المحرك السيرفو', status: 'active', robot: 'Mini G-M' },
                { name: 'مريم فراس', progress: 'أكملت التحدي 2', status: 'done', robot: 'Mini G-F' },
              ].map((st, i) => (
                <div key={i} className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex flex-col justify-between gap-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">{st.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{st.robot}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    {st.status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                    {st.status === 'active' && <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                    {st.status === 'help' && <span className="text-red-400 font-bold">❓</span>}
                    <span>{st.progress}</span>
                  </div>
                  <button className="w-full text-center text-[10px] py-1 bg-slate-900 hover:bg-slate-750 text-indigo-300 rounded font-semibold transition">
                    عرض الكود المباشر 👁️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Curriculum View */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    {lesson.difficulty} • {lesson.model.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-amber-400 font-bold">+{lesson.xpReward} XP ⭐</span>
                    {lesson.id.startsWith('custom_') && (
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="حذف الدرس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-sm text-white">{lesson.titleAr}</h4>
                <p className="text-xs text-slate-400 mt-1">{lesson.descriptionAr}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 truncate max-w-[180px]">الهدف: {lesson.targetCriteria.descriptionAr}</span>
                <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1">
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>بدء</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creator View (New Challenge Builder for Teachers) */}
      {activeTab === 'creator' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">محرر التحديات والدروس الخاصة بالمدرب</h3>
          </div>

          <form onSubmit={handleCreateLesson} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الدرس / التحدي:</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="مثال: تحدي تفادي الحواجز بالمحاكي"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الروبوت المستهدف:</label>
                <select
                  value={newModel}
                  onChange={e => setNewModel(e.target.value as RobotModelType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="mini_gf">Mini G-F (ميدالية الليدات والهزاز)</option>
                  <option value="mini_gm">Mini G-M (رفيق المكتب والشاشة)</option>
                  <option value="mini_g">Mini G (الروبوت الكامل والذكاء الاصطناعي)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">مستوى الصعوبة:</label>
                <select
                  value={newDiff}
                  onChange={e => setNewDiff(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="مبتدئ">مبتدئ (100 XP)</option>
                  <option value="متوسط">متوسط (250 XP)</option>
                  <option value="بطل">بطل (500 XP)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">شرح التحدي للطلاب:</label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="اكتب توجيهات واضحة تشرح ما هو المطلوب من الطفل برمجته..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">معيار النجاح والتسليم:</label>
              <input
                type="text"
                value={newCriteria}
                onChange={e => setNewCriteria(e.target.value)}
                placeholder="مثال: تدوير الرأس 90 درجة مع إصدار نغمة الفرح"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-lg active:scale-95"
            >
              حفظ ونشر الدرس للفصل 🚀
            </button>
          </form>
        </div>
      )}

      {/* Student Badge Passes */}
      {activeTab === 'badges' && (
        <StudentBadgeCardsModal />
      )}

      {/* STEAM Challenge Flashcards */}
      {activeTab === 'flashcards' && (
        <PrintableFlashcardsModal />
      )}

      {/* Printable STEAM Worksheets */}
      {activeTab === 'worksheets' && (
        <PrintableActivitiesModal />
      )}

      {/* Classroom Safety Guard */}
      {activeTab === 'safety' && (
        <SafetyGuardModal />
      )}

      {/* Certificates Center */}
      {activeTab === 'certificates' && (
        <CertificateGeneratorModal />
      )}

      {/* Wiring Diagrams */}
      {activeTab === 'wiring' && (
        <WiringDiagramModal model={activeModel} />
      )}

      {/* Analytics View */}
      {activeTab === 'analytics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
          <h3 className="font-bold text-sm text-white">إحصائيات الإنجاز والتفكير المنطقي للطلاب</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl text-center">
              <div className="text-2xl font-black text-indigo-400">420+</div>
              <div className="text-xs text-slate-400 mt-1">كتلة برمجية تم تنفيذها اليوم</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl text-center">
              <div className="text-2xl font-black text-emerald-400">91%</div>
              <div className="text-xs text-slate-400 mt-1">نسبة النجاح في أول محاولة</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl text-center">
              <div className="text-2xl font-black text-amber-400">18</div>
              <div className="text-xs text-slate-400 mt-1">شهادة إنجاز جاهزة للطباعة</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
