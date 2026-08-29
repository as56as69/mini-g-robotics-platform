import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { BlocklyWorkspace } from '../blockly/BlocklyWorkspace';
import { RobotSimulator } from '../simulator/RobotSimulator';
import { RobotState } from '../types/robot';
import { Flame, Star, Trophy, Sparkles, CheckCircle2, Code, Bot, Sliders, Zap, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';

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

  return (
    <div className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 gap-3 sm:gap-4 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Gamification Streak & Activity Bar (Playful & Joyful) */}
      <div className="relative z-10 isolate bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-purple-950/70 border-2 border-purple-500/40 rounded-3xl p-3.5 sm:p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl shadow-purple-950/40 overflow-hidden">
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
            <p className="text-xs text-purple-200/80 mt-0.5 hidden sm:block font-medium">{modelInfo.taglineAr}</p>
          </div>
        </div>

        {/* Counters & Submit Quest Trigger */}
        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-2xl border border-orange-500/40 text-orange-400 font-black text-xs shadow-md">
            <Flame className="w-4 h-4 fill-orange-500 animate-bounce" />
            <span>حماس 5 أيام متتالية! 🔥</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-2xl border border-amber-500/40 text-amber-300 font-black text-xs shadow-md">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>240 نجمة ⭐</span>
          </div>

          <button
            onClick={triggerCelebration}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-pink-500/30 transition transform active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>تسليم التحدي 🎁</span>
          </button>
        </div>
      </div>

      {/* Mobile Switcher Tab (Shown only on small screens < 1024px) */}
      <div className="lg:hidden flex items-center bg-slate-950 p-1 rounded-2xl border border-purple-900/40 shadow-lg">
        <button
          onClick={() => setMobileTab('code')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'code' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>مساحة الكود والبلوكات 💻</span>
        </button>
        <button
          onClick={() => setMobileTab('simulator')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'simulator' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-slate-400'
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
          <div className="flex items-center bg-slate-950/90 p-1.5 rounded-2xl border border-purple-900/40 overflow-x-auto gap-1.5 text-xs shadow-lg scrollbar-none">
            <button
              onClick={() => setActiveTabPanel('remote')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeTabPanel === 'remote' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
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
              <DirectControlPanel model={activeModel} />
              {activeModel === 'mini_g' ? (
                <AIPersonaChatModal activePersona={state.g_activePersona} />
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center text-center text-slate-400 text-xs shadow-lg">
                  <Sparkles className="w-8 h-8 text-indigo-400 mb-2 animate-bounce" />
                  <p className="font-bold text-slate-200">التحكم المباشر نشط</p>
                  <p className="text-[11px] mt-1">يتم إرسال كافة الأوامر عبر Web Bluetooth للروبوت الحقيقي والمحاكي في نفس الوقت!</p>
                </div>
              )}
            </div>
          )}

          {activeTabPanel === 'quests' && (
            <QuestMapModal model={activeModel} onSelectQuest={triggerCelebration} />
          )}

          {activeTabPanel === 'neural_net' && (
            <NeuralNetworkKidStudioModal model={activeModel} />
          )}

          {activeTabPanel === 'showcase' && (
            <CommunityShowcaseModal />
          )}

          {activeTabPanel === 'cad_3d' && (
            <Chassis3DStudioModal model={activeModel} />
          )}

          {activeTabPanel === 'vision_ai' && (
            <KidVisionAIStudioModal model={activeModel} />
          )}

          {activeTabPanel === 'circuits' && (
            <InteractiveCircuitSimulatorModal model={activeModel} />
          )}

          {activeTabPanel === 'parent_report' && (
            <ParentAnalyticsDashboardModal />
          )}

          {activeTabPanel === 'wardrobe' && (
            <CostumeCustomizerModal model={activeModel} />
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
            <AICodeReviewerModal />
          )}

          {activeTabPanel === 'battle' && (
            <BattleArenaModal model={activeModel} />
          )}

          {activeTabPanel === 'recorder' && (
            <ActionSequenceRecorder model={activeModel} />
          )}

          {activeTabPanel === 'telemetry' && (
            <LiveSensorTelemetry model={activeModel} state={state} />
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
                  !view3D ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                2D الحلبة
              </button>
              <button
                onClick={() => setView3D(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  view3D ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'
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
          <div className="bg-slate-900/80 backdrop-blur rounded-3xl p-3.5 border border-purple-900/30 text-xs shadow-lg">
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
    </div>
  );
};
