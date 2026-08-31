import React, { useState, useEffect } from 'react';
import { RobotModelType } from '../types/robot';
import { bleService } from '../ble/BLEManager';
import { CMD_CODES } from '../ble/Protocol';
import { SoundFXManager } from '../ble/SoundFX';
import {
  loadFaceLibrary, saveFace, deleteFace, setCurrentFace, loadCurrentFace, MAX_FACES,
  type SaveResult,
} from '../services/pixelFaceStore';
import { Grid, Play, RotateCcw, Copy, Check, Trash2, Tv, Save, FolderOpen } from 'lucide-react';

interface Props {
  model: RobotModelType;
}

function emptyGrid() {
  return Array(8).fill(null).map(() => Array(8).fill(false));
}

function gridToBytes(grid: boolean[][]): number[] {
  const bytes: number[] = [];
  for (let r = 0; r < 8; r++) {
    let b = 0;
    for (let c = 0; c < 8; c++) {
      if (grid[r][c]) b |= 1 << (7 - c);
    }
    bytes.push(b);
  }
  return bytes;
}

function bytesToGrid(bytes: number[]): boolean[][] {
  const g = emptyGrid();
  for (let r = 0; r < 8; r++) {
    const row = bytes[r] || 0;
    for (let c = 0; c < 8; c++) g[r][c] = !!(row & (1 << (7 - c)));
  }
  return g;
}

/** 8x8 bitmap presets — each row is [row, col] pairs of lit pixels */
const PRESETS: Record<string, [number, number][]> = {
  happy: [
    [2,2],[2,5],[3,2],[3,5],[5,1],[5,6],[6,2],[6,3],[6,4],[6,5],
  ],
  heart: [
    [1,2],[1,5],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],
    [3,1],[3,2],[3,3],[3,4],[3,5],[3,6],
    [4,2],[4,3],[4,4],[4,5],[5,3],[5,4],[6,3],[6,4],
  ],
  wink: [
    [2,2],[3,2],[2,4],[2,5],[2,6],[5,1],[5,6],[6,2],[6,3],[6,4],[6,5],
  ],
  star: [
    [1,3],[1,4],[2,3],[2,4],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],
    [4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[5,2],[5,5],[6,1],[6,6]
  ],
  angry: [
    [1,1],[2,2],[2,3],[1,6],[1,5],[2,5],[2,4],[3,2],[3,5],
    [5,2],[5,3],[5,4],[5,5],[4,3],[4,4],[3,3],[3,4]
  ],
  sun: [
    [1,3],[1,4],[2,2],[2,3],[2,4],[2,5],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],
    [4,3],[4,4],[5,3],[5,4],[2,0],[2,7],[4,0],[4,7],[0,3],[0,4],[7,3],[7,4]
  ],
  brokenheart: [
    [1,1],[1,2],[1,5],[1,6],[2,1],[2,2],[2,5],[2,6],
    [3,1],[3,3],[3,6],[4,2],[4,4],[4,6],[5,2],[5,5],[6,3],[6,4]
  ],
  rocket: [
    [0,3],[1,2],[1,3],[1,4],[1,5],[2,2],[2,5],[3,2],[3,5],
    [4,2],[4,3],[4,4],[4,5],[6,1],[6,2],[6,5],[6,6]
  ],
};

