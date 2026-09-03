import React from 'react';
import { COLORING_PAGES } from './data';

/* كود ماجيك بالتفت — تبويب التلوين
 * ============================================================
 */

export const ColoringTab: React.FC = () => {
  const [msg, setMsg] = React.useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      {msg && (
        <div className="mb-4 mx-auto w-fit px-4 py-2 bg-white border-2 border-dashed border-[#6c5ce7] rounded-xl text-sm font-bold text-[#2d3436]">
          {msg}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {COLORING_PAGES.map((page) => (
          <button
            key={page.name}
            onClick={() => setMsg(`🎨 افتح ${page.name} للتلوين! (قريباً)`)}
            className="bg-white rounded-[18px_5px_18px_5px] border-[3px] border-dashed p-4 text-center hover:scale-105 transition shadow-[4px_4px_0_rgba(0,0,0,0.06)]"
            style={{ borderColor: page.color }}
          >
            <span className="text-6xl block mb-2">{page.emoji}</span>
            <span className="font-bold text-sm text-[#2d3436]">{page.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
