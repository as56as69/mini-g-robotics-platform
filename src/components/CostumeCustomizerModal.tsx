import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Award, Star, Shirt, Sparkles, Check, Lock, Shield, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  model: RobotModelType;
}

interface CostumeItem {
  id: string;
  name: string;
  icon: string;
  type: 'hat' | 'glasses' | 'badge' | 'skin';
  requiredLevel: number;
  unlocked: boolean;
  equipped: boolean;
}

const INITIAL_COSTUMES: CostumeItem[] = [
  { id: 'c1', name: 'قبعة التخرج الذكية 🎓', icon: '🎓', type: 'hat', requiredLevel: 1, unlocked: true, equipped: true },
  { id: 'c2', name: 'نظارة البطل المستكشف 🕶️', icon: '🕶️', type: 'glasses', requiredLevel: 2, unlocked: true, equipped: false },
  { id: 'c3', name: 'خوذة رائد الفضاء 🚀', icon: '🚀', type: 'hat', requiredLevel: 3, unlocked: true, equipped: false },
  { id: 'c4', name: 'وسام عبقري الخوارزميات 🏅', icon: '🏅', type: 'badge', requiredLevel: 4, unlocked: false, equipped: false },
  { id: 'c5', name: 'تاج الملك البرمجي 👑', icon: '👑', type: 'hat', requiredLevel: 5, unlocked: false, equipped: false },
  { id: 'c6', name: 'درع الحماية السيبرانية 🛡️', icon: '🛡️', type: 'skin', requiredLevel: 6, unlocked: false, equipped: false },
];

export const CostumeCustomizerModal: React.FC<Props> = ({ model }) => {
  const modelInfo = ROBOT_MODELS[model];
  const [costumes, setCostumes] = useState<CostumeItem[]>(INITIAL_COSTUMES);
  const [activeSkinColor, setActiveSkinColor] = useState('#38bdf8');

  const toggleEquip = (id: string) => {
    SoundFXManager.playClickBeep();
    setCostumes(prev =>
      prev.map(c => {
        if (c.id === id) {
          if (!c.unlocked) return c;
          return { ...c, equipped: !c.equipped };
        }
        return c;
      })
    );
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shirt className="w-5 h-5 text-pink-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              خزانة وتخصيص أزياء الروبوت الافتراضي (Avatar Wardrobe & Accessories)
            </h3>
            <p className="text-[11px] text-slate-400">خصص مظهر روبوتك بالأزياء والقطع المميزة التي تفتحها بحل التحديات</p>
          </div>
        </div>

        <span className="text-xs bg-pink-500/20 text-pink-300 font-bold px-2.5 py-0.5 rounded-full border border-pink-500/30">
          المستوى 3 (مستكشف نشط 🌟)
        </span>
      </div>

      {/* Robot Skin Color Picker */}
      <div className="flex flex-col gap-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-kid-yellow" />
          <span>لون طلاء الهيكل الخارجي (Robot Skin Theme):</span>
        </span>
        <div className="flex items-center gap-2 pt-1">
          {['#38bdf8', '#a855f7', '#ec4899', '#22c55e', '#f59e0b', '#ef4444', '#ffffff'].map(col => (
            <button
              key={col}
              onClick={() => {
                SoundFXManager.playClickBeep();
                setActiveSkinColor(col);
              }}
              style={{ backgroundColor: col }}
              className={`w-7 h-7 rounded-full border-2 transition transform active:scale-95 ${
                activeSkinColor === col ? 'border-white scale-110 shadow-md shadow-white/30' : 'border-slate-700 hover:scale-105'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Costumes & Accessories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {costumes.map(item => (
          <div
            key={item.id}
            onClick={() => toggleEquip(item.id)}
            className={`p-3 rounded-2xl border flex flex-col justify-between gap-2 transition cursor-pointer relative overflow-hidden ${
              item.equipped
                ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-900/30'
                : item.unlocked
                ? 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                : 'bg-slate-950/40 border-slate-850 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{item.icon}</span>
              {item.equipped ? (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Check className="w-3 h-3" />
                  <span>مُرتدى</span>
                </span>
              ) : item.unlocked ? (
                <span className="text-[10px] text-purple-400 font-bold">متاح</span>
              ) : (
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  <Lock className="w-3 h-3" />
                  <span>المستوى {item.requiredLevel}</span>
                </span>
              )}
            </div>

            <div>
              <h4 className="font-bold text-xs text-white">{item.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">إكسسوار للشخصية</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
