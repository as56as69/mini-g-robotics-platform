import React, { useEffect, useRef, useState } from 'react';
import { RobotState } from '../types/robot';
import { Box, RotateCw, Eye, Sparkles } from 'lucide-react';

interface Props {
  state: RobotState;
}

export const Robot3DVisualizer: React.FC<Props> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotY, setRotY] = useState(0.3);
  const [rotX, setRotX] = useState(0.2);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Draw 3D Floor Grid
      draw3DFloor(ctx, cx, cy, rotX, rotY);

      // Render 3D Isometric Robot Model
      if (state.model === 'mini_gf') {
        draw3DMiniGF(ctx, cx, cy, rotX, rotY, state);
      } else if (state.model === 'mini_gm') {
        draw3DMiniGM(ctx, cx, cy, rotX, rotY, state);
      } else {
        draw3DMiniG(ctx, cx, cy, rotX, rotY, state);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [state, rotX, rotY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    setRotY(prev => prev + dx * 0.01);
    setRotX(prev => Math.max(-0.5, Math.min(0.8, prev + dy * 0.01)));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700/60 text-xs font-bold text-slate-200 pointer-events-none">
        <Box className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
        <span>المحاكي المجسم ثلاثي الأبعاد (3D Interactive Twin)</span>
      </div>

      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-slate-500 bg-slate-900/60 backdrop-blur px-2 py-1 rounded-md pointer-events-none">
        اسحب الماوس لتدوير الروبوت 🔄
      </div>

      <canvas ref={canvasRef} width={500} height={400} className="w-full h-full object-contain" />
    </div>
  );
};

// ------------------- 3D PROJECTION MATH ------------------- //

function project3D(x: number, y: number, z: number, cx: number, cy: number, rotX: number, rotY: number) {
  // Rotate around Y
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;

  // Rotate around X
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  const fov = 350;
  const scale = fov / (fov + z2);
  return {
    x: cx + x1 * scale,
    y: cy + y2 * scale,
    scale,
    z: z2
  };
}

function draw3DFloor(ctx: CanvasRenderingContext2D, cx: number, cy: number, rotX: number, rotY: number) {
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  const size = 180;
  const step = 45;

  for (let i = -size; i <= size; i += step) {
    const p1 = project3D(i, 80, -size, cx, cy, rotX, rotY);
    const p2 = project3D(i, 80, size, cx, cy, rotX, rotY);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const p3 = project3D(-size, 80, i, cx, cy, rotX, rotY);
    const p4 = project3D(size, 80, i, cx, cy, rotX, rotY);
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
  }
}

function draw3DMiniGF(ctx: CanvasRenderingContext2D, cx: number, cy: number, rotX: number, rotY: number, state: RobotState) {
  const p = project3D(0, 10, 0, cx, cy, rotX, rotY);
  const r = 50 * p.scale;

  // Casing Cube / Sphere
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3 * p.scale;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // LED Glow Eyes in 3D
  const eyeL = project3D(-16, 0, -35, cx, cy, rotX, rotY);
  const eyeR = project3D(16, 0, -35, cx, cy, rotX, rotY);

  const glow = state.gf_ledColor || '#38bdf8';
  ctx.fillStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(eyeL.x, eyeL.y, 8 * eyeL.scale, 0, Math.PI * 2);
  ctx.arc(eyeR.x, eyeR.y, 8 * eyeR.scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function draw3DMiniGM(ctx: CanvasRenderingContext2D, cx: number, cy: number, rotX: number, rotY: number, state: RobotState) {
  // 1. Torso Base
  const base = project3D(0, 45, 0, cx, cy, rotX, rotY);
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(base.x, base.y, 45 * base.scale, 20 * base.scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Rotating Head with servo offset
  const headRotY = rotY + (state.gm_headAngle * Math.PI) / 180;
  const head = project3D(0, -25, 0, cx, cy, rotX, headRotY);
  const r = 45 * head.scale;

  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Screen Face
  const face = project3D(0, -25, -35, cx, cy, rotX, headRotY);
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(face.x - 12 * face.scale, face.y, 6 * face.scale, 0, Math.PI * 2);
  ctx.arc(face.x + 12 * face.scale, face.y, 6 * face.scale, 0, Math.PI * 2);
  ctx.fill();
}

function draw3DMiniG(ctx: CanvasRenderingContext2D, cx: number, cy: number, rotX: number, rotY: number, state: RobotState) {
  // 1. Wheeled Base
  const base = project3D(0, 60, 0, cx, cy, rotX, rotY);
  ctx.fillStyle = '#1e1b4b';
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(base.x, base.y, 60 * base.scale, 25 * base.scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Torso
  const torso = project3D(0, 10, 0, cx, cy, rotX, rotY);
  ctx.fillStyle = '#312e81';
  ctx.beginPath();
  ctx.ellipse(torso.x, torso.y, 40 * torso.scale, 35 * torso.scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Head & AI Screen
  const head = project3D(0, -50, 0, cx, cy, rotX, rotY);
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#c084fc';
  ctx.beginPath();
  ctx.arc(head.x, head.y, 35 * head.scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Glowing Eyes
  const eyes = project3D(0, -50, -25, cx, cy, rotX, rotY);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(eyes.x - 10 * eyes.scale, eyes.y, 5 * eyes.scale, 0, Math.PI * 2);
  ctx.arc(eyes.x + 10 * eyes.scale, eyes.y, 5 * eyes.scale, 0, Math.PI * 2);
  ctx.fill();
}
