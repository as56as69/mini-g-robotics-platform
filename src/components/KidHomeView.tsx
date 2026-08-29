import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { BlocklyWorkspace } from '../blockly/BlocklyWorkspace';
import { RobotSimulator } from '../simulator/RobotSimulator';
import { RobotState } from '../types/robot';
import { Flame, Star, Trophy, Sparkles, CheckCircle2, Code, Bot, Sliders } from 'lucide-react';
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

import { Robot3DVisualizer } from '../simulator/Robot3DVisualizer';
import { AICodeReviewerModal } from './AICodeReviewerModal';

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
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 gap-3 sm:gap-4 overflow-y-auto">
      {/* Gamification Streak & Activity Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4 shadow-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl sm:text-2xl shadow-inner flex-shrink-0">
            🌟
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-base font-black text-white">{modelInfo.nameAr}</h2>
              <span className="bg-amber-500/20 text-amber-300 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-500/30">
                المستوى 3 🏆
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">{modelInfo.taglineAr}</p>
          </div>
        </div>

        {/* Counters & Submit Quest Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 px-2 sm:px-3 py-1 rounded-xl border border-orange-500/30 text-orange-400 font-black text-[11px] sm:text-xs shadow">
            <Flame className="w-3.5 h-3.5 fill-orange-500 animate-bounce" />
            <span>5 أيام! 🔥</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2 sm:px-3 py-1 rounded-xl border border-amber-500/30 text-amber-300 font-black text-[11px] sm:text-xs shadow">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>240 ⭐</span>
          </div>

          <button
            onClick={triggerCelebration}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-kid-pink to-purple-600 hover:from-kid-pink/90 hover:to-purple-500 text-white font-black text-[11px] sm:text-xs shadow-md transition transform active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>تسليم 🎁</span>
          </button>
        </div>
      </div>

      {/* Mobile Switcher Tab (Shown only on small screens < 1024px) */}
      <div className="lg:hidden flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-md">
        <button
          onClick={() => setMobileTab('code')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'code' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>مساحة الكود والبلوكات 💻</span>
        </button>
        <button
          onClick={() => setMobileTab('simulator')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'simulator' ? 'bg-purple-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>المحاكي والتحكم 🤖</span>
        </button>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left / Code Area (Visible on Desktop OR when MobileTab === 'code') */}
        <div className={`lg:col-span-7 flex flex-col gap-3 sm:gap-4 ${mobileTab === 'simulator' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="w-full">
            <BlocklyWorkspace model={activeModel} onCodeRun={triggerCelebration} />
          </div>

          {/* Feature Navigation Bar (Scrollable on Mobile) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto gap-1 text-[11px] sm:text-xs scrollbar-none">
            <button
              onClick={() => setActiveTabPanel('remote')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'remote' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎮 ريموت
            </button>
            <button
              onClick={() => setActiveTabPanel('quests')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'quests' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🗺️ مراحل
            </button>
            <button
              onClick={() => setActiveTabPanel('neural_net')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'neural_net' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🧠 شبكات عصبية
            </button>
            <button
              onClick={() => setActiveTabPanel('showcase')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'showcase' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌟 المعرض
            </button>
            <button
              onClick={() => setActiveTabPanel('cad_3d')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'cad_3d' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🧊 تصميم 3D
            </button>
            <button
              onClick={() => setActiveTabPanel('vision_ai')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'vision_ai' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👁️ ذكاء الرؤية
            </button>
            <button
              onClick={() => setActiveTabPanel('circuits')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'circuits' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ الدوائر
            </button>
            <button
              onClick={() => setActiveTabPanel('parent_report')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'parent_report' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👨‍👩‍👧 ولي الأمر
            </button>
            <button
              onClick={() => setActiveTabPanel('wardrobe')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'wardrobe' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👗 الأزياء
            </button>
            <button
              onClick={() => setActiveTabPanel('pixel_art')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'pixel_art' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎨 الوجوه
            </button>
            <button
              onClick={() => setActiveTabPanel('melody')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'melody' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎵 النغمات
            </button>
            <button
              onClick={() => setActiveTabPanel('flasher')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'flasher' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ حرق ESP32
            </button>
            <button
              onClick={() => setActiveTabPanel('troubleshoot')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'troubleshoot' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔧 الأعطال
            </button>
            <button
              onClick={() => setActiveTabPanel('ai_tutor')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'ai_tutor' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🧠 المعلم الذكي
            </button>
            <button
              onClick={() => setActiveTabPanel('battle')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'battle' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚔️ المسابقات
            </button>
            <button
              onClick={() => setActiveTabPanel('recorder')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'recorder' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎬 المسجل
            </button>
            <button
              onClick={() => setActiveTabPanel('telemetry')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'telemetry' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 الحساسات
            </button>
            <button
              onClick={() => setActiveTabPanel('voice')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'voice' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎙️ صوتي
            </button>
            <button
              onClick={() => setActiveTabPanel('export')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'export' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💾 كود C++
            </button>
            <button
              onClick={() => setActiveTabPanel('serial')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'serial' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ USB
            </button>
            <button
              onClick={() => setActiveTabPanel('pins')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                activeTabPanel === 'pins' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center text-center text-slate-400 text-xs">
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

        {/* Right / Simulator Area (Visible on Desktop OR when MobileTab === 'simulator') */}
        <div className={`lg:col-span-5 flex flex-col gap-3 sticky top-4 ${mobileTab === 'code' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">نمط المحاكاة:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setView3D(false)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  !view3D ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2D الحلبة
              </button>
              <button
                onClick={() => setView3D(true)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  view3D ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                3D مجسم 🧊
              </button>
            </div>
          </div>

          <div className="w-full h-[380px] sm:h-[450px]">
            {view3D ? (
              <Robot3DVisualizer state={state} />
            ) : (
              <RobotSimulator state={state} />
            )}
          </div>

          {/* Model Quick Info Card */}
          <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-3 border border-slate-700 text-xs shadow-md">
            <div className="font-bold text-slate-200 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-kid-cyan" />
              <span>ميزات هذا الإصدار في الكود:</span>
            </div>
            <ul className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
              {modelInfo.featuresAr.map((f, idx) => (
                <li key={idx} className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
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
