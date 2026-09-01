import React, { useCallback, useState } from 'react';
import { Home, Play, RotateCcw, Trash2 } from 'lucide-react';
import { AdventureAction, AdventureCommand } from '../types/warakiAdventure';
import { WARAKI_CHAPTERS } from '../services/warakiChapters';
import { useAdventureEngine } from './useAdventureEngine';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  onBack: () => void;
}

const SPEAKER_LABELS: Record<string, string> = {
  narrator: '📖 الحكاية',
  hassan: '🧑 حسن (الأخ الأكبر)',
  abbas: '👦 عباس',
  waraki: '👾 ورقي',
};

const SPEAKER_BG: Record<string, string> = {
  narrator: '#fffef7',
  hassan: '#eef3fe',
  abbas: '#fff5f5',
  waraki: '#eafaf0',
};

const STEP_LABELS: Record<number, string> = {
  1: 'خطوة',
  2: 'خطوتان',
  3: '٣ خطوات',
  4: '٤ خطوات',
  5: '٥ خطوات',
};

let cmdSeq = 0;

export const WarakiAdventuresView: React.FC<Props> = ({ onBack }) => {
  const [chapterIdx, setChapterIdx] = useState(0);
  const chapter = WARAKI_CHAPTERS[Math.min(chapterIdx, WARAKI_CHAPTERS.length - 1)];

  return (
    <ChapterStage
      key={chapter.id}
      chapter={chapter}
      chapterIdx={chapterIdx}
      setChapterIdx={setChapterIdx}
      onBack={onBack}
    />
  );
};

/**
 * Chapter stage — mounted with key={chapter.id} so switching chapters
 * fully remounts (engine + stage + narration) with zero state leakage.
 */
