import React, { useState, useEffect } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { bleService } from '../ble/BLEManager';
import { SoundFXManager } from '../ble/SoundFX';
import { Wrench, CheckCircle2, AlertTriangle, HelpCircle, RefreshCw, Sparkles, Cpu, Cable, Wifi } from 'lucide-react';

interface Props {
  model: RobotModelType;
}

interface IssueDiagnosis {
  id: string;
  symptom: string;
  causes: string[];
  solutionSteps: string[];
  verification: string;
}

const COMMON_ISSUES: Record<RobotModelType, IssueDiagnosis[]> = {
  mini_gf: [
    {
      id: 'gf_ble',
      symptom: 'الميدالية لا تظهر في قائمة اقتران البلوتوث (BLE)',
      causes: ['البطارية منخفضة الشحن', 'لم يتم تفعيل البلوتوث في اللابتوب أو التابلت', 'المتصفح يحتاج إذن الوصول'],
      solutionSteps: [
        'تأكد من توصيل كيبل Type-C لشحن بطارية الميدالية وتأكد من وميض الضوء الأحمر',
        'تأكد من تفعيل Bluetooth في إعدادات الويندوز / الجهاز اللوحي',
        'افتح المنصة عبر متصفح Google Chrome أو Microsoft Edge واضغط زر "اتصال BLE"'
      ],
      verification: 'عند نجاح الاتصال ستومض عيون الميدالية باللون الأزرق ثم الأخضر مع نبضة اهتزاز خفيفة.'
    },
    {
      id: 'gf_touch',
      symptom: 'حساس اللمس لا يستجيب عند لمس رأس الميدالية',
      causes: ['سلك اللمس غير موصول بـ GPIO 2', 'حساسية اللمس تحتاج ضبطاً برمجياً'],
      solutionSteps: [
        'تأكد من ملامسة الإصبع للوح النحاسي العلوي مباشرة',
        'افتح شاشة "المنافذ" وتأكد أن منفذ اللمس مضبوط على Pin 2'
      ],
      verification: 'ستلاحظ وميض مؤشر Telemetry عند اللمس في لوحة الحساسات.'
    }
  ],
  mini_gm: [
    {
      id: 'gm_servo',
      symptom: 'محرك الرأس والسيرفو يصدر صوتاً مرتفعاً أو لا يدور بسلاسة',
      causes: ['جهد البطارية أقل من 4.8V', 'سلك السيرفو موصول بالاتجاه المعاكس', 'التروس البلاستيكية مقيدة ميكانيكياً'],
      solutionSteps: [
        'تأكد من أن السلك البرتقالي (Signal) متصل بـ GPIO 18، والسلك الأحمر بـ 5V والأسود بـ GND',
        'تأكد من حرية دوران رأس الروبوت وعدم وجود عائق في الهيكل المطبوع 3D',
        'شحن البطارية عبر منفذ Type-C لمدة 20 دقيقة'
      ],
      verification: 'اضغط على زر "وسط" في الريموت ليعود الروبوت للزاوية 90° بانسيابية.'
    },
    {
      id: 'gm_screen',
      symptom: 'شاشة العيون OLED سوداء ولا تعرض التعبيرات',
      causes: ['عكس خطوط I2C (SDA / SCL)', 'عنوان الشاشة I2C Address مختلف'],
      solutionSteps: [
        'تأكد من ربط SDA بـ GPIO 21 و SCL بـ GPIO 22',
        'تأكد من تغذية الشاشة بـ 3.3V من الـ ESP32'
      ],
      verification: 'ستظهر عيون السعادة التلقائية بمجرد إعادة تشغيل الشريحة.'
    }
  ],
  mini_g: [
    {
      id: 'g_wheels',
      symptom: 'الروبوت يدور في مكانه بدلاً من السير للأمام مباشرة',
      causes: ['أحد المحركات موصول بقطبية معكوسة (+ / -)', 'اختلاف سرعة المحركين في درايفر L298N'],
      solutionSteps: [
        'قم بتبديل سلكي المحرك الأيمن أو الأيسر لتوحيد اتجاه الدوران',
        'تأكد من أن كتل الحركة تعطي نفس السرعة للمحركين [60, 60]'
      ],
      verification: 'قم بتشغيل مسار "الساحة الحرة" وتأكد من استقامة حركة الروبوت.'
    },
    {
      id: 'g_voice',
      symptom: 'الصوت الذكي لا يخرج من مكبر الصوت المدمج',
      causes: ['مستوى الصوت مكتوم بالمتصفح', 'سلك مكبر الصوت I2S مفصول'],
      solutionSteps: [
        'تأكد من إعطاء إذن تشغيل الصوت للمتصفح (Web Audio Permission)',
        'تأكد من توصيل مكبر الصوت 3W بـ GPIO 22/23'
      ],
      verification: 'اختبر شخصية "الخوارزمي" في نافذة الذكاء الاصطناعي لسماع التحية الترحيبية.'
    }
  ]
};

