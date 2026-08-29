import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Sparkles, Heart, Share2, Play, User, Download, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundFXManager } from '../ble/SoundFX';

interface ShowcaseProject {
  id: string;
  title: string;
  author: string;
  avatar: string;
  robot: RobotModelType;
  likes: number;
  description: string;
  tags: string[];
}

const COMMUNITY_PROJECTS: ShowcaseProject[] = [
  {
    id: 'p1',
    title: 'روبوت الحارس الليلي بالعيون الحمراء 🌙',
    author: 'أحمد مصطفى (9 سنوات)',
    avatar: '🦁',
    robot: 'mini_gf',
    likes: 42,
    description: 'إذا اقترب شخص من مكتبي في الظلام، يضيء الروبوت باللون الأحمر ويهتز بقوة لإيقاظي!',
    tags: ['حساس اللمس', 'أمان', 'Mini G-F']
  },
  {
    id: 'p2',
    title: 'رفيق المذاكرة بنظام بومودورو ⏱️',
    author: 'زينب حيدر (10 سنوات)',
    avatar: '🌸',
    robot: 'mini_gm',
    likes: 58,
    description: 'يساعدني على التركيز 25 دقيقة بعيون هادئة، ثم يدير رأسه ويعزف لحن الفرح لبدء الاستراحة.',
    tags: ['موسيقى', 'سيرفو الرأس', 'دراسة']
  },
  {
    id: 'p3',
    title: 'مساعد المعلم الذكي مع الخوارزمي 📜',
    author: 'مصطفى علي (11 سنة)',
    avatar: '🚀',
    robot: 'mini_g',
    likes: 89,
    description: 'يرحب بالطلاب عند مدخل الفصل، يرفع يديه ويلقي نصيحة رياضية بصوت العالم الخوارزمي.',
    tags: ['ذكاء اصطناعي', 'حركة عجلات', 'AI Voice']
  }
];

export const CommunityShowcaseModal: React.FC = () => {
  const [projects, setProjects] = useState<ShowcaseProject[]>(COMMUNITY_PROJECTS);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  const toggleLike = (id: string) => {
    SoundFXManager.playClickBeep();
    setProjects(prev =>
      prev.map(p => {
        if (p.id === id) {
          const isLiked = likedIds.includes(id);
          return { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 };
        }
        return p;
      })
    );

    if (likedIds.includes(id)) {
      setLikedIds(prev => prev.filter(x => x !== id));
    } else {
      setLikedIds(prev => [...prev, id]);
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-kid-yellow" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              معرض إبداعات مجتمع الأبطال الصغار (Mini G Creators Showcase)
            </h3>
            <p className="text-[11px] text-slate-400">استلهم الأفكار البرمجية وشارك مشاريع روبوتك مع الطلاب والمدربين حول العالم</p>
          </div>
        </div>

        <button
          onClick={() => {
            SoundFXManager.playVictory();
            confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs transition shadow active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>+ انشر مشروعي للمعرض 🌟</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {projects.map(proj => {
          const isLiked = likedIds.includes(proj.id);
          const modelInfo = ROBOT_MODELS[proj.robot];

          return (
            <div
              key={proj.id}
              className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3 shadow-lg hover:border-slate-700 transition"
            >
              {/* Author Strip */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{proj.avatar}</span>
                  <div>
                    <h5 className="font-bold text-xs text-slate-200">{proj.author}</h5>
                    <span className="text-[10px] text-indigo-400 font-mono">{modelInfo.name}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleLike(proj.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition ${
                    isLiked ? 'bg-pink-600/20 text-pink-400 border border-pink-500/40' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-pink-500' : ''}`} />
                  <span>{proj.likes}</span>
                </button>
              </div>

              {/* Title & Desc */}
              <div>
                <h4 className="font-bold text-xs text-white leading-snug">{proj.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              {/* Tags & Action */}
              <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {proj.tags.map((t, idx) => (
                    <span key={idx} className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    SoundFXManager.playRobotChirp();
                    alert(`تم تحميل وبرمجة مشروع: "${proj.title}" في مساحة العمل بنجاح!`);
                  }}
                  className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition"
                  title="استيراد وتجربة الكود"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