const ChapterStage: React.FC<{
  chapter: (typeof WARAKI_CHAPTERS)[number];
  chapterIdx: number;
  setChapterIdx: React.Dispatch<React.SetStateAction<number>>;
  onBack: () => void;
}> = ({ chapter, chapterIdx, setChapterIdx, onBack }) => {
  const [phase, setPhase] = useState<'narration' | 'ready'>('narration');
  const [narrIdx, setNarrIdx] = useState(0);
  const [commands, setCommands] = useState<AdventureCommand[]>([]);
  const { state, reset, run } = useAdventureEngine(chapter, () => {
    try { localStorage.setItem(`mg_waraki_${chapter.id}_done`, '1'); } catch { /* ignore */ }
  });
  const [showReward, setShowReward] = useState(false);
  // Reward appears 1.2s AFTER the win so the kid watches the monster scatter
  React.useEffect(() => {
    if (state.status === 'won') {
      const t = window.setTimeout(() => setShowReward(true), 1200);
      return () => window.clearTimeout(t);
    }
    setShowReward(false);
  }, [state.status]);

  const addCommand = (action: AdventureAction) => {
    if (state.status === 'running' || state.status === 'won') return;
    SoundFXManager.playClickBeep();
    setCommands((cs) => [...cs, { id: `c${Date.now()}_${cmdSeq++}`, action, steps: 1 }]);
  };

  // Tap a movement card to cycle its steps 1→2→3→4→5→1
  const cycleCommand = (id: string) => {
    if (state.status === 'running') return;
    SoundFXManager.playClickBeep();
    setCommands((cs) =>
      cs.map((c) => (c.id === id ? { ...c, steps: c.steps >= 5 ? 1 : c.steps + 1 } : c))
    );
  };

  const removeCommand = (id: string) => {
    if (state.status === 'running') return;
    setCommands((cs) => cs.filter((c) => c.id !== id));
  };

  const handleRun = async () => {
    if (!commands.length || state.status === 'running') return;
    await run(commands);
  };

  const handleRetry = () => {
    SoundFXManager.playPaperRustle();
    reset();
  };

  const pct = (state.warakiX / chapter.stage.length) * 100;
  const abbasPct = (chapter.stage.abbasAt / chapter.stage.length) * 100;
  const monsterPct = state.monsterX !== undefined ? (state.monsterX / chapter.stage.length) * 100 : null;
  // ===== Narration phase =====
  if (phase === 'narration') {
    const line = chapter.narration[narrIdx];
    const speakerLabel =
      line.speaker === 'narrator' ? '📖 الحكاية'
      : line.speaker === 'hassan' ? '🧑 حسن (الأخ الأكبر)'
      : line.speaker === 'abbas' ? '👦 عباس'
      : '👾 ورقي';
    const bubbleBg =
      line.speaker === 'waraki' ? '#eafaf0' : line.speaker === 'abbas' ? '#fff5f5' : line.speaker === 'hassan' ? '#eef3fe' : '#fffef7';

    return (
      <div className="fixed inset-0 z-[100] bg-[#fdfbf4] flex flex-col" dir="rtl">
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#f5f0e1] border-b-2 border-[#2b2a33]/20 flex-shrink-0">
          <span className="doodle-title font-bold text-[#2b2a33] text-sm sm:text-base">
            {chapter.icon} {chapter.titleAr}
          </span>
          <button
            onClick={onBack}
            className="doodle-title flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-[#ffecc2] border-2 border-[#2b2a33]/40 rounded-xl text-[#2b2a33] hover:bg-[#ffd93d] transition active:scale-95"
          >
            عودة للرسم
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6 relative overflow-hidden">
          <span className="doodle-tape" style={{ top: 10, right: '18%' }} />
          <span className="doodle-tape" style={{ top: 2, left: '12%', transform: 'rotate(5deg)' }} />
          <h2 className="doodle-title text-2xl sm:text-3xl font-bold text-[#2b2a33] doodle-wiggly">
            {chapter.icon} {chapter.titleAr}
          </h2>
          <div
            key={narrIdx}
            className="character-badge max-w-xl w-full px-5 py-4 !transform-none"
            style={{
              background: bubbleBg,
              animation: 'warakiNarrPop 0.4s ease-out',
              transform: `rotate(${narrIdx % 2 === 0 ? 0.8 : -0.8}deg)`,
            }}
          >
            <span className="character-badge !shadow-none text-[10px] font-bold text-[#2b2a33]/70 block mb-1 w-fit" style={{ transform: 'rotate(0.6deg)' }}>
              {speakerLabel}
            </span>
            <p className="doodle-title text-[#2b2a33] text-sm sm:text-lg font-semibold leading-relaxed">{line.text}</p>
          </div>
          <div className="flex items-center gap-2">
            {narrIdx > 0 && (
              <button
                onClick={() => setNarrIdx((i) => Math.max(0, i - 1))}
                className="doodle-button bg-white text-sm font-bold px-4 py-2 text-[#2b2a33] hover:bg-[#ffecc2]"
              >
                السابق
              </button>
            )}
            <button
              onClick={() => {
                if (narrIdx < chapter.narration.length - 1) {
                  SoundFXManager.playPaperRustle();
                  setNarrIdx((i) => i + 1);
                } else {
                  SoundFXManager.playPaperTorn();
                  setPhase('ready');
                }
              }}
              className="doodle-button text-base font-bold px-7 py-2.5 bg-[#ff6b6b] text-white"
            >
              {narrIdx < chapter.narration.length - 1 ? 'التالي ›' : 'ابدأ المغامرة! ⚡'}
            </button>
          </div>
          <div className="flex gap-1.5 mt-1">
            {chapter.narration.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${i <= narrIdx ? 'bg-[#ff6b6b]' : 'bg-[#2b2a33]/20'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== Stage + programming phase =====
  const activeId = state.activeIndex >= 0 ? commands[state.activeIndex]?.id : null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#fdfbf4] flex flex-col" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#f5f0e1] border-b-2 border-[#2b2a33]/20 flex-shrink-0">
        <span className="doodle-title font-bold text-[#2b2a33] text-sm sm:text-base">
          {chapter.icon} {chapter.titleAr}
        </span>
        <button
          onClick={onBack}
          className="doodle-title flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-[#ffecc2] border-2 border-[#2b2a33]/40 rounded-xl text-[#2b2a33] hover:bg-[#ffd93d] transition active:scale-95"
        >
          <Home className="w-4 h-4" /> عودة للرسم
        </button>
      </div>

      {/* ===== Paper stage — a kid's scribbled notebook scene ===== */}
      <div className="relative flex-1 min-h-[220px] adventure-stage adventure-frame mx-2 sm:mx-6 mt-2 overflow-hidden">
        {/* torn top edge — the magic notebook page rips open into the adventure */}
        <svg viewBox="0 0 1200 34" className="absolute top-0 left-0 w-full h-7" preserveAspectRatio="none" aria-hidden>
          <path
            d="M0 30 L46 16 L92 28 L140 12 L188 26 L240 10 L288 24 L292 40 L0 40 Z M240 10 L292 24 L400 12 L452 26 L500 10 L500 40 L0 40 Z"
            fill="none"
            stroke="none"
          />
          <path
            d="M0 28 L52 14 L104 26 L156 12 L208 26 L260 10 L312 24 L364 12 L416 26 L416 40 L0 40 Z M420 28 L472 14 L524 26 L524 12 L576 24 L628 12 L680 26 L680 12 L732 26 L732 12 L784 26 L784 12 L836 26 L836 12 L888 26 L888 12 L940 26 L940 12 L996 26 L1000 28 L1000 40 L0 40 Z"
            fill="#f5f0e1"
            stroke="#2b2a33"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </svg>
        {/* per-chapter goal hint — always visible, never covering characters */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
          <span className="character-badge !shadow-none text-[11px] font-bold text-[#2b2a33]" style={{ transform: 'rotate(-0.8deg)' }}>
            {chapter.id === 'ch3-shelves'
              ? '🦘 اقفز فوق المكعبات — المشي عليها يصطدم!'
              : chapter.id === 'ch4-battle'
                ? '⚔️ اقترب من الوحش (داخل الحلقة) ثم اقاتل!'
                : 'صل إلى عباس!'}
          </span>
        </div>
        {chapter.monster && (
          <p className="absolute bottom-1 left-1/2 -translate-x-1/2 doodle-title text-[10px] text-[#2b2a33]/40">
            الحلقة المتقطعة = نطاق الضربة (مسافة ٥)
          </p>
        )}

        {/* background scribbles — sun, clouds, play lines: everything drawn by a kid */}

        {/* background scribbles — sun, clouds, play lines: everything drawn by a kid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <filter id="adventureWiggle">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="11" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" />
            </filter>
          </defs>
          <g style={{ filter: 'url(#adventureWiggle)' }} stroke="#2b2a33" fill="none" strokeLinecap="round">
            {/* scribbled sun — top right */}
            <g transform="translate(930, 58)" opacity="0.75">
              <circle r="26" fill="#ffd93d" stroke="#2b2a33" strokeWidth="3" />
              <path d="M0 -40 L0 -50 M38 -10 l9 3 M28 -28 l8 -7 M-30 -14 l-9 -7 M32 12 l10 3 M-32 10 l-10 2 M-20 30 l-8 4 M20 -32 l6 -8" stroke="#2b2a33" strokeWidth="3" strokeLinecap="round" />
            </g>
            {/* scribbled cloud 1 */}
            <path d="M120 70 q10 -22 34 -16 q8 -18 30 -10 q20 -8 26 10 q20 2 12 18 q-40 8 -100 4 q-8 -6 0 -8 Z" fill="#fff" stroke="#2b2a33" strokeWidth="2.6" opacity="0.9" />
            {/* scribbled cloud 2 */}
            <path d="M420 44 q8 -16 26 -12 q10 -14 26 -4 q16 -4 18 12 q14 4 6 14 q-28 6 -52 2 q-10 -4 -4 -10 q-8 -2 0 -6 Z" fill="#fff" stroke="#2b2a33" strokeWidth="2.4" />
            {/* flying play lines */}
            <path d="M200 40 q14 6 28 0 q-12 10 -28 0" fill="none" stroke="#ff6b6b" strokeWidth="2" opacity="0.35" />
            <path d="M640 96 q16 8 32 0 q-16 10 -28 0" stroke="#4d96ff" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M540 34 q10 8 22 2" stroke="#6bcb77" strokeWidth="2" />
            <path d="M760 96 q10 8 22 4" stroke="#ff6b9d" strokeWidth="1.6" />
          </g>
        </svg>

          {/* crayon squiggle ground */}
          <svg
            className="absolute left-2 right-2 bottom-[24%] w-[calc(100%-2rem)] h-6"
            viewBox="0 0 1000 24"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M8 18 Q 60 6 110 18 T 220 16 T 330 20 T 330 18 T 440 16 T 550 20 T 660 16 T 660 18 T 770 20 T 880 14 T 890 18 T 995 18"
              fill="none"
              stroke="#2b2a33"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: 'url(#adventureWiggle)' }}
            />
            <path d="M8 22 Q 250 30 500 22 T 992 22 L 1000 34 Q 500 34 8 26 Z" fill="#e8dfc8" opacity="0.65" />
          </svg>

          {/* obstacle — hand-scribbled paper cubes (drawn only when present) */}
          {chapter.stage.obstacles.map((o, i) => (
            <div
              key={i}
              className="absolute bottom-[calc(24%+6px)] w-14 select-none"
              style={{ left: `${(o.at / chapter.stage.length) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <svg viewBox="0 0 60 56" className="w-full h-auto doodle-wiggly">
                <path
                  d="M8 26 L30 18 L52 26 L54 48 L30 56 L6 50 L6 24 L26 30 L30 34 L30 54 L52 50 L52 26 L30 18 L10 26 Z"
                  fill="#e8c98f"
                  stroke="#2b2a33"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <path d="M30 22 L30 46 L52 46" fill="none" stroke="#2b2a33" strokeWidth="2.4" opacity="0.7" />
              </svg>
            </div>
          ))}

          {/* the scrap villain — BIG and scary, chases waraki, scatters on win.
              The dashed fight ring shows the strike range (5 units) */}
          {monsterPct !== null && (
            <div
              className={`absolute bottom-[calc(24%+4px)] w-24 sm:w-28 select-none ${state.status === 'running' && !state.monsterShattered ? 'monster-crawl' : ''} ${state.status === 'won' && state.monsterShattered ? 'monster-shatter' : ''}`}
              style={{ left: `${monsterPct}%`, transform: 'translateX(-50%)' }}
            >
              {/* fight range ring — dashed circle showing where the strike lands */}
              {chapter.monster && !state.monsterShattered && state.status !== 'won' && (
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-dashed border-[#ff6b6b]/50 pointer-events-none"
                  style={{ width: '170px', height: '90px', opacity: state.status === 'running' ? 0.55 : 0.3 }}
                />
              )}
              <svg viewBox="0 0 120 104" className="w-full h-auto" style={{ filter: 'url(#adventureWiggle)' }} aria-label={chapter.monster?.labelAr}>
                {/* pencil hatch ground shadow */}
                <g className="adventure-hatch" stroke="#2b2a33" strokeWidth="1.6">
                  <path d="M18 108 l10 -4 M34 96 l10 -2 M52 102 l10 -2 M70 96 l10 -3 M88 96 l9 -3 M42 96 l9 -2 M62 96 l8 -2" />
                </g>
                {/* torn scrap body — bigger, darker, meaner jagged paper */}
                <path
                  d="M16 30 L34 14 L52 20 L72 8 L90 20 L104 18 L96 40 L104 44 L98 52 L104 66 L92 84 L74 96 L52 92 L44 106 L28 80 L14 78 L16 58 L2 48 L14 26 Z"
                  fill="#a8896f"
                  stroke="#2b2a33"
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                />
                {/* inner shading hatches — darker paper folds */}
                <g stroke="#2b2a33" strokeWidth="1.2" opacity="0.18">
                  <path d="M26 30 l10 4 M60 20 l14 6 M72 60 l10 -4 M30 66 l12 2 M64 74 l8 -6 M24 62 l9 -3" />
                </g>
                {/* glowing red menace behind the eyes */}
                <circle cx="44" cy="52" r="15" fill="rgba(255,80,80,0.16)" />
                <circle cx="74" cy="58" r="16" fill="rgba(255,80,80,0.14)" />
                {/* big slanted furious eyes */}
                <path d="M28 42 l14 6 M92 36 l-12 6" stroke="#2b2a33" strokeWidth="4" strokeLinecap="round" />
                <circle cx="36" cy="56" r="6" fill="#2b2a33" />
                <circle cx="74" cy="72" r="6.5" fill="#2b2a33" />
                <circle cx="32" cy="52" r="1.6" fill="#fff" />
                <circle cx="71" cy="55" r="1.3" fill="#fff" />
                {/* wide OPEN toothy mouth — jagged paper teeth */}
                <path
                  d="M28 66 L34 60 L34 72 L40 66 L44 72 L48 55 L52 62 L58 52 L64 60 L72 58 L76 60 L72 66 L60 66 L48 70 L38 68 L30 68 Z"
                  fill="#3a2626"
                  stroke="#2b2a33"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <path d="M32 66 L34 62 L37 68 L40 66" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
                {/* furious brows */}
                <path d="M30 44 l14 -5 M88 44 l-13 6" stroke="#2b2a33" strokeWidth="3.2" strokeLinecap="round" />
                {/* clawed arms reaching toward waraki */}
                <path d="M96 50 L112 42 M116 40 l7 -3 M113 44 l9 -1 M112 48 l9 1" stroke="#2b2a33" strokeWidth="3" strokeLinecap="round" />
                <path d="M30 54 L14 52 M16 56 l-8 2 M18 50 l-9 -3" stroke="#2b2a33" strokeWidth="2.6" strokeLinecap="round" fill="none" />
                {/* jagged crawl legs */}
                <path d="M44 110 l-5 12 M70 106 l5 -9 M86 100 l6 -8 M30 100 l-5 6" stroke="#2b2a33" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
              {/* threat cry bubble while chasing */}
              {state.status === 'running' && (
                <span
                  className="character-badge !shadow-none absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#ff6b6b] whitespace-nowrap"
                  style={{ animation: 'warakiNarrPop 0.4s ease-out, threatPulse 3s ease-in-out infinite' }}
                >
                  سأمسكك!
                </span>
              )}
            </div>
          )}

          {/* abbas — hand-scribbled paper boy (crayon drawing, not emoji) */}
          <div
            className="absolute bottom-[calc(24%+2px)] w-14 sm:w-16 select-none"
            style={{ left: `${abbasPct}%`, transform: 'translateX(-50%)' }}
          >
            <svg viewBox="0 0 90 130" className="abbass-doodle w-full h-auto" style={{ filter: 'url(#adventureWiggle)' }} aria-label="عباس">
              {/* pencil hatch shadow — hand-drawn ground shadow */}
              <g className="adventure-hatch" stroke="#2b2a33" strokeWidth="1.4">
                <path d="M18 92 l8 -3 M22 82 l9 -2 M30 82 l8 -2 M46 82 l8 -1 M52 82 l7 -2 M28 92 l9 -2 M44 92 l8 -1 M24 88 l8 -2 M48 90 l7 -1" />
              </g>
              {/* open-stroke pencil head — slightly broken line like a hand sketch */}
              <circle cx="40" cy="22" r="14" fill="rgba(255,255,255,0.6)" stroke="#2b2a33" strokeWidth="2.8" strokeDasharray="70 6 50 3" strokeLinecap="round" />
              {/* messy scribbled hair — kept (kid-drawing identity) */}
              <path d="M52 12 q-6 -10 -13 -3 q-6 -11 -15 -3 q-9 -7 -16 1 q-7 -3 -8 7" fill="none" stroke="#2b2a33" strokeWidth="3" strokeLinecap="round" />
              {/* dot eyes + simple smile (pencil figure style) */}
              <circle cx="35" cy="20" r="1.6" fill="#2b2a33" />
              <circle cx="42" cy="21" r="1.5" fill="#2b2a33" />
              <path d="M35 25 Q40 30 46 24" fill="none" stroke="#2b2a33" strokeWidth="2.2" strokeLinecap="round" />
              {/* open pencil trunk — centre stroke instead of filled body */}
              <path d="M40 36 L40 62" stroke="#2b2a33" strokeWidth="3" strokeLinecap="round" />
              {/* shirt hint — shoulder lines + light blue hatch only */}
              <path d="M27 44 Q40 39 54 39" fill="none" stroke="#2b2a33" strokeWidth="2.4" strokeLinecap="round" />
              <g stroke="#4d96ff" strokeWidth="1.5" opacity="0.4" strokeLinecap="round">
                <path d="M31 42 l16 2 M30 46 l17 0 M31 50 l16 1 M33 50 l15 1" />
              </g>
              {/* arms — curved pencil strokes, right one waving hello */}
              <path d="M28 40 Q19 48 21 58" fill="none" stroke="#2b2a33" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M52 38 Q62 44 65 33" fill="none" stroke="#2b2a33" strokeWidth="2.6" strokeLinecap="round" />
              {/* open-stroke legs + little shoes */}
              <path d="M38 62 L33 82 M42 62 L47 82" stroke="#2b2a33" strokeWidth="3" strokeLinecap="round" />
              <path d="M28 84 q-4 3 1 5 M31 84 l7 0 M41 84 l6 0 M51 82 l3 -3" stroke="#2b2a33" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </svg>
            <span className="character-badge absolute -top-9 left-1/2 -translate-x-1/2 text-xs font-bold text-[#2b2a33] whitespace-nowrap">
              عباس
            </span>
          </div>

          {/* Waraki — walks/jumps the stage (left% axis, unified with abbas) */}
          <div
            className="absolute bottom-[calc(24%+2px)] transition-all duration-200 ease-linear"
            style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
          >
            <span className="character-badge absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-[#2b2a33] whitespace-nowrap z-10">
              ورقي
            </span>
            <div
              className={
                state.jumping
                  ? 'waraki-jump-arc'
                  : state.striking
                    ? 'fight-strike'
                    : state.status === 'running'
                      ? 'waraki-stage-walk'
                      : undefined
              }
            >
              <svg viewBox="0 0 200 150" className="w-16 sm:w-20 h-auto">
                {/* pencil hatch shadow — hand-drawn shadow under the hero */}
                <g className="adventure-hatch" stroke="#2b2a33" strokeWidth="1.6">
                  <path d="M60 140 l10 -4 M74 142 l10 -3 M92 138 l10 -3 M96 138 l9 -2 M92 130 l10 -2 M40 134 l9 -3 M88 140 l8 -2" />
                </g>
                {/* mini waraki — simplified for the stage */}
                <path
                  d="M100 21 L 116 19 L 130 22 L 128 30 L 141 26 L 152 30 L 149 36 L 160 34 L 166 44 L 154 40 L 158 50 L 166 48 L 170 52 L 163 50 L 172 62 L 165 56 L 168 68 L 156 62 L 160 70 L 168 74 L 162 78 L 174 76 L 170 82 L 160 82 L 166 90 L 152 84 L 158 92 L 170 96 L 160 96 L 150 100 L 160 100 L 150 102 L 138 96 L 152 102 L 128 108 L 146 116 L 128 122 L 118 112 L 106 124 L 78 122 L 70 106 L 52 120 L 34 106 L 68 88 L 40 104 L 30 84 L 58 66 L 42 60 L 54 22 L 86 18 Z"
                  fill="#b8f0d8"
                  stroke="#2b2a33"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path d="M87 28 L92 8 Q100 4 108 8 L113 28 Z" fill="#ffd93d" stroke="#2b2a33" strokeWidth="2.5" strokeLinejoin="round" />
                <circle cx="82" cy="64" r="12" fill="#fff" stroke="#2b2a33" strokeWidth="3" />
                <circle cx="85" cy="66" r="6" fill="#2b2a33" />
                <circle cx="120" cy="60" r="12" fill="#fff" stroke="#2b2a33" strokeWidth="3" />
                <circle cx="124" cy="62" r="6" fill="#2b2a33" />
                <path d="M85 82 Q100 98 116 80" fill="#fff" stroke="#2b2a33" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            {state.status === 'won' && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl waraki-stage-jump">🎉</span>
            )}
          </div>

        {/* engine message (lose hint) */}
        {state.status === 'lost' && state.message && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="doodle-wiggly px-4 py-2 bg-[#fff5f5] border-[2.5px] border-[#2b2a33]" style={{ borderRadius: '14px 20px 12px 18px / 16px 12px 20px 12px', boxShadow: '3px 4px 0 rgba(43,42,51,0.18)' }}>
              <p className="doodle-title text-[#2b2a33] text-xs sm:text-sm font-bold">{state.message}</p>
            </div>
          </div>
        )}
        {/* win overlay — magic reward. Appears 1.2s AFTER the win so the
            kid watches the comic paper-scatter first (no caption covering it) */}
        {state.status === 'won' && showReward && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#2b2a33]/10 z-30">
            <div className="doodle-wiggly bg-[#fffef7] border-[3px] border-[#2b2a33] px-7 py-5 text-center mx-4" style={{ boxShadow: '5px 6px 0 rgba(43,42,51,0.25)', borderRadius: '20px 28px 18px 26px/22px 18px 28px 18px', animation: 'warakiNarrPop 0.45s ease-out' }}>
              <p className="doodle-title text-lg font-bold text-[#2b2a33] mb-1">
                {chapter.reward.icon} {chapter.reward.titleAr}
              </p>
              <p className="doodle-title text-[#2b2a33]/80 text-sm font-semibold leading-relaxed mb-2">
                {chapter.reward.bodyAr}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                {chapterIdx < WARAKI_CHAPTERS.length - 1 ? (
                  <button
                    onClick={() => {
                      SoundFXManager.playPaperTorn();
                      setChapterIdx((i) => i + 1);
                    }}
                    className="doodle-button doodle-title text-sm font-bold px-5 py-2.5 bg-[#6bcb77] text-white"
                  >
                    📖 الفصل التالي!
                  </button>
                ) : (
                  <p className="doodle-title text-[#2b2a33]/50 text-[10px]">الفصول القادمة قريباً… 📖</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== Controls: arrow buttons + program strip (one queue for both modes) ===== */}
      <div className="flex-shrink-0 bg-[#f5f0e1]/95 border-t-2 border-[#2b2a33]/20 px-3 py-2.5 flex flex-col gap-2">
        {/* Command strip */}
        <div className="flex items-center gap-2 min-h-[56px] overflow-x-auto bg-[#fffef8]/80 rounded-2xl border-2 border-dashed border-[#2b2a33]/25 px-2 py-1.5">
          {commands.length === 0 && (
            <span className="doodle-title text-[#2b2a33]/45 text-xs px-2">برنامجك فارغ — أضف أوامر من الأسفل 👇</span>
          )}
          {commands.map((c, i) => (
            <button
              key={c.id}
              onClick={() => cycleCommand(c.id)}
              onContextMenu={(e) => { e.preventDefault(); removeCommand(c.id); }}
              className={`shrink-0 relative flex items-center gap-1.5 px-3 py-2 border-[2.5px] border-[#2b2a33] rounded-[12px_18px_12px_18px/16px_12px_18px_12px] transition-transform active:scale-95 ${state.status === 'running' && state.activeIndex === i ? 'waraki-card-active' : ''}`}
              style={{
                background:
                  c.action === 'jump2' ? '#ffe985'
                  : c.action === 'jump' ? '#d4f7c5'
                  : c.action === 'run' ? '#d4f7c5'
                  : c.action === 'fight' ? '#ffd6d6'
                  : c.action === 'walk' ? '#fff5b8' : '#d6e4ff',
                boxShadow: '2px 3px 0 rgba(43,42,51,0.2)',
              }}
            >
              <span className="text-lg leading-none">{c.action === 'walk' ? '🚶' : c.action === 'run' ? '🏃' : c.action === 'jump' ? '🦘' : c.action === 'jump2' ? '🦘🦘' : c.action === 'fight' ? '⚔️' : '✋'}</span>
              <span className="doodle-title text-xs font-bold text-[#2b2a33]">
                {c.action === 'stop' ? 'توقف'
                  : c.action === 'run' ? `اركض ${STEP_LABELS[c.steps] || c.steps}`
                  : c.action === 'walk' ? `امشِ ${STEP_LABELS[c.steps] || c.steps}`
                  : c.action === 'jump' ? 'اقفز!'
                  : c.action === 'jump2' ? 'اقفز مزدوج!'
                  : 'قاتل!'}
              </span>
            </button>
          ))}
          {commands.length === 0 && (
            <span className="doodle-title text-[#2b2a33]/40 text-xs mr-auto">برنامجك فارغ — اختر أوامر من الأسفل!</span>
          )}
        </div>

        {/* Static guidance (instead of tooltips that cover the stage) */}
        <p className="doodle-title text-center text-[10px] text-[#2b2a33]/45 -mt-1">
          انقر على بطاقة لتغيير خطواتها (1-5) · زر الفأرة الأيمن يحذفها
        </p>

        {/* Action buttons (arrows for the young) — sticker identity.
            Double jump: locked until ch3 done (stored), shown as a sealed card */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {chapter.availableActions.map((a) => (
            <button
              key={a}
              onClick={() => addCommand(a)}
              disabled={state.status === 'running'}
              className={`doodle-button doodle-title text-base font-bold px-5 py-3 disabled:opacity-40 ${
                a === 'fight' ? 'bg-[#ff9f43] text-white'
                : a === 'run' ? 'bg-[#6bcb77] text-white'
                : a === 'jump' ? 'bg-[#ff6b9d] text-white'
                : a === 'jump2' ? 'bg-gradient-to-l from-[#ffd93d] to-[#ff9f43] text-[#2b2a33]'
                : a === 'walk' ? 'bg-[#ffd93d] text-[#2b2a33]' : 'bg-[#d6e4ff] text-[#2b2a33]'
              }`}
            >
              {a === 'walk' ? '⬅️ امشِ' : a === 'run' ? '🏃 اركض!' : a === 'jump' ? '🦘 اقفز!' : a === 'jump2' ? '🦘🦘 قفزة مزدوجة!' : a === 'fight' ? '⚔️ اقاتل!' : '✋ توقف'}
            </button>
          ))}
        </div>

        {/* Run / clear — sticker identity */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleRun}
            disabled={state.status === 'running' || !commands.length}
            className="doodle-button doodle-title text-base font-bold px-6 py-2.5 bg-gradient-to-l from-[#ff6b6b] to-[#ff9f43] text-white disabled:opacity-40"
          >
            <Play className="w-4 h-4 inline ml-1" /> شغّل ورقي!
          </button>
          <button
            onClick={() => { setCommands([]); handleRetry(); }}
            className="doodle-button doodle-title text-sm font-bold px-4 py-2.5 bg-white text-[#2b2a33]"
          >
            <Trash2 className="w-4 h-4 inline" /> امسح
          </button>
          {(state.status === 'lost' || state.status === 'won') && (
            <button
              onClick={handleRetry}
              className="doodle-button bg-[#6bcb77] text-white text-sm font-bold px-4 py-2.5"
            >
              <RotateCcw className="w-4 h-4 inline" /> إعادة فورية
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
