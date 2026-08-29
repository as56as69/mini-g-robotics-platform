import React, { useState } from 'react';
import { RobotModelType } from '../types/robot';
import { LessonChallenge } from '../types/lms';
import { MapPin, Star, Lock, Play, CheckCircle2, Award, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  model: RobotModelType;
  onSelectQuest: (quest: LessonChallenge) => void;
}

const QUEST_STAGES: Record<RobotModelType, LessonChallenge[]> = {
  mini_gf: [
    {
      id: 'gf_q1',
      titleAr: 'مرحلة 1: منارة النجوم',
      descriptionAr: 'برمج الميدالية لتضيء باللون الأخضر عند البداية لتعلن انطلاق المغامرة!',
      model: 'mini_gf',
      difficulty: 'مبتدئ',
      xpReward: 50,
      starsCount: 3,
      targetCriteria: { descriptionAr: 'تلوين الليد باللون الأخضر', targetEvent: 'SET_COLOR' }
    },
    {
      id: 'gf_q2',
      titleAr: 'مرحلة 2: لغة النبضات',
      descriptionAr: 'اجعل الميدالية تهتز بنبضتين متتاليتين للتعبير عن نبضات الفرح.',
      model: 'mini_gf',
      difficulty: 'مبتدئ',
      xpReward: 80,
      starsCount: 3,
      targetCriteria: { descriptionAr: 'تفعيل الهزاز بنبضتين', targetEvent: 'VIBRATE_PULSE' }
    },
    {
      id: 'gf_q3',
      titleAr: 'مرحلة 3: حارس الأسرار',
      descriptionAr: 'برمج رد فعل الروبوت: إذا لمس شخص رأس الميدالية، اجعلها تضيء أحمر وتهتز!',
      model: 'mini_gf',
      difficulty: 'متوسط',
      xpReward: 120,
      starsCount: 3,
      targetCriteria: { descriptionAr: 'ربط حدث اللمس مع اللون والهزاز', targetEvent: 'TOUCH_TRIGGER' }
    }
  ],
  mini_gm: [
    {
      id: 'gm_q1',
      titleAr: 'مرحلة 1: عيون السعادة',
      descriptionAr: 'اجعل شاشة رفيق المكتب تبتسم بنظرة فرح وتغمز عند تحيتك.',
      model: 'mini_gm',
      difficulty: 'مبتدئ',
      xpReward: 100,
      starsCount: 3,
      targetCriteria: { descriptionAr: 'تغيير شكل عيون الشاشة لسعيدة', targetEvent: 'SET_EXPR' }
    },
    {
      id: 'gm_q2',
      titleAr: 'مرحلة 2: إيماءة الترحيب',
      descriptionAr: 'قم بتدوير رأس الروبوت لليمين ثم لليسار ليتفقد غرفتك وكتبك.',
      model: 'mini_gm',
      difficulty: 'متوسط',
      xpReward: 150,
      starsCount: 3,
      targetCriteria: { descriptionAr: 'تحريك السيرفو لليمين واليسار', targetEvent: 'ROTATE_HEAD' }
    },
    {
      id: 'gm_q3',
      titleAr: 'مرحلة 3: رفيق المذاكرة',
      descriptionAr: 'برمج نغمة موسيقية تعزف بعد 20 دقيقة لتذكرك باستراحة قصيرة.',
      model: 'mini_gm',
      difficulty: 'بطل',
      xpReward: 200,
      starsCount: 3,
      targetCriteria: { descriptionAr: 'تشغيل النغمة التعبيرية', targetEvent: 'PLAY_TONE' }
    }
  ],
  mini_g: [
    {
      id: 'g_q1',
      titleAr: 'مرحلة 1: الانطلاق في الفصل',
      descriptionAr: 'قُد روبوت ميني جي للتحرك للأمام والالتفاف حول الطاولة.',
      model: 'mini_g',
      difficulty: 'مبتدئ',
      xpReward: 150,
      starsCount: 3,
      targetCriteria: { descriptionAr: 'قيادة العجلات للأمام والدوران', targetEvent: 'DRIVE_WHEELS' }
    },
    {
      id: 'g_q2',
      titleAr: 'مرحلة 2: لغة الإشارة والترحيب',
      descriptionAr: 'ارفع الذراعين ولوّح للطلاب والمدرب ترحيباً بالحصة.',
      model: 'mini_g',
      difficulty: 'متوسط',
      xpReward: 250,
      starsCount: 3,
      targetCriteria: { descriptionAr: 'رفع الذراعين 90 درجة', targetEvent: 'MOVE_ARMS' }
    },
    {
      id: 'g_q3',
      titleAr: 'مرحلة 3: حكمة الخوارزمي بالـ AI',
      descriptionAr: 'فعّل شخصية الخوارزمي واجعله يلقي نصيحة علمية للأطفال.',
      model: 'mini_g',
      difficulty: 'بطل',
      xpReward: 400,
      starsCount: 3,
      targetCriteria: { descriptionAr: 'ربط شخصية AI والنطق الذكي', targetEvent: 'AI_PERSONA' }
    }
  ]
};

export const QuestMapModal: React.FC<Props> = ({ model, onSelectQuest }) => {
  const quests = QUEST_STAGES[model] || QUEST_STAGES['mini_gf'];
  const [completedIds, setCompletedIds] = useState<string[]>([quests[0].id]);

  const handleQuestClick = (quest: LessonChallenge, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    onSelectQuest(quest);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">
            خريطة مغامرات المراحل (Quest World Map)
          </span>
        </div>
        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
          3 مراحل متاحة 🗺️
        </span>
      </div>

      {/* Quests Track */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quests.map((q, index) => {
          const isDone = completedIds.includes(q.id);
          const isUnlocked = index === 0 || completedIds.includes(quests[index - 1].id);

          return (
            <div
              key={q.id}
              onClick={() => handleQuestClick(q, isUnlocked)}
              className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition cursor-pointer ${
                isDone
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-900/20 shadow-md'
                  : isUnlocked
                  ? 'bg-slate-800/80 border-indigo-500/60 hover:bg-slate-750 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300">
                  المرحلة {index + 1}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isUnlocked ? (
                  <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>

              <div>
                <h4 className="font-bold text-xs text-white">{q.titleAr}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{q.descriptionAr}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  +{q.xpReward} XP
                </span>
                <span className="text-slate-400">{q.difficulty}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
