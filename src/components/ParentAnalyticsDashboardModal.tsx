import React from 'react';
import { Award, Star, Flame, Sparkles, TrendingUp, CheckCircle2, Clock, BookOpen, HeartHandshake } from 'lucide-react';

export const ParentAnalyticsDashboardModal: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-pink-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              لوحة متابعة ولي الأمر ومؤشرات النمو الذكي (Parent & STEAM Growth Dashboard)
            </h3>
            <p className="text-[11px] text-slate-400">تقارير دورية مبسطة لأولياء الأمور توضح تطور التفكير المنطقي ومهارات الطفل</p>
          </div>
        </div>

        <span className="text-xs bg-pink-500/20 text-pink-300 font-bold px-2.5 py-0.5 rounded-full border border-pink-500/30">
          تقرير هذا الأسبوع 📈
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>وقت البرمجة الأسبوعي</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-black text-white mt-1">4 ساعات و 20 د</div>
          <span className="text-[10px] text-emerald-400 font-bold">+15% عن الأسبوع الماضي</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>المهام المكتملة</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white mt-1">12 تحدياً</div>
          <span className="text-[10px] text-emerald-400 font-bold">بمعدل دقة 92%</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>التفكير المنطقي والخوارزميات</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300 mt-1">مستوى متقدم ⭐</div>
          <span className="text-[10px] text-slate-400">فهم عميق للتكرار والشرط</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>الابتكار وحل المشكلات</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-300 mt-1">إبداعي جداً 💡</div>
          <span className="text-[10px] text-slate-400">قام ببرمجة 3 سيناريوهات حرة</span>
        </div>
      </div>

      {/* Strengths & Teacher Remarks */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>ملاحظات المعلم وتوصيات الدعم المنزلي:</span>
        </span>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          "يُظهر الطالب شغفاً كبيراً في الربط بين العالم الحقيقي للـ ESP32 وشخصيات الذكاء الاصطناعي، ويتمتع بسرعة بديهة في اكتشاف الأخطاء البرمجية وتصحيحها. ننصح بتشجيعه على تصميم تحديات جديدة ومشاركتها مع زملائه."
        </p>
      </div>
    </div>
  );
};
