import React, { useState } from 'react';
import { Shield, Lock, Eye, CheckCircle2, AlertTriangle, Key, Users, Sparkles, Hammer, Bell } from 'lucide-react';
import { SoundFXManager } from '../ble/SoundFX';
import { safetyManager } from '../ble/SafetyManager';

type DevField =
  | 'voiceSafeFilter'
  | 'bleRestricted'
  | 'maxVolumeLimit'
  | 'studentCodeExportAllowed'
  | 'save';

const FIELD_LABELS: Record<DevField, string> = {
  voiceSafeFilter: 'فلتر الأمان الصوتي والذكاء الاصطناعي',
  bleRestricted: 'حظر الأجهزة غير المعرفة بالفصل',
  maxVolumeLimit: 'الحد الأقصى لمستوى صوت الروبوت',
  studentCodeExportAllowed: 'السماح بتصدير وحفظ الأكواد',
  save: 'حفظ وتأمين الفصل',
};

export const SafetyGuardModal: React.FC = () => {
  const initial = safetyManager.get();
  const [bleRestricted, setBleRestricted] = useState(initial.bleRestricted);
  const [voiceSafeFilter, setVoiceSafeFilter] = useState(initial.voiceSafeFilter);
  const [maxVolumeLimit, setMaxVolumeLimit] = useState(initial.maxVolumeLimit);
  const [studentCodeExportAllowed, setStudentCodeExportAllowed] = useState(initial.studentCodeExportAllowed);
  const [devToast, setDevToast] = useState<string | null>(null);

  const showDev = (field: DevField) => {
    SoundFXManager.playClickBeep();
    setDevToast(`قيد التطوير 🚧 — ${FIELD_LABELS[field]}`);
    window.clearTimeout((showDev as any)._t);
    (showDev as any)._t = window.setTimeout(() => setDevToast(null), 2600);
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

        <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
          <Hammer className="w-3.5 h-3.5" />
          <span>قيد التطوير 🚧</span>
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
              onChange={e => { setVoiceSafeFilter(e.target.checked); showDev('voiceSafeFilter'); }}
              className="w-4 h-4 rounded text-emerald-600 cursor-pointer mt-1"
            />
          </div>
          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
            <Hammer className="w-3 h-3" />
            <span>قيد التطوير</span>
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
              onChange={e => { setBleRestricted(e.target.checked); showDev('bleRestricted'); }}
              className="w-4 h-4 rounded text-emerald-600 cursor-pointer mt-1"
            />
          </div>
          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
            <Hammer className="w-3 h-3" />
            <span>قيد التطوير</span>
          </span>
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
            onChange={e => { setMaxVolumeLimit(Number(e.target.value)); showDev('maxVolumeLimit'); }}
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
              onChange={e => { setStudentCodeExportAllowed(e.target.checked); showDev('studentCodeExportAllowed'); }}
              className="w-4 h-4 rounded text-emerald-600 cursor-pointer mt-1"
            />
          </div>
          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
            <Hammer className="w-3 h-3" />
            <span>قيد التطوير</span>
          </span>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <span className="text-[11px] text-slate-400">
          يتم تطبيق إعدادات الأمان على كافة أجهزة المعمل المشتركة
        </span>
        <button
          onClick={() => showDev('save')}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 flex items-center gap-1.5"
        >
          <Lock className="w-4 h-4" />
          <span>حفظ وتأمين الفصل 🔒</span>
        </button>
      </div>

      {/* Dev toast */}
      {devToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] bg-slate-950/95 border border-amber-500/50 text-amber-200 text-xs font-black px-4 py-2.5 rounded-2xl shadow-2xl shadow-amber-500/20 backdrop-blur whitespace-nowrap max-w-[92vw] text-center flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>{devToast}</span>
        </div>
      )}
    </div>
  );
};
