import React, { useState } from 'react';
import { RobotModelType } from '../types/robot';
import { bleService } from '../ble/BLEManager';
import { CMD_CODES } from '../ble/Protocol';
import { SoundFXManager } from '../ble/SoundFX';
import { Grid, Sparkles, Download, Play, RotateCcw, Copy, Check } from 'lucide-react';

interface Props {
  model: RobotModelType;
}

export const PixelFaceDesignerModal: React.FC<Props> = ({ model }) => {
  const [grid, setGrid] = useState<boolean[][]>(() => {
    // Initial cute smiley face on 8x8 matrix
    const initial = Array(8).fill(null).map(() => Array(8).fill(false));
    // Eyes
    initial[2][2] = true;
    initial[2][5] = true;
    // Smile
    initial[5][1] = true;
    initial[5][6] = true;
    initial[6][2] = true;
    initial[6][3] = true;
    initial[6][4] = true;
    initial[6][5] = true;
    return initial;
  });

  const [copied, setCopied] = useState(false);

  const togglePixel = (r: number, c: number) => {
    SoundFXManager.playClickBeep();
    setGrid(prev => {
      const copy = prev.map(row => [...row]);
      copy[r][c] = !copy[r][c];
      return copy;
    });
  };

  const clearGrid = () => {
    SoundFXManager.playClickBeep();
    setGrid(Array(8).fill(null).map(() => Array(8).fill(false)));
  };

  const loadPreset = (preset: 'heart' | 'star' | 'happy' | 'wink') => {
    SoundFXManager.playClickBeep();
    const g = Array(8).fill(null).map(() => Array(8).fill(false));
    if (preset === 'heart') {
      [
        [1,2],[1,5],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],
        [3,1],[3,2],[3,3],[3,4],[3,5],[3,6],
        [4,2],[4,3],[4,4],[4,5],[5,3],[5,4],[6,3],[6,4]
      ].forEach(([r, c]) => g[r][c] = true);
    } else if (preset === 'happy') {
      [
        [2,2],[2,5],[3,2],[3,5],[5,1],[5,6],[6,2],[6,3],[6,4],[6,5]
      ].forEach(([r, c]) => g[r][c] = true);
    } else if (preset === 'wink') {
      [
        [2,2],[3,2],[2,4],[2,5],[2,6],[5,1],[5,6],[6,2],[6,3],[6,4],[6,5]
      ].forEach(([r, c]) => g[r][c] = true);
    } else if (preset === 'star') {
      [
        [1,3],[1,4],[2,3],[2,4],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],
        [4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[5,2],[5,5],[6,1],[6,6]
      ].forEach(([r, c]) => g[r][c] = true);
    }
    setGrid(g);
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

  const handleSendToRobot = async () => {
    SoundFXManager.playRobotChirp();
    // Encode the 8x8 design as 8 row bytes (MSB = leftmost pixel, same
    // encoding as generateHexBytes) and send them as a custom face.
    const bytes: number[] = [];
    for (let r = 0; r < 8; r++) {
      let b = 0;
      for (let c = 0; c < 8; c++) {
        if (grid[r][c]) {
          b |= 1 << (7 - c);
        }
      }
      bytes.push(b);
    }
    await bleService.sendCommand(CMD_CODES.GM_SET_EXPRESSION, bytes);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateHexBytes());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition shadow active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>إرسال للشاشة اللحظية 📺</span>
        </button>
      </div>

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
    </div>
  );
};
