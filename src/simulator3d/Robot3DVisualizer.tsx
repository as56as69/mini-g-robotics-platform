import React, { Suspense } from 'react';
import { Box, Loader2, MousePointer2 } from 'lucide-react';

// Lazy-load the heavy WebGL scene (only fetched when 3D mode is opened)
const Robot3DScene = React.lazy(() => import('./Robot3DScene'));

function SceneLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/40 animate-pulse">
        <Box className="w-7 h-7 text-white" />
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>جاري تحميل المجسم ثلاثي الأبعاد... 🧊</span>
      </div>
    </div>
  );
}

interface Props {
  state: import('../types/robot').RobotState;
}

/**
 * Full WebGL 3D Digital Twin viewer (lazy-loaded).
 * Drag to orbit 360°, scroll to zoom, auto-rotates when idle.
 */
export default function Robot3DVisualizer({ state }: Props) {
  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700/60 text-xs font-bold text-slate-200 pointer-events-none">
        <Box className="w-3.5 h-3.5 text-indigo-400" />
        <span>المحاكي المجسم ثلاثي الأبعاد (WebGL Twin)</span>
      </div>

      {/* Model badge */}
      <div className="absolute top-3 right-3 z-10 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700/60 text-[10px] font-mono font-bold text-slate-300 pointer-events-none">
        {state.model === 'mini_gf' && 'MINI G-F · KEYCHAIN'}
        {state.model === 'mini_gm' && 'MINI G-M · DESKTOP'}
        {state.model === 'mini_g' && 'MINI G · HUMANOID AI'}
      </div>

      {/* WebGL scene (lazy + suspense) */}
      <React.Suspense
        fallback={
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-950">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="text-xs text-slate-400 font-bold">تحميل محرك المجسم ثلاثي الأبعاد... 🧊</span>
          </div>
        }
      >
        <Robot3DScene state={state} />
      </React.Suspense>

      {/* Hint footer */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-slate-500 bg-slate-900/70 backdrop-blur px-2.5 py-1 rounded-lg pointer-events-none">
        اسحب للتدوير • عجلة الماوس للتكبير 🔄
      </div>
    </div>
  );
}
