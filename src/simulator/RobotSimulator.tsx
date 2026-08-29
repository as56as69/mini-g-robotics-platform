import React, { useEffect, useRef, useState } from 'react';
import { RobotState } from '../types/robot';
import { Sparkles, Eye, Volume2, Cpu, RefreshCw } from 'lucide-react';

interface Props {
  state: RobotState;
}

/* ============ Premium palette (matches 3D edition) ============ */
const ACCENT = '#38bdf8';

export const RobotSimulator: React.FC<Props> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [arenaMode, setArenaMode] = useState<'free' | 'track' | 'maze'>('free');
  const posRef = useRef({ x: 250, y: 320, heading: -Math.PI / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (arenaMode === 'track') {
        drawTrackArena(ctx, canvas.width, canvas.height);
      } else if (arenaMode === 'maze') {
        drawMazeArena(ctx, canvas.width, canvas.height);
      } else {
        drawArenaBackground(ctx, canvas.width, canvas.height);
      }

      if (state.model === 'mini_g') {
        const speedL = state.g_wheelSpeedL || 0;
        const speedR = state.g_wheelSpeedR || 0;
        const linearVel = (speedL + speedR) / 60;
        const angularVel = (speedR - speedL) / 900;

        posRef.current.heading += angularVel;
        posRef.current.x += Math.cos(posRef.current.heading) * linearVel;
        posRef.current.y += Math.sin(posRef.current.heading) * linearVel;

        posRef.current.x = Math.max(70, Math.min(canvas.width - 70, posRef.current.x));
        posRef.current.y = Math.max(90, Math.min(canvas.height - 70, posRef.current.y));
      }

      if (state.model === 'mini_gf') {
        drawMiniGF(ctx, canvas.width / 2, canvas.height / 2, state);
      } else if (state.model === 'mini_gm') {
        drawMiniGM(ctx, canvas.width / 2, canvas.height / 2, state);
      } else {
        drawMiniGSpatial(ctx, posRef.current.x, posRef.current.y, posRef.current.heading, state);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [state, arenaMode]);

  const resetPosition = () => {
    posRef.current = { x: 250, y: 320, heading: -Math.PI / 2 };
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 flex items-center gap-2 shadow-lg pointer-events-auto">
          <div className={`w-2.5 h-2.5 rounded-full ${state.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs font-bold text-slate-200">
            {state.connected ? 'المحاكي اللحظي المتزامن 🌐' : 'وضع المعاينة الافتراضية'}
          </span>
        </div>

        {state.model === 'mini_g' && (
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 pointer-events-auto shadow-md">
            <button
              onClick={() => setArenaMode('free')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                arenaMode === 'free' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ساحة حرة
            </button>
            <button
              onClick={() => setArenaMode('track')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                arenaMode === 'track' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              تتبع المسار 🏁
            </button>
            <button
              onClick={() => setArenaMode('maze')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                arenaMode === 'maze' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              المتاهة 🧱
            </button>
            <button
              onClick={resetPosition}
              className="p-1 text-slate-400 hover:text-emerald-400 transition"
              title="إعادة الروبوت لنقطة البداية"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 text-xs font-semibold text-slate-300">
          {state.model === 'mini_gf' && (
            <span className="flex items-center gap-1">
              اللون: <span className="w-3 h-3 rounded-full inline-block border border-white/40" style={{ backgroundColor: state.gf_ledColor }} />
            </span>
          )}
          {state.model === 'mini_gm' && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              العيون: {state.gm_expression}
            </span>
          )}
          {state.model === 'mini_g' && (
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              الشخصية: {state.g_activePersona}
            </span>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} width={500} height={450} className="w-full h-full object-contain" />

      {state.model === 'mini_g' && state.g_isTalking && (
        <div className="absolute bottom-4 left-6 right-6 z-20 bg-purple-600/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-xl border border-purple-400/40 animate-bounce flex items-center gap-2">
          <Volume2 className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-bold truncate">{state.g_speechText || 'مرحباً بكم يا أصدقائي!'}</p>
        </div>
      )}
    </div>
  );
};

// ------------------- ARENA BACKGROUNDS ------------------- //

function drawArenaBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  const step = 30;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawTrackArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawArenaBackground(ctx, w, h);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 28;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 160, 110, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 12px Cairo';
  ctx.fillText('🏁 خط البداية / النهاية', w / 2 - 50, h / 2 + 125);
}

function drawMazeArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawArenaBackground(ctx, w, h);
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 2;
  roundRect(ctx, 120, 100, 40, 140, 8);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, 280, 180, 120, 40, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(380, 110, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px Cairo';
  ctx.fillText('⭐', 374, 115);
}

// ------------------- MODEL RENDERERS ------------------- //

/* ======== Mini G-F: Premium Keychain Medal ======== */
function drawMiniGF(ctx: CanvasRenderingContext2D, cx: number, cy: number, state: RobotState) {
  ctx.save();
  ctx.translate(cx, cy);

  if (state.gf_vibrating) {
    ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  }

  // Keyring (polished silver)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -98, 19, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  roundRect(ctx, -5, -80, 10, 20, 4);
  ctx.fill();

  // Body: glossy white pill with gradient
  const bodyGrad = ctx.createLinearGradient(0, -62, 0, 62);
  bodyGrad.addColorStop(0, '#ffffff');
  bodyGrad.addColorStop(0.55, '#eef2f7');
  bodyGrad.addColorStop(1, '#d7dfeb');
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, -72, -62, 140, 122, 34);
  ctx.fill();
  // Top glossy highlight
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  roundRect(ctx, -62, -56, 92, 30, 15);
  ctx.fill();

  // Face inset (dark glass)
  ctx.fillStyle = '#050912';
  roundRect(ctx, -52, -40, 104, 82, 18);
  ctx.fill();

  // LED glowing eyes (rounded capsules)
  const glowColor = state.gf_ledColor || '#22c55e';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 20;
  ctx.fillStyle = glowColor;
  roundRect(ctx, -36, -24, 16, 26, 8);
  ctx.fill();
  roundRect(ctx, 21, -24, 16, 26, 8);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Smile (glowing, subtle)
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -4, 10, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // Side antennas (white nubs)
  ctx.fillStyle = '#f1f5f9';
  roundRect(ctx, -80, -12, 14, 18, 9);
  ctx.fill();
  roundRect(ctx, 66, -12, 14, 18, 9);
  ctx.fill();

  ctx.restore();
}

/* ======== Mini G-M: Elegant Desktop Companion (REDESIGNED) ======== */
function drawMiniGM(ctx: CanvasRenderingContext2D, cx: number, cy: number, state: RobotState) {
  ctx.save();
  ctx.translate(cx, cy + 30);

  // ===== Desktop stand (weighted circular base) =====
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(0, 128, 64, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base glow ring
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 106, 50, 12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ===== NECK (elegant servo) =====
  ctx.fillStyle = '#475569';
  roundRect(ctx, -14, 28, 30, 42, 7);
  ctx.fill();

  // ===== ROTATING HEAD GROUP =====
  ctx.save();
  ctx.translate(0, -32);
  ctx.rotate((state.gm_headAngle * Math.PI) / 180);

  // Head: premium white rounded casing with gradient
  const headGrad = ctx.createLinearGradient(0, -100, 0, 30);
  headGrad.addColorStop(0, '#ffffff');
  headGrad.addColorStop(1, '#dbe3ec');
  ctx.fillStyle = headGrad;
  roundRect(ctx, -70, -100, 148, 122, 30);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top glossy highlight
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  roundRect(ctx, -58, -92, 84, 26, 13);
  ctx.fill();

  // Face glass (dark inset)
  ctx.fillStyle = '#030812';
  roundRect(ctx, -54, -68, 120, 78, 18);
  ctx.fill();

  // Live expression eyes (with blink)
  drawExpressionEyes(ctx, state.gm_expression);

  // Antenna ball
  ctx.fillStyle = ACCENT;
  ctx.shadowColor = ACCENT;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, -108, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -104);
  ctx.lineTo(0, -80);
  ctx.stroke();

  ctx.restore(); // end head rotation

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mini G-M', 0, 128);

  ctx.restore();
}

/* ======== Mini G: Humanoid in Arena ======== */
function drawMiniGSpatial(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, state: RobotState) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.52, 0.55);

  // Base (white rounded)
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  roundRect(ctx, -82, 100, 170, 38, 18);
  ctx.fill();
  ctx.stroke();

  // Wheels (dark tires, light hubs)
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, -95, 96, 20, 44, 10);
  roundRect(ctx, 76, 96, 20, 44, 10);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  roundRect(ctx, -90, 108, 10, 18, 5);
  roundRect(ctx, 82, 108, 10, 18, 5);
  ctx.fill();

  // Torso (white premium)
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  roundRect(ctx, -58, -28, 132, 102, 26);
  ctx.fill();
  ctx.stroke();

  // Core glow
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(0, 32, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Arms: shoulder pivots with natural swing
  for (const s of [-1, 1]) {
    const angle = s === -1 ? state.g_armLeftAngle : state.g_armRightAngle;
    ctx.save();
    ctx.translate(s * 74, -12);
    ctx.rotate((s * -(angle || 0) * Math.PI) / 180);
    // upper arm
    ctx.fillStyle = '#eef2f7';
    roundRect(ctx, -11, 0, 15, 42, 9);
    ctx.fill();
    // elbow
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 44, 7, 0, Math.PI * 2);
    ctx.fill();
    // hand (accent)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 74, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Head (white rounded, friendly)
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  roundRect(ctx, -68, -128, 140, 92, 28);
  ctx.fill();
  ctx.stroke();

  drawPersonaFace(ctx, state.g_activePersona, state.g_isTalking);

  ctx.restore();
}

// ------------------- SUB-RENDERERS ------------------- //

function drawExpressionEyes(ctx: CanvasRenderingContext2D, expr: string) {
  const blinkCycle = Date.now() % 3400 < 140;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 15;

  if (expr === 'love' || expr === '2') {
    drawHeart(ctx, -28, -40, 14);
    drawHeart(ctx, 28, -40, 14);
  } else if (expr === 'sleepy' || expr === '3') {
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-42, -35);
    ctx.lineTo(-14, -35);
    ctx.moveTo(14, -35);
    ctx.lineTo(42, -35);
    ctx.stroke();
  } else if (expr === 'surprised' || expr === '1') {
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(-28, -38, 16, 0, Math.PI * 2);
    ctx.arc(28, -38, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (blinkCycle) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-40, -35);
    ctx.lineTo(-16, -35);
    ctx.moveTo(16, -35);
    ctx.lineTo(40, -35);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#7dd3fc';
    roundRect(ctx, -40, -50, 24, 30, 8);
    ctx.fill();
    roundRect(ctx, 16, -50, 24, 30, 8);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function drawPersonaFace(ctx: CanvasRenderingContext2D, persona: string, isTalking: boolean) {
  const accent =
    persona === 'alkhwarizmi' || persona === '0'
      ? '#fbbf24'
      : persona === 'astronaut' || persona === '1'
      ? '#22d3ee'
      : '#a855f7';

  ctx.textAlign = 'center';

  // Happy arc eyes
  ctx.save();
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-24, -62, 14, Math.PI * 1.15, Math.PI * 1.85);
  ctx.moveTo(46, -62);
  ctx.arc(26, -68, 15, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();

  // Persona name chip
  ctx.fillStyle = accent;
  roundRect(ctx, -36, -122, 70, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px Cairo';
  ctx.fillText(
    persona === '0' || persona === 'alkhwarizmi'
      ? '📜 الخوارزمي'
      : persona === 'astronaut' || persona === '1'
      ? '🚀 رائد الفضاء'
      : persona === 'einstein'
      ? '💡 أينشتاين'
      : '🤖 ميني جي',
    0,
    -114
  );

  // Mouth (lip-sync)
  if (isTalking) {
    ctx.fillStyle = '#ec4899';
    const mouthHeight = 10 + Math.sin(Date.now() / 80) * 8;
    roundRect(ctx, -18, -40, 36, mouthHeight, 6);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -52, 20, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x, y - size / 2, x - size, y - size / 2, x - size, y);
  ctx.bezierCurveTo(x - size, y + size / 2, x, y + size, x, y + size);
  ctx.bezierCurveTo(x, y + size, x + size, y + size / 2, x + size, y);
  ctx.bezierCurveTo(x + size, y - size / 2, x, y - size / 2, x, y);
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
