import * as THREE from 'three';

export type FaceExpression = 'happy' | 'surprised' | 'love' | 'sleepy' | 'cool' | 'wink';

/**
 * Creates the 256x256 canvas used as the robot's live screen face.
 */
export function createFaceCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  return canvas;
}

/**
 * Draws the animated robot face onto the canvas context.
 * Called every frame by ScreenFaceMesh via useFrame.
 */
export function drawFace(
  c: CanvasRenderingContext2D,
  opts: { expression: string; t: number; accent: string; isTalking: boolean }
) {
  const ctx = c;
  const { accent, isTalking, t } = opts;
  const expr = opts.expression || 'happy';

  // ---- Screen background: dark glass with vertical gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
  bgGrad.addColorStop(0, '#0b1324');
  bgGrad.addColorStop(1, '#04070d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 256, 256);

  // Faint scanlines for screen realism
  ctx.fillStyle = 'rgba(148, 163, 184, 0.05)';
  for (let y = 0; y < 256; y += 6) {
    ctx.fillRect(0, y, 256, 2);
  }

  // Vignette
  const vg = ctx.createRadialGradient(128, 128, 60, 128, 128, 175);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, 256, 256);

  const eyeY = 104;
  const gap = 62;
  const eyeL = 128 - gap;
  const eyeR = 128 + gap;

  // ---------- EYES ----------
  if (expr === 'love') {
    drawHeart(ctx, eyeL, eyeY);
    drawHeart(ctx, eyeR, eyeY);
  } else if (expr === 'sleepy') {
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(eyeL - 22, eyeY + 4);
    ctx.quadraticCurveTo(eyeL, eyeY + 14, eyeL + 20, eyeY + 4);
    ctx.moveTo(eyeR - 20, eyeY + 4);
    ctx.quadraticCurveTo(eyeR, eyeY + 14, eyeR + 20, eyeY + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(125,211,252,0.7)';
    ctx.font = 'bold 22px Cairo, sans-serif';
    ctx.fillText('z', 192, 68);
    ctx.font = 'bold 15px Cairo, sans-serif';
    ctx.fillText('z', 210, 50);
  } else if (expr === 'cool') {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    roundedPath(ctx, 42, eyeY - 28, 172, 46, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.moveTo(58, eyeY - 20);
    ctx.lineTo(88, eyeY - 20);
    ctx.lineTo(66, eyeY + 16);
    ctx.lineTo(46, eyeY + 16);
    ctx.closePath();
    ctx.fill();
  } else if (expr === 'surprised') {
    if (isBlinking(t)) {
      drawClosed(ctx, eyeL, eyeR, eyeY);
    } else {
      for (const ex of [eyeL, eyeR]) {
        const g = ctx.createRadialGradient(ex, eyeY - 6, 4, ex, eyeY, 26);
        g.addColorStop(0, '#e0f2fe');
        g.addColorStop(0.55, accent);
        g.addColorStop(1, 'rgba(2,8,23,1)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ex, eyeY, 26, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (expr === 'wink') {
    if (isBlinking(t)) {
      drawClosed(ctx, eyeL, eyeR, eyeY);
    } else {
      drawWink(ctx, eyeL, eyeY);
      drawRound(ctx, eyeR, eyeY, accent);
    }
  } else {
    if (isBlinking(t)) {
      drawClosed(ctx, eyeL, eyeR, eyeY);
    } else {
      drawHappyArc(ctx, eyeL, eyeY);
      drawHappyArc(ctx, eyeR, eyeY);
    }
  }

  // ---------- MOUTH ----------
  const mouthY = 174;
  if (expr === 'sleepy') {
    ctx.fillStyle = 'rgba(125,211,252,0.55)';
    ctx.beginPath();
    ctx.ellipse(128, mouthY + 6, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (isTalking) {
    const open = 8 + Math.abs(Math.sin(t / 90)) * 16;
    ctx.save();
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12;
    roundedPath(ctx, 128 - 28, mouthY - open / 2, 56, open, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#04101f';
    ctx.fillRect(128 - 22, mouthY - 2, 44, 4);
    ctx.restore();
  } else if (expr === 'love') {
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 146, 30, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 150, 28, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
  }
}

function isBlinking(t: number): boolean {
  return (t % 3400) < 140;
}

function drawClosed(ctx: CanvasRenderingContext2D, eyeL: number, eyeR: number, eyeY: number) {
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(eyeL - 20, eyeY);
  ctx.lineTo(eyeL + 20, eyeY);
  ctx.moveTo(eyeR - 20, eyeY);
  ctx.lineTo(eyeR + 20, eyeY);
  ctx.stroke();
}

function drawHappyArc(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(x, y + 10, 22, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();
}

function drawWink(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y + 8, 20, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();
  ctx.restore();
}

function drawRound(ctx: CanvasRenderingContext2D, x: number, y: number, accent: string) {
  const g = ctx.createRadialGradient(x, y - 6, 4, x, y, 24);
  g.addColorStop(0, '#e0f2fe');
  g.addColorStop(0.55, accent);
  g.addColorStop(1, 'rgba(2,8,23,1)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.5, 1.5);
  ctx.fillStyle = '#fb7185';
  ctx.shadowColor = '#fb7185';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-16, -2, -12, -20, 0, -6);
  ctx.bezierCurveTo(4, -18, 18, -14, 16, 6);
  ctx.bezierCurveTo(14, 6, 4, 8, 0, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundedPath(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
