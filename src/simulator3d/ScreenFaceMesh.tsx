import { useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { drawFace } from './ScreenFace';

interface ScreenFaceProps {
  /** Expression key from RobotState (happy/surprised/love/sleepy/cool/wink/custom) */
  expression?: string;
  /** Accent color used for glowing mouth & details (hex) */
  accent?: string;
  /** Robot currently speaking — enables lip-sync animation */
  isTalking?: boolean;
  /** Hand-drawn 8x8 pixel face (8 bytes, one bit per pixel) from the Pixel Face Designer */
  customFace?: number[] | null;
  /** Screen plane size in world units */
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * An animated robot face rendered onto a live CanvasTexture plane.
 * Eyes blink, expressions morph, and mouth lip-syncs while talking.
 */
export function ScreenFace({
  expression = 'happy',
  accent = '#38bdf8',
  isTalking = false,
  customFace = null,
  width = 1.0,
  height = 0.75,
  position = [0, 0, 0.28],
  rotation = [0, 0, 0],
}: ScreenFaceProps) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    return c;
  }, []);

  const ctx = useMemo(() => canvas.getContext('2d')!, [canvas]);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [canvas]);

  // Release the GPU texture when the face (or the whole 3D scene) unmounts —
  // prevents a memory leak on every simulator open/close.
  useEffect(() => () => {
    texture.dispose();
  }, [texture]);

  useFrame(() => {
    drawFace(ctx, { expression, t: performance.now(), accent, isTalking, customFace });
    texture.needsUpdate = true;
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
