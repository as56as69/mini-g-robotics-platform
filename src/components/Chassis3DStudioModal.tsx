import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Box, Download, Layers, Sparkles, Check, Sliders, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  model: RobotModelType;
}

export const Chassis3DStudioModal: React.FC<Props> = ({ model }) => {
  const modelInfo = ROBOT_MODELS[model];
  const [headShape, setHeadShape] = useState<'rounded' | 'cubical' | 'cylinder'>('rounded');
  const [chassisColor, setChassisColor] = useState('#38bdf8');
  const [antennaStyle, setAntennaStyle] = useState<'single' | 'dual' | 'dish'>('dual');
  const [wheelSize, setWheelSize] = useState(42);
  const [exporting, setExporting] = useState(false);

  const handleExportSTL = () => {
    SoundFXManager.playRobotChirp();
    setExporting(true);

    setTimeout(() => {
      // Generate a mock ASCII STL 3D file for 3D printing
      const stlContent = `solid mini_g_custom_chassis
  facet normal 0.0 0.0 1.0
    outer loop
      vertex 0.0 0.0 0.0
      vertex 10.0 0.0 0.0
      vertex 10.0 10.0 0.0
    endloop
  endfacet
endsolid mini_g_custom_chassis`;

      const blob = new Blob([stlContent], { type: 'model/stl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model}_custom_chassis_3d.stl`;
      a.click();
      URL.revokeObjectURL(url);

      setExporting(false);
      SoundFXManager.playVictory();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }, 1000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              استوديو التصميم الميكانيكي والطباعة ثلاثية الأبعاد (3D CAD & Chassis Studio)
            </h3>
            <p className="text-[11px] text-slate-400">صمم هيكل روبوتك ثلاثي الأبعاد وقم بتحميل ملفات الـ 3D STL لطباعتها في معمل المدرسة</p>
          </div>
        </div>

        <button
          onClick={handleExportSTL}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'جاري تجهيز المجسم...' : 'تصدير ملف الطباعة 3D (.STL) 🖨️'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left: 3D Preview Box */}
        <div className="md:col-span-6 bg-slate-950 p-6 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center gap-4 relative min-h-[260px] shadow-inner">
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
              معاينة الهيكل الميكانيكي ({modelInfo.name})
            </span>
          </div>

          {/* Abstract 3D Representation */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Antennas */}
            {antennaStyle === 'dual' && (
              <div className="flex gap-10 -mb-2 z-10">
                <div className="w-2 h-6 bg-amber-400 rounded-full animate-bounce" />
                <div className="w-2 h-6 bg-amber-400 rounded-full animate-bounce delay-100" />
              </div>
            )}
            {antennaStyle === 'single' && (
              <div className="w-2 h-8 bg-amber-400 rounded-full -mb-2 z-10 animate-bounce" />
            )}
            {antennaStyle === 'dish' && (
              <div className="w-10 h-3 bg-amber-400 rounded-t-full -mb-1 z-10" />
            )}

            {/* Robot Head */}
            <div
              className={`w-32 h-24 border-4 border-slate-700 shadow-2xl flex items-center justify-center transition-all duration-300 ${
                headShape === 'rounded' ? 'rounded-3xl' : headShape === 'cubical' ? 'rounded-lg' : 'rounded-t-full rounded-b-xl'
              }`}
              style={{ backgroundColor: chassisColor }}
            >
              <div className="w-24 h-14 bg-slate-950 rounded-xl flex items-center justify-center gap-3 border border-slate-800">
                <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse shadow-md shadow-cyan-400" />
                <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse shadow-md shadow-cyan-400" />
              </div>
            </div>

            {/* Base / Wheels for Mini G */}
            {model === 'mini_g' && (
              <div className="flex items-center gap-24 -mt-3">
                <div className="bg-slate-800 rounded-lg border-2 border-slate-600" style={{ width: wheelSize / 3, height: wheelSize }} />
                <div className="bg-slate-800 rounded-lg border-2 border-slate-600" style={{ width: wheelSize / 3, height: wheelSize }} />
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            أبعاد الهيكل: 85mm × 90mm × 110mm • مادة الطباعة: PLA Filament
          </div>
        </div>

        {/* Right: Customization Sliders & Selectors */}
        <div className="md:col-span-6 flex flex-col gap-3 text-xs">
          {/* Head Shape */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <span className="font-bold text-slate-300">شكل رأس وهيكل الروبوت:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'rounded', label: 'دائري جذاب' },
                { id: 'cubical', label: 'مكعب كلاسيكي' },
                { id: 'cylinder', label: 'أسطواني مستقبلي' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => { SoundFXManager.playClickBeep(); setHeadShape(s.id as any); }}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    headShape === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Antenna Style */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <span className="font-bold text-slate-300">هوائي الإشارة والرادار (Antenna):</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'dual', label: 'أذنان وهوائيان' },
                { id: 'single', label: 'هوائي وسطي' },
                { id: 'dish', label: 'رادار فضائي' }
              ].map(a => (
                <button
                  key={a.id}
                  onClick={() => { SoundFXManager.playClickBeep(); setAntennaStyle(a.id as any); }}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    antennaStyle === a.id ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <span className="font-bold text-slate-300">لون مادة البلاستيك (PLA Color):</span>
            <div className="flex items-center gap-2 pt-0.5">
              {['#38bdf8', '#a855f7', '#ec4899', '#22c55e', '#f59e0b', '#ef4444', '#f8fafc', '#1e293b'].map(col => (
                <button
                  key={col}
                  onClick={() => { SoundFXManager.playClickBeep(); setChassisColor(col); }}
                  style={{ backgroundColor: col }}
                  className={`w-7 h-7 rounded-full border-2 transition transform active:scale-95 ${
                    chassisColor === col ? 'border-white scale-110 shadow' : 'border-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
