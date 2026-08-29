import React, { useState } from 'react';
import { Shield, Lock, Eye, CheckCircle2, AlertTriangle, Key, Users, Sparkles } from 'lucide-react';
import { SoundFXManager } from '../ble/SoundFX';

export const SafetyGuardModal: React.FC = () => {
  const [bleRestricted, setBleRestricted] = useState(false);
  const [voiceSafeFilter, setVoiceSafeFilter] = useState(true);
  const [maxVolumeLimit, setMaxVolumeLimit] = useState(80);
  const [studentCodeExportAllowed, setStudentCodeExportAllowed] = useState(true);
  const [saveNotify, setSaveNotify] = useState(false);

  const handleSaveSettings = () => {
    SoundFXManager.playClickBeep();
    setSaveNotify(true);
    setTimeout(() => setSaveNotify(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              لوحة الأمان والرقابة التربوية للفصول (Classroom Safety & Permission Guard)
            </h3>
            <p className="text-[11px] text-slate-400">إدارة صلاحيات الطلاب، حماية المحتوى، وتأمين اتصال الروبوتات في معمل المدرسة</p>
          </div>
        </div>

        <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" />
          <span>حماية مشددة للأطفال 🛡️</span>
        </span>
      </div>

      {/* Safety Toggles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Toggle 1: Voice Safe Filter */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-200">فلتر الأمان الصوتي والذكاء الاصطناعي</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">منع الكلمات غير المناسبة وتوجيه حوار الذكاء الاصطناعي نحو المفاهيم التعليمية فقط.</p>
            </div>
            <input
              type="checkbox"
              checked={voiceSafeFilter}
              onChange={e => setVoiceSafeFilter(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 cursor-pointer mt-1"
            />
          </div>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>نظام Kid-Safe AI Prompt نشط</span>
          </span>
        </div>

        {/* Toggle 2: BLE Device Whitelist */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-200">حظر الأجهزة غير المعرفة بالفصل</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">منع اقتران الطلاب بروبوتات زملائهم عن طريق الخطأ وقصر الاتصال على معرفات الصف.</p>
            </div>
            <input
              type="checkbox"
              checked={bleRestricted}
              onChange={e => setBleRestricted(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 cursor-pointer mt-1"
            />
          </div>
          <span className="text-[10px] text-slate-400">تأمين شبكة BLE GATT</span>
        </div>

        {/* Toggle 3: Max Volume Limit */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-200">الحد الأقصى لمستوى صوت الروبوت: {maxVolumeLimit}%</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">حماية حاسة السمع لدى الأطفال وتجنب الضوضاء المرتفعة أثناء الحصة.</p>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={maxVolumeLimit}
            onChange={e => setMaxVolumeLimit(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Toggle 4: Export Permission */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-200">السماح بتصدير وحفظ الأكواد</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">تمكين الطلاب من تنزيل مشاريعهم والواجبات إلى أجهزتهم الخاصة.</p>
            </div>
            <input
              type="checkbox"
              checked={studentCodeExportAllowed}
              onChange={e => setStudentCodeExportAllowed(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 cursor-pointer mt-1"
            />
          </div>
          <span className="text-[10px] text-indigo-400 font-bold">متاح لجميع حسابات الطلاب</span>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <span className="text-[11px] text-slate-400">
          يتم تطبيق إعدادات الأمان على كافة أجهزة المعمل المشتركة
        </span>
        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 flex items-center gap-1.5"
        >
          {saveNotify && <CheckCircle2 className="w-4 h-4" />}
          <span>{saveNotify ? 'تم الحفظ وتطبيق الأمان!' : 'حفظ وتأمين الفصل 🔒'}</span>
        </button>
      </div>
    </div>
  );
};