export const PixelFaceDesignerModal: React.FC<Props> = ({ model }) => {
  const [grid, setGrid] = useState<boolean[][]>(() => {
    // Restore the last autosaved design (falls back to a cute smiley)
    const saved = loadCurrentFace();
    if (saved) return bytesToGrid(saved);
    const initial = emptyGrid();
    initial[2][2] = true;
    initial[2][5] = true;
    initial[5][1] = true;
    initial[5][6] = true;
    initial[6][2] = true;
    initial[6][3] = true;
    initial[6][4] = true;
    initial[6][5] = true;
    return initial;
  });
  const [copied, setCopied] = useState(false);
  const [library, setLibrary] = useState<Record<string, number[]>>(() => loadFaceLibrary());
  const [saveName, setSaveName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [faceSeq, setFaceSeq] = useState(0); // bumps when library changes (Blockly dropdown refresh)

  const isGM = model === 'mini_gm';

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 2200);
  };

  // Autosave the board on every change
  const updateGrid = (next: boolean[][]) => {
    setGrid(next);
    setCurrentFace(gridToBytes(next));
  };

  const togglePixel = (r: number, c: number) => {
    SoundFXManager.playClickBeep();
    setGrid(prev => {
      const copy = prev.map(row => [...row]);
      copy[r][c] = !copy[r][c];
      setCurrentFace(gridToBytes(copy));
      return copy;
    });
  };

  const clearGrid = () => {
    SoundFXManager.playClickBeep();
    updateGrid(emptyGrid());
  };

  const loadPreset = (preset: string) => {
    SoundFXManager.playClickBeep();
    const g = emptyGrid();
    const pts = PRESETS[preset] || [];
    pts.forEach(([r, c]) => { if (g[r]) g[r][c] = true; });
    updateGrid(g);
  };

  const handleSaveToLibrary = () => {
    const name = (window.prompt('اسم الوجه (مثال: وجه البطل):') || '').trim();
    if (!name) return;
    const res = saveFace(name, gridToBytes(grid));
    SoundFXManager.playClickBeep();
    if (res === 'ok') {
      setLibrary(loadFaceLibrary());
      setFaceSeq(s => s + 1);
      showToast('حُفظ في المكتبة 💾');
    } else if (res === 'exists') {
      showToast('الاسم موجود — اختر اسماً آخر ⚠️');
    } else if (res === 'full') {
      showToast(`المكتبة ممتلئة (${MAX_FACES}/${MAX_FACES}) — احذف وجهاً أولاً 📚`);
    } else {
      showToast('اكتب اسماً للوجه أولاً ✏️');
    }
  };

  const handleSendToRobot = async () => {
    if (!isGM) return;
    SoundFXManager.playRobotChirp();
    // Encode the 8x8 design as 8 row bytes (MSB = leftmost pixel, same
    // encoding as generateHexBytes) and send them as a custom face.
    const bytes = gridToBytes(grid);
    setCurrentFace(bytes);
    await bleService.sendCommand(CMD_CODES.GM_SET_EXPRESSION, bytes);
    showToast('الوجه معروض الآن 📺');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateHexBytes());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert to C Byte Array for ESP32 OLED / LED Matrix
  const generateHexBytes = () => {
    const bytes: string[] = [];
    for (let r = 0; r < 8; r++) {
      let b = 0;
      for (let c = 0; c < 8; c++) {
        if (grid[r][c]) {
          b |= (1 << (7 - c));
        }
      }
      bytes.push('0x' + b.toString(16).padStart(2, '0').toUpperCase());
    }
    return `const uint8_t custom_face[8] = { ${bytes.join(', ')} };`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-white">
              استوديو رسم وتصميم وجوه الروبوت (8x8 Pixel Matrix Designer)
            </h3>
            <p className="text-[11px] text-slate-400">ارسم عيون وتعبيرات خاصة لتظهر على شاشة الروبوت والـ ESP32</p>
          </div>
        </div>

        <button
          onClick={handleSendToRobot}
          disabled={!isGM}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>إرسال للشاشة اللحظية 📺</span>
        </button>
      </div>

      {!isGM && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-[11px] text-amber-300 font-bold">
          الشاشة البكسلية متاحة في روبوت Mini G-M فقط — بدّل الروبوت من الهيدر لاستخدام الاستوديو.
        </div>
      )}

      {/* Grid Canvas & Presets Column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* 8x8 Matrix Board */}
        <div className="bg-slate-950 p-3 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center gap-1 shadow-inner">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-1">
              {row.map((active, c) => (
                <button
                  key={c}
                  onClick={() => togglePixel(r, c)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all transform active:scale-90 ${
                    active
                      ? 'bg-cyan-400 shadow-md shadow-cyan-400/50 scale-105'
                      : 'bg-slate-900 hover:bg-slate-800 border border-slate-800/80'
                  }`}
                  title={`نقطة (${r}, ${c})`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Preset Controls */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-slate-300">قوالب تعابير جاهزة:</span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => loadPreset('happy')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold transition flex items-center justify-center gap-1"
            >
              <span>😄 سعيد</span>
            </button>
            <button
              onClick={() => loadPreset('heart')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-pink-300 rounded-xl font-bold transition flex items-center justify-center gap-1"
            >
              <span>💖 قلوب</span>
            </button>
            <button
              onClick={() => loadPreset('wink')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold transition flex items-center justify-center gap-1"
            >
              <span>😉 يغمز</span>
            </button>
            <button
              onClick={() => loadPreset('star')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-amber-300 rounded-xl font-bold transition flex items-center justify-center gap-1"
            >
              <span>⭐ نجمة</span>
            </button>
            <button
              onClick={() => loadPreset('angry')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-red-300 rounded-xl font-bold transition flex items-center justify-center gap-1"
            >
              <span>😠 غاضب</span>
            </button>
            <button
              onClick={() => loadPreset('sun')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-yellow-300 rounded-xl font-bold transition flex items-center justify-center gap-1"
            >
              <span>☀️ شمس</span>
            </button>
            <button
              onClick={() => loadPreset('brokenheart')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-rose-300 rounded-xl font-bold transition flex items-center justify-center gap-1"
            >
              <span>💔 قلب مكسور</span>
            </button>
            <button
              onClick={() => loadPreset('rocket')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-indigo-300 rounded-xl font-bold transition flex items-center justify-center gap-1"
            >
              <span>🚀 صاروخ</span>
            </button>
          </div>

          <button
            onClick={clearGrid}
            className="w-full py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 text-xs rounded-xl font-bold transition flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>مسح اللوحة</span>
          </button>
        </div>
      </div>

      {/* Saved faces library */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>مكتبة الوجوه المحفوظة ({Object.keys(library).length}/{MAX_FACES}):</span>
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="اسم الوجه…"
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-32"
            />
            <button
              onClick={handleSaveToLibrary}
              disabled={!saveName.trim()}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold rounded-lg text-[11px] transition active:scale-95"
              title="حفظ التصميم الحالي في المكتبة"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ</span>
            </button>
          </div>
        </div>

        {Object.keys(library).length === 0 ? (
          <div className="text-[11px] text-slate-500 text-center py-2 bg-slate-950 border border-slate-800 rounded-xl">
            لا توجد وجوه محفوظة بعد — ارسم وجهاً واحفظه باسم ليظهر هنا (حتى {MAX_FACES} وجوه).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(library).map(([name, data]) => (
              <div key={name} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5">
                <FaceThumb bytes={data} />
                <span className="text-xs font-bold text-slate-200 truncate flex-1">{name}</span>
                <button
                  onClick={() => { setGrid(bytesToGrid(data)); setCurrentFace(data); SoundFXManager.playClickBeep(); }}
                  className="px-2 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 text-[10px] font-bold transition"
                  title="تحميل على اللوحة"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (window.confirm(`حذف الوجه «${name}» من المكتبة؟`)) { deleteFace(name); setLibrary(loadFaceLibrary()); } }}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                  title="حذف من المكتبة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generated C Array for Arduino Code */}
      <div className="relative bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
        <code className="truncate max-w-[85%]">{generateHexBytes()}</code>
        <button
          onClick={handleCopyCode}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          title="نسخ كود الـ C++"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] bg-slate-950/95 border border-cyan-500/50 text-cyan-200 text-xs font-black px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur whitespace-nowrap flex items-center gap-2">
          <Tv className="w-4 h-4 text-cyan-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

/** Tiny 8x8 preview of a saved face */
function FaceThumb({ bytes }: { bytes: number[] }) {
  return (
    <div className="grid grid-cols-8 gap-[1px] p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
      {Array.from({ length: 64 }).map((_, i) => {
        const r = Math.floor(i / 8);
        const c = i % 8;
        const on = (bytes[r] || 0) & (1 << (7 - c));
        return <span key={i} className={`w-1 h-1 rounded-[1px] ${on ? 'bg-cyan-400' : 'bg-slate-800'}`} />;
      })}
    </div>
  );
}
