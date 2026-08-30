import React, { useState, useEffect, useRef } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Box, Download, Layers, Sparkles, Check, Sliders, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  model: RobotModelType;
}

// ---- Real ASCII-STL generator that reflects every studio customization ----
function buildChassisSTL(params: {
  headShape: 'rounded' | 'cubical' | 'cylinder';
  antennaStyle: 'single' | 'dual' | 'dish';
  wheelSize: number;
  hasWheels: boolean;
}): string {
  const facets: string[] = [];
  const addTri = (a: number[], b: number[], c: number[]) => {
    facets.push(
      `  facet normal 0 0 0\n    outer loop\n` +
      `      vertex ${a[0]} ${a[1]} ${a[2]}\n` +
      `      vertex ${b[0]} ${b[1]} ${b[2]}\n` +
      `      vertex ${c[0]} ${c[1]} ${c[2]}\n` +
      `    endloop\n  endfacet`
    );
  };

  const addBox = (cx: number, cy: number, cz: number, w: number, h: number, d: number) => {
    const x0 = cx - w / 2, y0 = cy - d / 2, z0 = cz - h / 2;
    const x1 = cx + w / 2, y1 = cy + d / 2, z1 = cz + h / 2;
    const v = (x: number, y: number, z: number) => [x, y, z];
    const quad = (p: number[][]) => {
      addTri(p[0], p[1], p[2]); addTri(p[0], p[2], p[3]);
    };
    quad([v(x0,y0,z0), v(x1,y0,z0), v(x1,y1,z0), v(x0,y1,z0)]); // bottom
    quad([v(x0,y0,z1), v(x0,y1,z1), v(x1,y1,z1), v(x1,y0,z1)]); // top
    quad([v(x0,y0,z0), v(x0,y1,z0), v(x0,y1,z1), v(x0,y0,z1)]); // x-
    quad([v(x1,y0,z0), v(x1,y0,z1), v(x1,y1,z1), v(x1,y1,z0)]); // x+
    quad([v(x0,y0,z0), v(x0,y0,z1), v(x1,y0,z1), v(x1,y0,z0)]); // y-
    quad([v(x0,y1,z0), v(x1,y1,z0), v(x1,y1,z1), v(x0,y1,z1)]); // y+
  };

  const addCylinderZ = (cx: number, cy: number, cz: number, r: number, h: number, seg = 16) => {
    const ring = (z: number) =>
      Array.from({ length: seg }, (_, i) => {
        const a = (i / seg) * Math.PI * 2;
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
      });
    const ring0 = ring(cz), ring1 = ring(cz + h);
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg;
      addTri(ring0[i], ring0[j], ring1[j]);
      addTri(ring0[i], ring1[j], ring1[i]);
    }
    for (let i = 1; i < seg - 1; i++) {
      addTri([cx, cy, cz], ring0[i], ring0[i + 1]);
      addTri([cx, cy, cz + h], ring1[i + 1], ring1[i]);
    }
  };

  const axis = params.headShape === 'rounded' ? [96, 84, 118] : params.headShape === 'cubical' ? [88, 96, 108] : [null, null, 116];

  // Desktop base
  addBox(0, 0, 6, 84, 12, 74);

  // Head / body per selected shape
  const bodyCz = 6 + (axis[2] ?? 0) / 2;
  if (params.headShape === 'cylinder') {
    addCylinderZ(0, 0, 6, 42, axis[2] as number, 20);
  } else {
    addBox(0, 0, bodyCz, axis[0] as number, axis[2] as number, axis[1] as number);
  }

  // Face display window
  addBox(0, 0, (axis[2] ?? 0) * 0.66, 52, 40, 5);

  // Antennas per style
  const topZ = (axis[2] ?? 0) + 6;
  if (params.antennaStyle === 'dual') {
    addCylinderZ(-40, -30, topZ, 3.5, 46, 10);
    addCylinderZ(40, -30, topZ, 3.5, 46, 10);
    addBox(0, 0, topZ + 46, 74, 26, 8);
  } else if (params.antennaStyle === 'single') {
    addCylinderZ(0, -30, topZ, 4, 66, 10);
    addBox(0, 0, topZ + 66, 16, 16, 16);
  } else {
    addCylinderZ(0, -30, topZ, 4, 40, 10);
    addBox(0, 0, topZ + 40, 78, 12, 26);
  }

  // Wheels (only for the wheeled model; size follows the slider)
  if (params.hasWheels) {
    const r = params.wheelSize / 2;
    addCylinderZ(-52, 0, 6, r, 18, 18);
    addCylinderZ(52, 0, 6, r, 18, 18);
  }

  return `solid mini_g_custom_chassis_${params.headShape}_${params.antennaStyle}\n${facets.join('\n')}\nendsolid mini_g_custom_chassis\n`;
}

export const Chassis3DStudioModal: React.FC<Props> = ({ model }) => {
  const modelInfo = ROBOT_MODELS[model];
  const [headShape, setHeadShape] = useState<'rounded' | 'cubical' | 'cylinder'>('rounded');
  const [chassisColor, setChassisColor] = useState('#38bdf8');
  const [antennaStyle, setAntennaStyle] = useState<'single' | 'dual' | 'dish'>('dual');
  const [wheelSize, setWheelSize] = useState(42);
  const [exporting, setExporting] = useState(false);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleExportSTL = () => {
    if (exporting) return;
    SoundFXManager.playRobotChirp();
    setExporting(true);

    timerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      const stlContent = buildChassisSTL({
        headShape,
        antennaStyle,
        wheelSize,
        hasWheels: model === 'mini_g'
      });

      const blob = new Blob([stlContent], { type: 'model/stl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model}_chassis_${headShape}_${antennaStyle}_w${wheelSize}mm.stl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Delay revoking so the download is not interrupted in strict browsers
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);

      setExporting(false);
      SoundFXManager.playVictory();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }, 600);
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

          {/* Wheel Size Slider (only for the wheeled robot) */}
          {model === 'mini_g' && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>قطر العجلات: <strong className="text-cyan-300">{wheelSize}mm</strong></span>
              </span>
              <input
                type="range"
                min={30}
                max={70}
                value={wheelSize}
                onChange={e => { SoundFXManager.playClickBeep(); setWheelSize(Number(e.target.value)); }}
                className="w-full accent-cyan-500"
              />
              <span className="text-[10px] text-slate-500">30mm — 70mm (لعجلات الحركة التفاضلية)</span>
            </div>
          )}

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
