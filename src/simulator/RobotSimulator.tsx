import React, { useEffect, useRef, useState } from 'react';
import { RobotState } from '../types/robot';
import { Sparkles, Eye, Volume2, Cpu, Compass, Flag, ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  state: RobotState;
}

export const RobotSimulator: React.FC<Props> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [arenaMode, setArenaMode] = useState<'free' | 'track' | 'maze'>('free');

  // Robot spatial position in Arena for Mini G
  const posRef = useRef({ x: 250, y: 320, heading: -Math.PI / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Chosen Arena Background
      if (arenaMode === 'track') {
        drawTrackArena(ctx, canvas.width, canvas.height);
      } else if (arenaMode === 'maze') {
        drawMazeArena(ctx, canvas.width, canvas.height);
      } else {
        drawArenaBackground(ctx, canvas.width, canvas.height);
      }

      // Update spatial position for Mini G if wheels are turning
      if (state.model === 'mini_g') {
        const speedL = state.g_wheelSpeedL || 0;
        const speedR = state.g_wheelSpeedR || 0;
        const linearVel = (speedL + speedR) / 40;
        const angularVel = (speedR - speedL) / 800;

        posRef.current.heading += angularVel;
        posRef.current.x += Math.cos(posRef.current.heading) * linearVel;
        posRef.current.y += Math.sin(posRef.current.heading) * linearVel;

        // Keep inside bounds
        posRef.current.x = Math.max(60, Math.min(canvas.width - 60, posRef.current.x));
        posRef.current.y = Math.max(60, Math.min(canvas.height - 60, posRef.current.y));
      }

      // Render Active Model Simulator
      if (state.model === 'mini_gf') {
        drawMiniGF(ctx, canvas.width / 2, canvas.height / 2, state);
      } else if (state.model === 'mini_gm') {
        drawMiniGM(ctx, canvas.width / 2, canvas.height / 2, state);
      } else {
        // Mini G inside Arena with spatial coordinates
        drawMiniGSpatial(ctx, posRef.current.x, posRef.current.y, posRef.current.heading, state);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, arenaMode]);

  const resetPosition = () => {
    posRef.current = { x: 250, y: 320, heading: -Math.PI / 2 };
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Simulator Overlay Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 flex items-center gap-2 shadow-lg pointer-events-auto">
          <div className={`w-2.5 h-2.5 rounded-full ${state.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs font-bold text-slate-200">
            {state.connected ? 'المحاكي اللحظي المتزامن 🌐' : 'وضع المعاينة الافتراضية'}
          </span>
        </div>

        {/* Arena Mode Switcher for Mini G / General */}
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

        {/* Telemetry quick status badge */}
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

      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        width={500}
        height={450}
        className="w-full h-full object-contain"
      />

      {/* Talking bubble for Mini G */}
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

  // Black line track for line follower logic
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 28;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 160, 110, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Finish Line Flags
  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 12px Cairo';
  ctx.fillText('🏁 خط البداية / النهاية', w / 2 - 50, h / 2 + 125);
}

function drawMazeArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawArenaBackground(ctx, w, h);

  // Walls / Obstacles
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 2;

  // Obstacle 1
  roundRect(ctx, 120, 100, 40, 140, 8);
  ctx.fill();
  ctx.stroke();

  // Obstacle 2
  roundRect(ctx, 280, 180, 120, 40, 8);
  ctx.fill();
  ctx.stroke();

  // Star Target
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(380, 110, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px Cairo';
  ctx.fillText('⭐', 374, 115);
}

// ------------------- MODEL RENDERERS ------------------- //

function drawMiniGF(ctx: CanvasRenderingContext2D, cx: number, cy: number, state: RobotState) {
  ctx.save();
  ctx.translate(cx, cy);

  if (state.gf_vibrating) {
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }

  // Keychain Ring Top
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -95, 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-4, -75, 8, 15);

  // Head Housing
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  roundRect(ctx, -70, -60, 140, 120, 30);
  ctx.fill();
  ctx.stroke();

  // Cute Antennas
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(-70, 0, 12, 0, Math.PI * 2);
  ctx.arc(70, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  // Glossy Screen Face
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, -55, -45, 110, 85, 20);
  ctx.fill();

  // LED Glowing Eyes
  const glowColor = state.gf_ledColor || '#22c55e';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 25;
  ctx.fillStyle = glowColor;

  ctx.beginPath();
  ctx.arc(-26, -10, 14, 0, Math.PI * 2);
  ctx.arc(26, -10, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Smile
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 12, 12, 0, Math.PI);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mini G-F Keychain', 0, 95);

  ctx.restore();
}

function drawMiniGM(ctx: CanvasRenderingContext2D, cx: number, cy: number, state: RobotState) {
  ctx.save();
  ctx.translate(cx, cy);

  // Augmented Torso & Limbs
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;

  // Legs
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, -40, 90, 25, 45, 8);
  roundRect(ctx, 15, 90, 25, 45, 8);
  ctx.fill();
  ctx.stroke();

  // Body Torso
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, -55, 30, 110, 75, 20);
  ctx.fill();
  ctx.stroke();

  // Core Badge
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(0, 65, 14, 0, Math.PI * 2);
  ctx.fill();

  // Arms
  roundRect(ctx, -75, 35, 18, 50, 8);
  roundRect(ctx, 57, 35, 18, 50, 8);
  ctx.fill();

  // Rotating Head & Neck
  ctx.save();
  const rad = (state.gm_headAngle * Math.PI) / 180;
  ctx.rotate(rad);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(-15, 15, 30, 20);

  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  roundRect(ctx, -75, -95, 150, 115, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#020617';
  roundRect(ctx, -60, -80, 120, 85, 18);
  ctx.fill();

  drawExpressionEyes(ctx, state.gm_expression);

  ctx.restore();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mini G-M Desktop (+ Augmented Body)', 0, 160);

  ctx.restore();
}

function drawMiniGSpatial(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, state: RobotState) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.65, 0.65); // Scale appropriately for spatial arena

  // Mobile Wheeled Base
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#9333ea';
  ctx.lineWidth = 4;
  roundRect(ctx, -85, 100, 170, 35, 15);
  ctx.fill();
  ctx.stroke();

  // Wheels
  ctx.fillStyle = '#334155';
  roundRect(ctx, -95, 95, 20, 45, 8);
  roundRect(ctx, 75, 95, 20, 45, 8);
  ctx.fill();

  // Torso
  ctx.fillStyle = '#1e1b4b';
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  roundRect(ctx, -65, -15, 130, 115, 24);
  ctx.fill();
  ctx.stroke();

  // Core Heartbeat Pulse
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.arc(0, 40, 18, 0, Math.PI * 2);
  ctx.fill();

  // Articulated Arms
  // Left Arm
  ctx.save();
  ctx.translate(-65, 0);
  ctx.rotate((-state.g_armLeftAngle * Math.PI) / 180);
  ctx.fillStyle = '#6b21a8';
  roundRect(ctx, -18, 0, 18, 70, 8);
  ctx.fill();
  ctx.restore();

  // Right Arm
  ctx.save();
  ctx.translate(65, 0);
  ctx.rotate((state.g_armRightAngle * Math.PI) / 180);
  ctx.fillStyle = '#6b21a8';
  roundRect(ctx, 0, 0, 18, 70, 8);
  ctx.fill();
  ctx.restore();

  // Smart Head Screen with Dynamic AI Personas
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 4;
  roundRect(ctx, -70, -125, 140, 100, 24);
  ctx.fill();
  ctx.stroke();

  drawPersonaFace(ctx, state.g_activePersona, state.g_isTalking);

  ctx.restore();
}

// ------------------- SUB-RENDERERS ------------------- //

function drawExpressionEyes(ctx: CanvasRenderingContext2D, expr: string) {
  ctx.fillStyle = '#38bdf8';
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
    ctx.beginPath();
    ctx.arc(-28, -38, 16, 0, Math.PI * 2);
    ctx.arc(28, -38, 16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    roundRect(ctx, -40, -50, 24, 30, 8);
    roundRect(ctx, 16, -50, 24, 30, 8);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function drawPersonaFace(ctx: CanvasRenderingContext2D, persona: string, isTalking: boolean) {
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';

  if (persona === 'alkhwarizmi' || persona === '0') {
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 11px Cairo';
    ctx.fillText('📜 الخوارزمي', 0, -100);
    ctx.fillStyle = '#38bdf8';
    roundRect(ctx, -32, -80, 20, 15, 4);
    roundRect(ctx, 12, -80, 20, 15, 4);
    ctx.fill();
  } else if (persona === 'astronaut' || persona === '1') {
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px Cairo';
    ctx.fillText('🚀 رائد الفضاء', 0, -100);
    ctx.fillStyle = '#38bdf8';
    roundRect(ctx, -40, -85, 80, 25, 10);
    ctx.fill();
  } else {
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 11px Cairo';
    ctx.fillText('🤖 ميني جي الذكي', 0, -100);
    ctx.fillStyle = '#38bdf8';
    roundRect(ctx, -32, -80, 20, 22, 6);
    roundRect(ctx, 12, -80, 20, 22, 6);
    ctx.fill();
  }

  ctx.fillStyle = '#ec4899';
  if (isTalking) {
    const mouthHeight = 10 + Math.sin(Date.now() / 80) * 8;
    roundRect(ctx, -18, -48, 36, mouthHeight, 6);
    ctx.fill();
  } else {
    roundRect(ctx, -14, -45, 28, 6, 3);
    ctx.fill();
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
