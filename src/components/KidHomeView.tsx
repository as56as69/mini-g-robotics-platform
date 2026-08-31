import React, { useState, useEffect } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { BlocklyWorkspace } from '../blockly/BlocklyWorkspace';
import { RobotSimulator } from '../simulator/RobotSimulator';
import { RobotState } from '../types/robot';
import type { StudentProfile } from '../types/lms';
import type { LessonChallenge } from '../types/lms';
import { Flame, Star, Trophy, Sparkles, CheckCircle2, Code, Bot, Sliders, Zap, Rocket, LogOut, IdCard, Radio, Wifi, WifiOff } from 'lucide-react';
import confetti from 'canvas-confetti';

import { schoolApi } from '../services/schoolApi';
import { DirectControlPanel } from './DirectControlPanel';
import { AIPersonaChatModal } from './AIPersonaChatModal';
import { CodeExportModal } from './CodeExportModal';
import { QuestMapModal } from './QuestMapModal';
import { WebSerialConsole } from './WebSerialConsole';
import { LiveSensorTelemetry } from './LiveSensorTelemetry';
import { VoiceCommanderModal } from './VoiceCommanderModal';
import { PinoutConfigModal } from './PinoutConfigModal';
import { BattleArenaModal } from './BattleArenaModal';
import { ActionSequenceRecorder } from './ActionSequenceRecorder';
import { DevOnlyWrapper } from './DevOnlyWrapper';
import { PixelFaceDesignerModal } from './PixelFaceDesignerModal';
import { MelodyComposerModal } from './MelodyComposerModal';
import { TroubleshootingAssistantModal } from './TroubleshootingAssistantModal';
import { ESP32WebFlasherModal } from './ESP32WebFlasherModal';
import { CostumeCustomizerModal } from './CostumeCustomizerModal';
import { KidVisionAIStudioModal } from './KidVisionAIStudioModal';
import { InteractiveCircuitSimulatorModal } from './InteractiveCircuitSimulatorModal';
import { ParentAnalyticsDashboardModal } from './ParentAnalyticsDashboardModal';
import { Chassis3DStudioModal } from './Chassis3DStudioModal';
import { NeuralNetworkKidStudioModal } from './NeuralNetworkKidStudioModal';
import { CommunityShowcaseModal } from './CommunityShowcaseModal';
import { StudentLoginModal } from './StudentLoginModal';
import { SoundFXManager } from '../ble/SoundFX';

import { AICodeReviewerModal } from './AICodeReviewerModal';

// Heavy WebGL 3D scene is lazy-loaded only when needed
const Robot3DVisualizer = React.lazy(() => import('../simulator3d/Robot3DVisualizer'));

interface Props {
  activeModel: RobotModelType;
  state: RobotState;
}