export const TroubleshootingAssistantModal: React.FC<Props> = ({ model }) => {
  const modelInfo = ROBOT_MODELS[model];
  const issues = COMMON_ISSUES[model] || COMMON_ISSUES['mini_gf'];
  const [selectedIssue, setSelectedIssue] = useState<IssueDiagnosis>(issues[0]);
  const [diagnosing, setDiagnosing] = useState(false);
  const [scanResult, setScanResult] = useState<{ ok: boolean; text: string } | null>(null);

  // Reset selection whenever the model prop changes (even if reused in place)
  useEffect(() => {
    setSelectedIssue((COMMON_ISSUES[model] || COMMON_ISSUES['mini_gf'])[0]);
    setScanResult(null);
  }, [model]);

  const runAutoScan = () => {
    if (diagnosing) return;
    setDiagnosing(true);
    const bleConnected = (bleService as any).isConnected ? bleService.isConnected() : false;
    SoundFXManager.playRobotChirp();
    setTimeout(() => {
      setDiagnosing(false);
      if (bleConnected) {
        setScanResult({ ok: true, text: '✅ تم اكتشاف اتصال BLE فعلي بالروبوت بنجاح — الموجة والتردد سليمان.' });
      } else {
        setScanResult({
          ok: false,
          text: '⚠️ وضع المحاكاة الافتراضي (اللا سلكي): لا يوجد اتصال BLE فعلي حالياً. لتشخيص حقيقي اضغط «اتصال BLE» في اللوحة الرئيسية ثم أعد الفحص.'
        });
      }
    }, 800);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              مساعد الصيانة وفحص الأعطال الهندسية بالذكاء الاصطناعي (Hardware Diagnostic AI)
            </h3>
            <p className="text-[11px] text-slate-400">دليل تفاعلي وسريع لمساعدة المعلم والطفل على حل أي مشكلة في التوصيل أو البرمجة</p>
          </div>
        </div>

        <button
          onClick={runAutoScan}
          disabled={diagnosing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${diagnosing ? 'animate-spin' : ''}`} />
          <span>{diagnosing ? 'جاري الفحص...' : 'فحص الاتصال الذاتي 🔍'}</span>
        </button>
      </div>

      {/* Auto-Scan Result */}
      {scanResult && (
        <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
          scanResult.ok
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          <Cable className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{scanResult.text}</span>
        </div>
      )}

      {/* Issues Selection List */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-slate-300">اختر المشكلة التي تواجهها مع {modelInfo.nameAr}:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {issues.map(iss => (
            <button
              key={iss.id}
              onClick={() => setSelectedIssue(iss)}
              className={`p-3 rounded-xl border text-right transition flex items-start gap-2 ${
                selectedIssue.id === iss.id
                  ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${selectedIssue.id === iss.id ? 'text-amber-400' : 'text-slate-500'}`} />
              <div className="flex flex-col">
                <span className="font-bold text-xs">{iss.symptom}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Issue Solution Card */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 shadow-inner">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">الأسباب المحتملة:</span>
          <ul className="flex flex-wrap gap-1.5 mt-1">
            {selectedIssue.causes.map((c, i) => (
              <li key={i} className="text-[11px] bg-slate-900 text-amber-300 border border-slate-800 px-2.5 py-1 rounded-lg">
                ⚠️ {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t border-slate-850">
          <span className="text-xs text-emerald-400 font-bold block mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>خطوات الحل والإصلاح السريع:</span>
          </span>
          <ol className="flex flex-col gap-1.5 pr-3 text-xs text-slate-300 list-decimal list-inside">
            {selectedIssue.solutionSteps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="pt-2 border-t border-slate-850 bg-slate-900/60 p-2.5 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0 text-cyan-400" />
          <span><strong className="text-white">طريقة التحقق من النجاح:</strong> {selectedIssue.verification}</span>
        </div>
      </div>
    </div>
  );
};
