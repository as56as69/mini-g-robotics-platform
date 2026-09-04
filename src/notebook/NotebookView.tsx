import React, { useMemo, useState } from 'react';
import { TAB_NAMES, TabId, MEDALS, LETTERS_ARABIC, LETTERS_ENGLISH, NUMBERS_ARABIC, NUMBERS_ENGLISH, LangMode, CharMode } from './data';
import { NotebookProvider, useNotebook } from './notebookContext';
import { sessionLetters } from './utils';
import { DrawTab } from './DrawTab';
import { GamesTab } from './GamesTab';
import { ColoringTab } from './ColoringTab';
import { TeacherTab } from './TeacherTab';
import { CertTab } from './CertTab';

/* كود ماجيك بالتفت — الدفتر التفاعلي لبيئة تعليمية (روضة + أول ابتدائي)
 * ============================================================
 */

export const NotebookView: React.FC = () => (
  <NotebookProvider>
    <NotebookInner />
  </NotebookProvider>
);

function NotebookInner() {
  const { stars } = useNotebook();
  const [tab, setTab] = useState<TabId>('draw');
  const [lang, setLang] = useState<LangMode>('arabic');
  const [mode, setMode] = useState<CharMode>('letters');

  const letters = useMemo(() => sessionLetters(lang, mode, LETTERS_ARABIC, LETTERS_ENGLISH, NUMBERS_ARABIC, NUMBERS_ENGLISH), [lang, mode]);

  return (
    <div className="flex-1 min-h-0 flex flex-col" dir="rtl" style={{ background: '#f5e6d3' }}>
      {/* شريط النجوم والميداليات */}
      <div className="flex-shrink-0 px-3 py-1.5 bg-white/70 border-b-2 border-dashed border-[#d4b8a0] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[#6c5200] font-bold">
          <span>⭐</span>
          <span className="text-base">{stars}</span>
          <span className="text-xs opacity-70">نجوم</span>
          <span className="mx-1 text-[#d4b8a0]">|</span>
          {Object.entries(MEDALS).map(([id, m]) => (
            <span
              key={id}
              title={`${m.name} — ${m.desc}`}
              className={`text-lg transition-all ${stars >= m.stars ? 'scale-110' : 'grayscale opacity-30'}`}
            >
              {m.emoji}
            </span>
          ))}
        </div>
        <button
          onClick={() => setTab('teacher')}
          className="text-[11px] font-bold px-2 py-1 bg-[#f0e6ff] text-[#6c5ce7] rounded-lg border-2 border-dashed border-[#6c5ce7]/40 hover:bg-[#6c5ce7]/10"
        >
          🏅 الميداليات
        </button>
      </div>

      {/* شريط التبويبات */}
      <div className="flex-shrink-0 px-2 py-1.5 bg-white/60 border-b-2 border-dashed border-[#d4b8a0] flex gap-1.5 flex-wrap justify-center">
        {(Object.keys(TAB_NAMES) as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-bold px-3 py-1.5 rounded-[30px_8px_30px_8px] border-[3px] transition-all text-xs ${
              tab === t
                ? 'bg-[#6c5ce7] text-white border-[#4a3f8a] shadow-[3px_3px_0_rgba(74,63,138,0.4)] scale-105'
                : 'bg-white text-[#2d3436] border-[#d4b8a0] hover:border-[#6c5ce7]'
            }`}
            style={{ rotate: `${(Object.keys(TAB_NAMES).indexOf(t) - 2) * 0.8}deg` }}
          >
            {TAB_NAMES[t]}
          </button>
        ))}
      </div>

      {/* المحتوى الرئيسي */}
      {tab === 'draw' ? (
        <div className="flex-1 min-h-0">
          <DrawTab lang={lang} mode={mode} setLang={setLang} setMode={setMode} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4">
          {tab === 'games' && <GamesTab letters={letters} />}
          {tab === 'coloring' && <ColoringTab />}
          {tab === 'teacher' && <TeacherTab />}
          {tab === 'cert' && <CertTab />}
        </div>
      )}

      {/* شريط الحروف السفلي — كل الحروف مفتوحة ومتاحة بلا علامات إتمام */}
      <div className="flex-shrink-0 px-2 py-1.5 bg-white/80 border-t-[3px] border-dashed border-[#d4b8a0] flex items-center gap-1.5 overflow-x-auto">
        {letters.map((ch, i) => (
          <span
            key={ch}
            className={`min-w-[30px] h-[30px] flex items-center justify-center font-bold text-sm border-[3px] rounded-[50%_25%_50%_25%] transition ${
              i === 0 ? 'ring-2 ring-[#6c5ce7]' : 'bg-white border-[#d4b8a0]'
            }`}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}