export const KidHomeView: React.FC<Props> = ({ activeModel, state }) => {
  const modelInfo = ROBOT_MODELS[activeModel];
  const [view3D, setView3D] = useState(false);
  
  // Mobile Split View Switcher: 'code' or 'simulator' on small mobile screens
  const [mobileTab, setMobileTab] = useState<'code' | 'simulator'>('code');

  // ---- Shared student identity (section join code + MG login code) ----
  type KidSession = { student: StudentProfile; className: string; at: number };
  const loadKidSession = (): KidSession | null => {
    try {
      const raw = localStorage.getItem('mg_student_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as KidSession;
      if (parsed?.student?.id?.startsWith('local_')) return null; // offline journal entries are not real ids
      if (parsed?.student?.id) return parsed;
    } catch { /* noop */ }
    return null;
  };
  const [session, setSession] = useState<KidSession | null>(loadKidSession);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<LessonChallenge | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const [activeTabPanel, setActiveTabPanel] = useState<
    'remote' | 'quests' | 'neural_net' | 'showcase' | 'cad_3d' | 'vision_ai' | 
    'circuits' | 'parent_report' | 'wardrobe' | 'pixel_art' | 'melody' | 
    'flasher' | 'troubleshoot' | 'battle' | 'ai_tutor' | 'recorder' | 
    'telemetry' | 'voice' | 'export' | 'serial' | 'pins'
  >('remote');

  const triggerCelebration = () => {
    SoundFXManager.playVictory();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  const handleQuestSelect = (quest: LessonChallenge) => {
    setSelectedQuest(quest);
    triggerCelebration();
  };

  const handleLinked = (student: StudentProfile, className: string) => {
    setSession({ student, className, at: Date.now() });
    setShowLogin(false);
    triggerCelebration();
    notify(`أهلاً ${student.name.split(' ')[0]}! دخلتَ إلى سجلك المشترك 🎉`);
  };

  const logout = () => {
    try { localStorage.removeItem('mg_student_session'); } catch { /* noop */ }
    setSession(null);
    setSelectedQuest(null);
  };

  const submitChallenge = async () => {
    if (!session) {
      setShowLogin(true);
      notify('سجّل دخولك أولاً لتسليم التحدي 🎫');
      return;
    }
    if (!selectedQuest) {
      notify('اختر مرحلة من خريطة المغامرات أولاً 🗺️');
      return;
    }
    const { student } = session;
    if ((student.completedQuests || []).includes(selectedQuest.id)) {
      triggerCelebration();
      notify('أنجزتَ هذه المرحلة سابقاً — جرّب مرحلة جديدة 🏅');
      return;
    }
    const patch = {
      xp: student.xp + selectedQuest.xpReward,
      stars: student.stars + selectedQuest.starsCount,
      streakDays: (student.streakDays || 0) + 1,
      completedQuests: [...(student.completedQuests || []), selectedQuest.id],
      progress: selectedQuest.titleAr,
      status: 'done' as const,
      lastActivity: new Date().toISOString(),
    };
    try {
      const updated = await schoolApi.updateStudent(student.id, patch);
      setSession(prev => (prev ? { ...prev, student: updated } : prev));
      triggerCelebration();
      notify(`تسلّمت ${selectedQuest.xpReward} XP و${selectedQuest.starsCount} نجوم ⭐ Bravo!`);
    } catch {
      const optimistic = { ...student, ...patch };
      setSession(prev => (prev ? { ...prev, student: optimistic } : prev));
      triggerCelebration();
      notify('سُجّل محلياً — يُزامَن تلقائياً عند عودة الخادم ⏳');
    }
  };

  // Keep the kid's shared profile live (stars/XP may change from another device)
  const sessionId = session?.student.id;
  useEffect(() => {
    if (!sessionId || sessionId.startsWith('local_')) return;
    const timer = window.setInterval(async () => {
      try {
        const fresh = await schoolApi.getStudent(sessionId);
        setSession(prev => (prev ? { ...prev, student: fresh } : prev));
      } catch { /* offline — keep current view */ }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [sessionId]);

  return (
    <div className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 gap-3 sm:gap-4 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Gamification Streak & Activity Bar (Playful & Joyful) */}
      <div className="relative z-10 isolate bg-gradient-to-r from-kid-primary via-kid-accent/25 to-kid-primary border-2 border-kid-accent/70 rounded-3xl p-3.5 sm:p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl shadow-kid-accent/40 overflow-hidden">
        {/* Playful Floating Sparkles Accent */}
        <div className="absolute right-2 top-2 opacity-15 text-5xl pointer-events-none animate-spin">
          ✨
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-lg shadow-orange-500/30 flex-shrink-0 animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl">
              🚀
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-lg font-black text-white tracking-tight">{modelInfo.nameAr}</h2>
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-md">
                المستوى 3: بطل المستكشفين 🏆
              </span>
            </div>
            <p className="text-xs text-kid-accent/80 mt-0.5 hidden sm:block font-medium">{modelInfo.taglineAr}</p>
          </div>
        </div>

        {/* Counters & Submit Quest Trigger */}
        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          {session && session.student.streakDays > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600/30 to-kid-glow/25 px-3 py-1.5 rounded-2xl border border-kid-glow/50 text-orange-200 font-black text-xs shadow-md">
              <Flame className="w-4 h-4 fill-orange-400 animate-bounce" />
              <span>{session.student.streakDays} {session.student.streakDays === 1 ? 'يوم متتالٍ' : 'أيام متتالية'}! 🔥</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/30 to-orange-500/25 px-3 py-1.5 rounded-2xl border border-amber-400/60 text-amber-200 font-black text-xs shadow-md">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{session ? session.student.stars : 0} نجمة ⭐</span>
          </div>

          {session ? (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/15 px-3 py-1.5 rounded-2xl border border-emerald-400/50 text-emerald-200 font-black text-xs shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="max-w-[130px] truncate">{session.student.name}</span>
              <span className="text-emerald-300/80 font-mono text-[10px]">+{session.student.xp} XP</span>
              <button onClick={logout} title="خروج من الحساب" className="text-emerald-300 hover:text-white transition ml-0.5">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
            >
              <IdCard className="w-4 h-4" />
              دخول الطالب 🎫
            </button>
          )}

          <button
            onClick={() => void submitChallenge()}
            className="hero-glow flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-kid-glow via-orange-500 to-amber-500 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-kid-glow/50 transition transform active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>تسليم التحدي 🎁</span>
          </button>
        </div>
      </div>

      {/* Mobile Switcher Tab (Shown only on small screens < 1024px) */}
      <div className="lg:hidden flex items-center bg-slate-950 p-1 rounded-2xl border border-kid-primary/40 shadow-lg">
        <button
          onClick={() => setMobileTab('code')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'code' ? 'bg-gradient-to-r from-kid-primary to-kid-accent text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>مساحة الكود والبلوكات 💻</span>
        </button>
        <button
          onClick={() => setMobileTab('simulator')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'simulator' ? 'bg-gradient-to-r from-kid-accent to-kid-primary text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>المحاكي والتحكم 🤖</span>
        </button>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left / Code Area */}
        <div className={`lg:col-span-7 flex flex-col gap-3 sm:gap-4 ${mobileTab === 'simulator' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="w-full">
            <BlocklyWorkspace model={activeModel} onCodeRun={triggerCelebration} />
          </div>

          {/* Playful & Joyful Feature Navigation Bar */}
          <div className="flex items-center bg-slate-950/90 p-1.5 rounded-2xl border border-kid-primary/40 overflow-x-auto gap-1.5 text-xs shadow-lg scrollbar-none">
            <button
              onClick={() => setActiveTabPanel('remote')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'remote' ? 'bg-gradient-to-r from-kid-primary to-kid-accent text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎮 ريموت
            </button>
            <button
              onClick={() => setActiveTabPanel('quests')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'quests' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🗺️ مراحل
            </button>
            <button
              onClick={() => setActiveTabPanel('neural_net')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'neural_net' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🧠 شبكات عصبية
            </button>
            <button
              onClick={() => setActiveTabPanel('showcase')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'showcase' ? 'bg-amber-400 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌟 المعرض
            </button>
            <button
              onClick={() => setActiveTabPanel('cad_3d')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'cad_3d' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🧊 تصميم 3D
            </button>
            <button
              onClick={() => setActiveTabPanel('vision_ai')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'vision_ai' ? 'bg-cyan-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👁️ ذكاء الرؤية
            </button>
            <button
              onClick={() => setActiveTabPanel('circuits')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'circuits' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ الدوائر
            </button>
            <button
              onClick={() => setActiveTabPanel('parent_report')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'parent_report' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👨‍👩‍👧 ولي الأمر
            </button>
            <button
              onClick={() => setActiveTabPanel('wardrobe')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'wardrobe' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👗 الأزياء
            </button>
            <button
              onClick={() => setActiveTabPanel('pixel_art')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'pixel_art' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎨 الوجوه
            </button>
            <button
              onClick={() => setActiveTabPanel('melody')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'melody' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎵 النغمات
            </button>
            <button
              onClick={() => setActiveTabPanel('flasher')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'flasher' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ حرق ESP32
            </button>
            <button
              onClick={() => setActiveTabPanel('troubleshoot')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'troubleshoot' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔧 الأعطال
            </button>
            <button
              onClick={() => setActiveTabPanel('ai_tutor')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'ai_tutor' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🧠 المعلم الذكي
            </button>
            <button
              onClick={() => setActiveTabPanel('battle')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'battle' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚔️ المسابقات
            </button>
            <button
              onClick={() => setActiveTabPanel('recorder')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'recorder' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎬 المسجل
            </button>
            <button
              onClick={() => setActiveTabPanel('telemetry')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'telemetry' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 الحساسات
            </button>
            <button
              onClick={() => setActiveTabPanel('voice')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'voice' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎙️ صوتي
            </button>
            <button
              onClick={() => setActiveTabPanel('export')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'export' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💾 كود C++
            </button>
            <button
              onClick={() => setActiveTabPanel('serial')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'serial' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ USB
            </button>
            <button
              onClick={() => setActiveTabPanel('pins')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'pins' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚙️ المنافذ
            </button>
          </div>

          {/* Dynamic Feature Sub-Modals */}
          {activeTabPanel === 'remote' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DirectControlPanel model={activeModel} state={state} />
              {activeModel === 'mini_g' ? (
                <AIPersonaChatModal activePersona={state.g_activePersona} />
              ) : (
                <LiveRobotStatusCard state={state} />
              )}
            </div>
          )}

          {activeTabPanel === 'quests' && (
            <QuestMapModal model={activeModel} onSelectQuest={handleQuestSelect} />
          )}

          {activeTabPanel === 'neural_net' && (
            <DevOnlyWrapper label="الشبكات العصبية">
              <NeuralNetworkKidStudioModal model={activeModel} />
            </DevOnlyWrapper>
          )}

          {activeTabPanel === 'showcase' && (
            <CommunityShowcaseModal />
          )}

          {activeTabPanel === 'cad_3d' && (
            <DevOnlyWrapper label="تصميم الثري دي (3D CAD)">
              <Chassis3DStudioModal model={activeModel} />
            </DevOnlyWrapper>
          )}

          {activeTabPanel === 'vision_ai' && (
            <DevOnlyWrapper label="الرؤية الحاسوبية">
              <KidVisionAIStudioModal model={activeModel} />
            </DevOnlyWrapper>
          )}

          {activeTabPanel === 'circuits' && (
            <InteractiveCircuitSimulatorModal model={activeModel} />
          )}

          {activeTabPanel === 'parent_report' && (
            <DevOnlyWrapper label="تقرير ولي الأمر">
              <ParentAnalyticsDashboardModal />
            </DevOnlyWrapper>
          )}

          {activeTabPanel === 'wardrobe' && (
            <DevOnlyWrapper label="الأزياء وتخصيص الروبوت">
              <CostumeCustomizerModal model={activeModel} />
            </DevOnlyWrapper>
          )}

          {activeTabPanel === 'pixel_art' && (
            <PixelFaceDesignerModal model={activeModel} />
          )}

          {activeTabPanel === 'melody' && (
            <MelodyComposerModal model={activeModel} />
          )}

          {activeTabPanel === 'flasher' && (
            <ESP32WebFlasherModal model={activeModel} />
          )}

          {activeTabPanel === 'troubleshoot' && (
            <TroubleshootingAssistantModal model={activeModel} />
          )}

          {activeTabPanel === 'ai_tutor' && (
            <DevOnlyWrapper label="المعلم الذكي">
              <AICodeReviewerModal />
            </DevOnlyWrapper>
          )}

          {activeTabPanel === 'battle' && (
            <BattleArenaModal model={activeModel} />
          )}

          {activeTabPanel === 'recorder' && (
            <DevOnlyWrapper label="المسجل">
              <ActionSequenceRecorder model={activeModel} />
            </DevOnlyWrapper>
          )}

          {activeTabPanel === 'telemetry' && (
            <DevOnlyWrapper label="الحساسات (Telemetry)">
              <LiveSensorTelemetry model={activeModel} state={state} />
            </DevOnlyWrapper>
          )}

          {activeTabPanel === 'voice' && (
            <VoiceCommanderModal model={activeModel} />
          )}

          {activeTabPanel === 'pins' && (
            <PinoutConfigModal model={activeModel} />
          )}

          {activeTabPanel === 'export' && (
            <CodeExportModal model={activeModel} />
          )}

          {activeTabPanel === 'serial' && (
            <WebSerialConsole />
          )}
        </div>

        {/* Right / Simulator Area */}
        <div className={`lg:col-span-5 flex flex-col gap-3 sticky top-4 ${mobileTab === 'code' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 shadow-md">
            <span className="text-xs font-bold text-slate-300">نمط المحاكاة والتفاعل:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setView3D(false)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  !view3D ? 'bg-gradient-to-r from-kid-primary to-kid-accent text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                2D الحلبة
              </button>
              <button
                onClick={() => setView3D(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  view3D ? 'bg-gradient-to-r from-kid-accent to-kid-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                3D مجسم 🧊
              </button>
            </div>
          </div>

          <div className="w-full h-[380px] sm:h-[450px] rounded-2xl overflow-hidden">
            {view3D ? (
              <React.Suspense
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 animate-pulse" />
                    <span className="text-xs text-slate-400 font-bold">تحميل محرك المجسم ثلاثي الأبعاد... 🧊</span>
                  </div>
                }
              >
                <Robot3DVisualizer state={state} />
              </React.Suspense>
            ) : (
              <RobotSimulator state={state} />
            )}
          </div>

          {/* Model Quick Info Card */}
          <div className="bg-slate-900/80 backdrop-blur rounded-3xl p-3.5 border border-kid-primary/40 text-xs shadow-lg">
            <div className="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-kid-yellow animate-pulse" />
              <span>ميزات هذا الإصدار في الكود:</span>
            </div>
            <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
              {modelInfo.featuresAr.map((f, idx) => (
                <li key={idx} className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showLogin && (
        <StudentLoginModal
          onLinked={handleLinked}
          onClose={() => setShowLogin(false)}
        />
      )}

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[130] bg-slate-950/95 border border-kid-glow/50 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-2xl shadow-kid-glow/20 backdrop-blur whitespace-nowrap max-w-[92vw] text-center">
          {toast}
        </div>
      )}
    </div>
  );
};

/** Live robot status card replacing the old static "التحكم المباشر نشط" note. */
const LiveRobotStatusCard: React.FC<{ state: RobotState }> = ({ state }) => {
  // Re-render periodically so the broadcast indicator lights up for ~1.5s after each command
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!state.lastCommandAt) return;
    const t = window.setInterval(() => forceTick(prev => prev + 1), 600);
    return () => window.clearInterval(t);
  }, [state.lastCommandAt]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
      {/* Connection status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {state.connected ? (
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-200 truncate">
              {state.connected ? (state.deviceName || 'روبوت متصل') : 'وضع المعاينة الافتراضية'}
            </p>
            <p className="text-[10px] text-slate-500">
              {state.connected ? 'جهاز حقيقي مرتبط عبر Web Bluetooth' : 'المحاكي فقط — اربط الروبوت من الهيدر'}
            </p>
          </div>
        </div>
        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${state.connected ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/15 text-amber-300 border-amber-500/40'}`}>
          {state.connected ? 'LIVE 🟢' : 'PREVIEW 🟡'}
        </span>
      </div>

      {/* Broadcast indicator + last command */}
      <div className="flex items-center justify-between bg-slate-900/70 rounded-xl px-3 py-2 border border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <Radio
            className={`w-4 h-4 shrink-0 ${state.lastCommandAt && Date.now() - state.lastCommandAt < 1500 ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-500 font-bold">مؤشر البث:</span>
            <span className="text-[11px] font-bold text-slate-200 truncate">
              {state.lastCommand || 'لم يُرسل أمر بعد'}
            </span>
          </div>
        </div>
        <span className="text-[9px] font-mono text-slate-600 shrink-0">
          {state.lastCommandAt ? new Date(state.lastCommandAt).toLocaleTimeString('ar-EG') : '—'}
        </span>
      </div>

      {/* Model-specific live state readout */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {state.model === 'mini_gf' && (
          <>
            <div className="bg-slate-900 rounded-lg px-2.5 py-1.5 border border-slate-800 flex items-center gap-1.5">
              <span>الليد:</span>
              <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: state.gf_ledColor }} />
              <span className="font-mono" dir="ltr">{state.gf_ledColor}</span>
            </div>
            <div className="bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
              الهزاز: <span className={state.gf_vibrating ? 'text-pink-400 font-bold animate-pulse' : 'text-slate-400'}>{state.gf_vibrating ? 'يعمل 💓' : 'متوقف'}</span>
            </div>
          </>
        )}
        {state.model === 'mini_gm' && (
          <div className="bg-slate-900/70 rounded-lg px-2.5 py-1.5 border border-slate-800 col-span-2 flex items-center gap-2">
            <span>التعبير: <b className="text-cyan-300">{state.gm_expression}</b></span>
            <span className="text-slate-600">•</span>
            <span>الرأس: <b className="text-slate-300">{state.gm_headAngle}°</b></span>
          </div>
        )}
        {state.model === 'mini_g' && (
          <div className="bg-slate-900/70 rounded-lg px-2.5 py-1.5 border border-slate-800 col-span-2 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>الشخصية: <b className="text-purple-300">{state.g_activePersona}</b> • العجلات: {state.g_wheelSpeedL}/{state.g_wheelSpeedR}</span>
          </div>
        )}
      </div>
    </div>
  );
};
